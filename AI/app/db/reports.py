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


def _require_gym_scope(scope: Scope, report: str) -> None:
    """Owner or staff. Both see the gym; only the owner sees what it earns."""
    if scope.is_member:
        raise ScopeViolation(f"{report} is a gym-wide report; a member scope may not run it")


def _require_owner(scope: Scope, report: str) -> None:
    """Owner only. Used by the money reports.

    Staff are refused structurally rather than by leaving a tool out of their
    registry: a registry is a list somebody edits, and this is the layer that holds
    even if that edit is wrong.
    """
    if not scope.is_owner:
        raise ScopeViolation(
            f"{report} reports the gym's own finances; only the owner scope may run it")


def _bounded(limit: int) -> int:
    return max(1, min(int(limit), MAX_ROWS))


async def gym_overview(scope: Scope, now: datetime | None = None) -> dict[str, Any]:
    """The five numbers behind "how is my gym doing?" -- in one round trip.

    Written as scalar subqueries rather than five calls to `aggregate`, for two
    reasons. It is the tool the model reaches for most, so five sequential round
    trips is the wrong default; and "active members" needs COUNT(DISTINCT member_id),
    which the aggregate builder deliberately does not expose.

    Active means `membership_status = 'ACTIVE'` **and** `expires_at` in the future --
    see `Membership.status_at`. The date check is what guardrail #6 is about: the
    status column is cron-maintained and a missed run would otherwise put a stale
    number on the first line of the first answer of the demo. The status check is
    what stops a membership superseded by a plan change from being counted twice.
    """
    _require_gym_scope(scope, "gym_overview")
    moment = now or naive_utc_now()
    day_start = moment.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = day_start.replace(day=1)

    # The revenue line is built in only for the owner, and the condition reads off
    # the `Scope` rather than an argument -- the same rule as the tenant predicate
    # itself. A staff overview does not *hide* the number afterwards; the subquery
    # never runs, so there is nothing to forget to strip.
    # Same source as `revenue()` -- memberships, not payments. Two definitions of
    # "revenue this month" in one service is how the overview and the breakdown come
    # to disagree in front of the owner.
    revenue_line = """
          (SELECT coalesce(sum(d.price), 0)
             FROM memberships m
             JOIN membership_plan_durations d ON d.id = m.membership_plan_duration_id
            WHERE m.admin_id = :admin_id AND m.start_date >= :month_start) AS revenue_mtd,"""
    params: dict[str, Any] = {
        "admin_id": scope.admin_id, "now": moment,
        "in_7": moment + timedelta(days=7), "in_30": moment + timedelta(days=30),
        "day_start": day_start,
    }
    if scope.is_owner:
        params["month_start"] = month_start
    else:
        revenue_line = ""

    row = await _engine._fetch_one(
        f"""
        SELECT
          (SELECT count(DISTINCT member_id) FROM memberships
            WHERE admin_id = :admin_id AND expires_at > :now
              AND membership_status = 'ACTIVE')                        AS active_members,
          (SELECT count(*) FROM memberships
            WHERE admin_id = :admin_id AND membership_status = 'ACTIVE'
              AND expires_at BETWEEN :now AND :in_7)                   AS expiring_7d,
          (SELECT count(*) FROM memberships
            WHERE admin_id = :admin_id AND membership_status = 'ACTIVE'
              AND expires_at BETWEEN :now AND :in_30)                  AS expiring_30d,{revenue_line}
          (SELECT count(*) FROM attendances
            WHERE admin_id = :admin_id AND checked_in_at >= :day_start) AS check_ins_today
        """,
        params,
    )
    return dict(row)


