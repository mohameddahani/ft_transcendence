"""Named, hand-written, fully scoped queries. The place joins and subqueries live.

`scope.py` refuses a nested SELECT inside a caller's `where` fragment, and that ban
is load-bearing: an unscoped subquery there reads every gym's rows and turns the
result into an oracle. But three real questions genuinely need one -- the gym
overview, the churn list, and revenue by plan -- so they get written out in full,
here, where the whole statement is ours rather than assembled from fragments at a
call site.

The rule that replaces the ban, and the one to be able to state out loud:

    a complex query is a NAMED FUNCTION in app/db/, never a fragment composed by
    a caller.

Every statement below binds `admin_id` in its own WHERE clause -- including inside
each subquery, because a scoped outer query with an unscoped subquery is exactly the
leak `scope.py` exists to prevent. `scripts/check_tools.py` runs each of these under
a foreign scope and asserts an empty result.

These are owner reports. They refuse a member scope outright: a member calling
`gym_overview` would be reading gym-wide totals, and narrowing them afterwards is a
weaker guarantee than never running the query.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Final

from app.db import engine as _engine
from app.db.models import naive_utc_now
from app.db.scope import Scope, ScopeViolation

# The same ceiling `scope.select` enforces. A report is not an exemption from it.
MAX_ROWS: Final = 500

# `%` and `_` are ILIKE wildcards. Left unescaped, a search for "%" matches every
# member in the gym -- not a tenant leak, since an owner may list their own members
# anyway, but it turns a name lookup into "everyone" and the model would report that
# as a match. The search text comes from a person via the model, so it is escaped.
_LIKE_SPECIALS: Final = str.maketrans({"\\": r"\\", "%": r"\%", "_": r"\_"})


def _require_owner(scope: Scope, report: str) -> None:
    if scope.is_member:
        raise ScopeViolation(f"{report} is an owner report; a member scope may not run it")


def _bounded(limit: int) -> int:
    return max(1, min(int(limit), MAX_ROWS))


async def gym_overview(scope: Scope, now: datetime | None = None) -> dict[str, Any]:
    """The five numbers behind "how is my gym doing?" -- in one round trip.

    Written as scalar subqueries rather than five calls to `aggregate`, for two
    reasons. It is the tool the model reaches for most, so five sequential round
    trips is the wrong default; and "active members" needs COUNT(DISTINCT member_id),
    which the aggregate builder deliberately does not expose.

    Active means `expires_at` is in the future and the membership was not cancelled --
    never `membership_status = 'ACTIVE'`. That column is maintained by a cron job
    (guardrail #6), and a missed run would quietly report a stale number here, on the
    first line of the first answer of the demo.
    """
    _require_owner(scope, "gym_overview")
    moment = now or naive_utc_now()
    day_start = moment.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = day_start.replace(day=1)

    row = await _engine._fetch_one(
        """
        SELECT
          (SELECT count(DISTINCT member_id) FROM memberships
            WHERE admin_id = :admin_id AND expires_at > :now
              AND membership_status <> 'CANCELLED')                    AS active_members,
          (SELECT count(*) FROM memberships
            WHERE admin_id = :admin_id AND membership_status <> 'CANCELLED'
              AND expires_at BETWEEN :now AND :in_7)                   AS expiring_7d,
          (SELECT count(*) FROM memberships
            WHERE admin_id = :admin_id AND membership_status <> 'CANCELLED'
              AND expires_at BETWEEN :now AND :in_30)                  AS expiring_30d,
          (SELECT coalesce(sum(amount), 0) FROM payments
            WHERE admin_id = :admin_id AND payment_status = 'PAID'
              AND paid_at >= :month_start)                             AS revenue_mtd,
          (SELECT count(*) FROM check_ins
            WHERE admin_id = :admin_id AND checked_in_at >= :day_start) AS check_ins_today
        """,
        {"admin_id": scope.admin_id, "now": moment,
         "in_7": moment + timedelta(days=7), "in_30": moment + timedelta(days=30),
         "month_start": month_start, "day_start": day_start},
    )
    return dict(row)


async def members_without_recent_checkin(
    scope: Scope, days: int = 21, limit: int = 25, now: datetime | None = None
) -> list[dict[str, Any]]:
    """The churn list: members whose membership is still valid but who stopped coming.

    A LEFT JOIN with `HAVING max(...) IS NULL OR max(...) < cutoff`, so somebody who
    has never visited at all is included -- they are the most urgent case on the list,
    not an edge case to skip.

    Restricted to members with a currently valid membership. Somebody whose membership
    expired four months ago has not "gone quiet"; they have left, and mixing the two
    makes the list useless for the thing it is for.
    """
    _require_owner(scope, "members_without_recent_checkin")
    moment = now or naive_utc_now()
    rows = await _engine._fetch_all(
        """
        SELECT m.id, m.first_name, m.last_name, m.phone_number,
               max(c.checked_in_at) AS last_check_in
        FROM members m
        -- The join is scoped too. Without `AND c.admin_id`, a member id colliding
        -- across tenants would pull in another gym's visits.
        LEFT JOIN check_ins c ON c.member_id = m.id AND c.admin_id = :admin_id
        WHERE m.admin_id = :admin_id
          AND EXISTS (SELECT 1 FROM memberships ms
                      WHERE ms.member_id = m.id AND ms.admin_id = :admin_id
                        AND ms.expires_at > :now AND ms.membership_status <> 'CANCELLED')
        GROUP BY m.id, m.first_name, m.last_name, m.phone_number
        HAVING max(c.checked_in_at) IS NULL OR max(c.checked_in_at) < :cutoff
        ORDER BY last_check_in ASC NULLS FIRST
        LIMIT :limit
        """,
        {"admin_id": scope.admin_id, "now": moment,
         "cutoff": moment - timedelta(days=max(1, int(days))), "limit": _bounded(limit)},
    )
    return [
        {
            "member_id": r["id"],
            "name": f"{r['first_name']} {r['last_name']}",
            "phone_number": r["phone_number"],
            "last_check_in": r["last_check_in"].date().isoformat() if r["last_check_in"] else None,
            "days_since_last_visit": (
                (moment - r["last_check_in"]).days if r["last_check_in"] else None),
        }
        for r in rows
    ]


async def search_members(
    scope: Scope, query: str, limit: int = 10
) -> list[dict[str, Any]]:
    """Name or phone lookup, including full name.

    Here rather than as a `where` fragment because matching a full name needs
    `first_name || ' ' || last_name`, and that space is a string literal -- which
    the fragment grammar bans, for the good reason that a caller-supplied literal is
    how injection gets in.

    Returns a list, always. `phone_number` is deliberately not unique: families share
    a handset, so a phone lookup legitimately matches several people and collapsing
    that to one would show a member the wrong person's record.
    """
    _require_owner(scope, "search_members")
    # Bounded before it becomes a pattern: the model can be talked into passing a
    # very long string, and there is no name worth matching past 120 characters.
    pattern = f"%{query.strip()[:120].translate(_LIKE_SPECIALS)}%"
    rows = await _engine._fetch_all(
        """
        SELECT id, first_name, last_name, phone_number, email, account_status
        FROM members
        WHERE admin_id = :admin_id
          AND (first_name ILIKE :q OR last_name ILIKE :q OR phone_number ILIKE :q
               OR email ILIKE :q OR (first_name || ' ' || last_name) ILIKE :q)
        ORDER BY first_name, last_name
        LIMIT :limit
        """,
        {"admin_id": scope.admin_id, "q": pattern, "limit": _bounded(limit)},
    )
    return [
        {"member_id": r["id"], "name": f"{r['first_name']} {r['last_name']}",
         "phone_number": r["phone_number"], "email": r["email"],
         "account_status": r["account_status"]}
        for r in rows
    ]


async def revenue_by_plan(scope: Scope, since: datetime | None = None) -> list[dict[str, Any]]:
    """Collected revenue broken down by plan.

    **This is a stopgap and should be read as one.** `payments` has no
    `membership_id`, so there is no honest join from a payment to the plan it
    settled -- that is ask #6 to Dahani and it is still open. Until it lands, the
    amount is matched against the gym's own price list, which works only because
    every price inside a gym is distinct (`scripts/check_seed.py` asserts it). The
    day two plans in one gym cost the same, this silently double-counts.

    Collected means PAID. `paid_at` is NOT NULL even on an unpaid row, so summing by
    date alone counts money that never arrived.
    """
    _require_owner(scope, "revenue_by_plan")
    # The window is appended rather than expressed as `(:since IS NULL OR ...)`.
    # SQLAlchemy's text() will not bind a `:name` immediately followed by `::`, so
    # `:since::timestamp` reaches Postgres verbatim and fails to parse -- and a NULL
    # parameter with no comparison to infer from has no type anyway.
    params: dict[str, Any] = {"admin_id": scope.admin_id, "paid": "PAID"}
    window = ""
    if since is not None:
        window, params["since"] = "AND pay.paid_at >= :since", since

    rows = await _engine._fetch_all(
        f"""
        SELECT pl.plan_name, d.duration_days, d.price,
               count(*) AS payments, sum(pay.amount) AS collected
        FROM payments pay
        JOIN membership_plan_durations d ON d.price = pay.amount
        JOIN membership_plans pl
          ON pl.id = d.membership_plan_id AND pl.admin_id = :admin_id
        WHERE pay.admin_id = :admin_id
          AND pay.payment_status::text = :paid
          {window}
        GROUP BY pl.plan_name, d.duration_days, d.price
        ORDER BY collected DESC
        """,
        params,
    )
    return [
        {
            "plan_name": r["plan_name"],
            "duration_days": r["duration_days"],
            "price_mad": str(r["price"]),
            "payments": r["payments"],
            "collected_mad": str(r["collected"]),
        }
        for r in rows
    ]