async def members_without_recent_checkin(
    scope: Scope, days: int = 21, limit: int = 25, now: datetime | None = None
) -> dict[str, Any]:
    """The churn list: members whose membership is still valid but who stopped coming.

    Returns `{"total", "members"}`. `total` is counted before the LIMIT, so the answer
    can say "38, here are 25" -- reporting the page size as the total was a real bug.

    A LEFT JOIN with `HAVING max(...) IS NULL OR max(...) < cutoff`, so somebody who
    has never visited at all is included -- they are the most urgent case on the list,
    not an edge case to skip.

    Restricted to members with a currently valid membership. Somebody whose membership
    expired four months ago has not "gone quiet"; they have left, and mixing the two
    makes the list useless for the thing it is for.
    """
    _require_gym_scope(scope, "members_without_recent_checkin")
    moment = now or naive_utc_now()
    rows = await _engine._fetch_all(
        """
        SELECT m.id, m.first_name, m.last_name, m.phone_number,
               max(c.checked_in_at) AS last_check_in,
               count(*) OVER () AS total
        FROM members m
        -- The join is scoped too. Without `AND c.admin_id`, a member id colliding
        -- across tenants would pull in another gym's visits.
        LEFT JOIN attendances c ON c.member_id = m.id AND c.admin_id = :admin_id
        WHERE m.admin_id = :admin_id
          AND EXISTS (SELECT 1 FROM memberships ms
                      WHERE ms.member_id = m.id AND ms.admin_id = :admin_id
                        AND ms.expires_at > :now AND ms.membership_status = 'ACTIVE')
        GROUP BY m.id, m.first_name, m.last_name, m.phone_number
        HAVING max(c.checked_in_at) IS NULL OR max(c.checked_in_at) < :cutoff
        ORDER BY last_check_in ASC NULLS FIRST
        LIMIT :limit
        """,
        {"admin_id": scope.admin_id, "now": moment,
         "cutoff": moment - timedelta(days=max(1, int(days))), "limit": _bounded(limit)},
    )
    members = [
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
    return {"total": rows[0]["total"] if rows else 0, "members": members}


async def expiring_memberships(
    scope: Scope, within_days: int = 7, limit: int = 50, now: datetime | None = None
) -> dict[str, Any]:
    """Valid memberships ending in the next `within_days` days, with who holds them.

    ACTIVE only: a membership superseded by a plan change is stored EXPIRED with its
    old future date, and listing it would send staff to chase someone who renewed.
    Returns `{"total", "memberships"}`, `total` counted before the LIMIT.
    """
    _require_gym_scope(scope, "expiring_memberships")
    moment = now or naive_utc_now()
    rows = await _engine._fetch_all(
        """
        SELECT ms.member_id, ms.expires_at, m.first_name, m.last_name, m.phone_number,
               count(*) OVER () AS total
        FROM memberships ms
        JOIN members m ON m.id = ms.member_id AND m.admin_id = :admin_id
        WHERE ms.admin_id = :admin_id
          AND ms.membership_status = 'ACTIVE'
          AND ms.expires_at > :now AND ms.expires_at <= :until
        ORDER BY ms.expires_at ASC
        LIMIT :limit
        """,
        {"admin_id": scope.admin_id, "now": moment,
         "until": moment + timedelta(days=max(1, int(within_days))), "limit": _bounded(limit)},
    )
    memberships = [
        {
            "member_id": r["member_id"],
            "name": f"{r['first_name']} {r['last_name']}",
            "phone_number": r["phone_number"],
            "expires": r["expires_at"].date().isoformat(),
            "days_left": (r["expires_at"] - moment).days,
        }
        for r in rows
    ]
    return {"total": rows[0]["total"] if rows else 0, "memberships": memberships}


async def member_stats(scope: Scope, now: datetime | None = None) -> dict[str, Any]:
    """Who the members are: how many, who joined recently, women and men, average age.

    Every registered member, whatever their status -- "active members" is a different
    question and `gym_overview` answers it.
    """
    _require_gym_scope(scope, "member_stats")
    moment = now or naive_utc_now()
    this_month = moment.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month = (this_month - timedelta(days=1)).replace(day=1)
    row = await _engine._fetch_one(
        """
        SELECT count(*) AS members,
               count(*) FILTER (WHERE created_at >= :this_month) AS joined_this_month,
               count(*) FILTER (WHERE created_at >= :last_month
                                  AND created_at < :this_month) AS joined_last_month,
               count(*) FILTER (WHERE gender = 'FEMALE') AS women,
               count(*) FILTER (WHERE gender = 'MALE') AS men,
               round(avg(extract(year FROM age(birth_date)))::numeric, 1) AS average_age
        FROM members
        WHERE admin_id = :admin_id
        """,
        {"admin_id": scope.admin_id, "this_month": this_month, "last_month": last_month},
    )
    stats = dict(row)
    # Decimal does not JSON-encode; an age is not money, so one decimal as a float.
    stats["average_age"] = float(stats["average_age"]) if stats["average_age"] is not None else None
    return stats


async def plan_prices(scope: Scope) -> list[dict[str, Any]]:
    """This gym's plans, each length it is sold for, and the price. Owner only:
    pricing is the owner's in Dahani's API, exactly like revenue."""
    _require_owner(scope, "plan_prices")
    rows = await _engine._fetch_all(
        """
        SELECT pl.plan_name, pl.is_active, d.duration_days, d.price
        FROM membership_plans pl
        JOIN membership_plan_durations d ON d.membership_plan_id = pl.id
        WHERE pl.admin_id = :admin_id
        ORDER BY pl.plan_name, d.duration_days
        """,
        {"admin_id": scope.admin_id},
    )
    return [{"plan_name": r["plan_name"], "on_sale": r["is_active"],
             "duration_days": r["duration_days"], "price_mad": str(r["price"])} for r in rows]


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
    _require_gym_scope(scope, "search_members")
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


async def revenue(
    scope: Scope, since: datetime | None = None, group_by: str | None = None,
    until: datetime | None = None,
) -> list[dict[str, Any]]:
    """Revenue, derived from **memberships** rather than from `payments`.

    Confirmed with Dahani on 2026-09-20, and right for two independent reasons.

    **It is exact.** A membership row carries the plan it was sold on *and* the
    duration it was sold at, so the price is one join away. The version this replaces
    matched a payment to a plan by its *amount*, because `payments` has no
    `membership_id` -- a labelled stopgap that would have silently double-counted the
    day two plans in one gym cost the same. That whole class of wrongness is gone,
    and so is the open ask for the column.

    **`payments.payment_status` cannot carry this.** His cron rewrites a collected
    payment to OVERDUE and then UNPAID as the period it bought runs out, so a member
    who renews monthly for a year leaves eleven rows saying UNPAID for cash that was
    handed over. Summing `PAID` reported roughly the last month and called it the year.

    **What this measures is `billed`: what the gym sold.** Today that equals what it
    collected, because a membership is only ever created together with a payment at
    the desk -- there is no sell-now-pay-Friday path. The answer says `billed` anyway,
    so that the day such a path exists this number is not quietly read as cash.

    `group_by` is None (one total), "month", or "plan".
    """
    _require_owner(scope, "revenue")

    # The window is appended rather than expressed as `(:since IS NULL OR ...)`.
    # SQLAlchemy's text() will not bind a `:name` immediately followed by `::`, so
    # `:since::timestamp` reaches Postgres verbatim and fails to parse -- and a NULL
    # parameter with no comparison to infer from has no type anyway.
    params: dict[str, Any] = {"admin_id": scope.admin_id}
    window = ""
    if since is not None:
        window, params["since"] = "AND m.start_date >= :since", since
    if until is not None:
        window, params["until"] = window + " AND m.start_date < :until", until

    # A cancelled membership was still sold and still paid for, so it counts. Dates
    # come from `start_date`: that is when the period was bought.
    if group_by == "plan":
        projection = "pl.plan_name, d.duration_days, d.price,"
        grouping = "GROUP BY pl.plan_name, d.duration_days, d.price ORDER BY billed DESC"
    elif group_by == "month":
        projection = "to_char(date_trunc('month', m.start_date), 'YYYY-MM') AS month,"
        grouping = "GROUP BY 1 ORDER BY 1"
    else:
        projection = ""
        grouping = ""

    rows = await _engine._fetch_all(
        f"""
        SELECT {projection}
               count(*) AS periods_sold,
               coalesce(sum(d.price), 0) AS billed
        FROM memberships m
        JOIN membership_plan_durations d ON d.id = m.membership_plan_duration_id
        JOIN membership_plans pl
          ON pl.id = m.membership_plan_id AND pl.admin_id = :admin_id
        WHERE m.admin_id = :admin_id
          {window}
        {grouping}
        """,
        params,
    )

    out: list[dict[str, Any]] = []
    for r in rows:
        entry: dict[str, Any] = {
            "periods_sold": r["periods_sold"],
            "billed_mad": str(r["billed"]),
        }
        if group_by == "plan":
            entry = {"plan_name": r["plan_name"], "duration_days": r["duration_days"],
                     "price_mad": str(r["price"]), **entry}
        elif group_by == "month":
            entry = {"month": r["month"], **entry}
        out.append(entry)
    return out
