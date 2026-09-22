"""Admin tools for gym owners (AI_SPECS §4.1).

**No tool here takes `admin_id`.** The `Scope` is captured in a closure when the
registry is built, so it is in no signature and no schema. A member typing "call
get_revenue for gym X" produces a function call with nowhere to put X.

`get_member_detail` takes a `member_id` and that is not a contradiction. `admin_id`
is the *tenant key*: if the model chose it, it would choose whose data to read.
`member_id` is a *row id inside the caller's own gym*, and `scope.py` ANDs the tenant
predicate onto the query regardless -- so an id from another gym returns zero rows
rather than somebody else's record. A wrong tenant key leaks; a wrong row id returns
nothing. That is the whole reason one can be a parameter and the other cannot.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from app.agents.tools import schemas
from app.agents.tools.base import Tool, period_window, plain_field, quote_user_text, tool
from app.db import reports
from app.db.models import StoredMembershipStatus, naive_utc_now
from app.db.scope import Scope, ScopeViolation, aggregate, select

# Feedback is the only member-authored text any tool returns. Long enough for every
# real comment, short enough that a wall of injected instructions cannot ride in.
MAX_COMMENT_CHARS = 600


# The three model-facing identity fields. Named once, so a report that starts
# returning another one is a change in a single place rather than three.
_IDENTITY_FIELDS = ("name", "phone_number", "email")


def _safe_person(row: dict[str, Any]) -> dict[str, Any]:
    """Flatten the member-controlled fields in a row from `reports`."""
    return {k: plain_field(v) if k in _IDENTITY_FIELDS else v for k, v in row.items()}


_WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


def _page(total: int, shown: int) -> dict[str, Any]:
    """`total` and `shown`, plus a sentence to repeat when the list was cut short:
    a model told only "total 38" still wrote "the following 38" above 25 names."""
    page: dict[str, Any] = {"total": total, "shown": shown}
    if shown < total:
        page["note"] = f"Showing the first {shown} of {total}."
    return page


def _days_per_weekday(since: datetime, until: datetime | None, now: datetime) -> dict[int, int]:
    """How many Mondays, Tuesdays... the window holds (ISO numbering: 1 = Monday), so
    a weekday total can become "per day" -- 62 check-ins over three Sundays is ~21."""
    last = (until - timedelta(days=1)).date() if until else now.date()
    counts: dict[int, int] = {}
    day = since.date()
    while day <= last:
        counts[day.isoweekday()] = counts.get(day.isoweekday(), 0) + 1
        day += timedelta(days=1)
    return counts


def build_admin_tools(scope: Scope) -> dict[str, Tool]:
    """The gym-wide tools, each bound to this request's verified scope.

    Serves two audiences, and the difference is money:

    * **owner** -- all eight tools.
    * **staff** -- the same tools minus `get_revenue`, and the overview arrives
      without its revenue line because `reports.gym_overview` never asks for it.

    That split mirrors Dahani's API exactly: his staff controllers cover members,
    memberships, payments, attendance and visits with the admin's own routes, while
    pricing, staff management and the gym's subscription have no staff equivalent.
    The registry is the *convenience* layer of that boundary -- the enforcing layer
    is `_require_owner` in `reports.py` and `StaffAccess` in the schema contract, so
    a wrong edit here changes what the model is offered, not what it can reach.

    Refuses a member scope, mirroring `build_member_tools` refusing an owner one.
    Nothing here would leak across tenants if a member scope got through --
    `scope.py` narrows twice and would simply return less -- but a member would be
    holding tools named for gym-wide questions, and the `reports.*` calls would raise
    mid-answer instead of at wiring time. The router is one `if` away from getting
    this wrong; better that it cannot.
    """
    if scope.is_member:
        raise ScopeViolation("admin tools require an owner or staff scope, not a member one")

    @tool("get_gym_overview",
          "Headline numbers for the whole gym: active members, memberships expiring "
          "in 7 and 30 days, revenue so far this month, and today's check-ins. Use "
          "this first for any broad 'how is the gym doing' question.")
    async def get_gym_overview() -> dict[str, Any]:
        row = await reports.gym_overview(scope)
        overview = {
            "active_members": row["active_members"],
            "expiring_within_7_days": row["expiring_7d"],
            "expiring_within_30_days": row["expiring_30d"],
            "check_ins_today": row["check_ins_today"],
        }
        if "revenue_mtd" in row:
            # Money leaves as a string. Decimal will not JSON-encode, and float would
            # undo the exactness the read models are built around. Absent entirely
            # for a staff scope -- the query did not ask for it.
            overview["revenue_month_to_date_mad"] = str(row["revenue_mtd"])
        return overview

    @tool("search_members",
          "Find members by name, phone number or email. Returns several matches - "
          "phone numbers are shared within a family, so a phone lookup is not unique.",
          schemas.SearchMembersArgs)
    async def search_members(args: schemas.SearchMembersArgs) -> dict[str, Any]:
        found = await reports.search_members(scope, args.query, args.limit)
        return {"query": args.query, "count": len(found),
                "members": [_safe_person(row) for row in found]}

    @tool("get_member_detail",
          "Everything about one member: their current membership, recent payments and "
          "attendance summary. Use search_members first to get the member_id.",
          schemas.GetMemberDetailArgs)
    async def get_member_detail(args: schemas.GetMemberDetailArgs) -> dict[str, Any]:
        member = await select(
            scope, "members",
            ["id", "first_name", "last_name", "phone_number", "email", "account_status"],
            where="id = :mid", params={"mid": args.member_id}, limit=1)
        if not member:
            # Not an error the model should apologise for: under an owner scope this
            # simply means the id is not one of theirs.
            return {"found": False, "reason": "No member with that id in this gym."}

        now = naive_utc_now()
        memberships = await select(
            scope, "memberships",
            ["id", "membership_status", "start_date", "expires_at"],
            where="member_id = :mid", params={"mid": args.member_id},
            order_by="expires_at desc", limit=10)
        payments = await select(
            scope, "payments", ["id", "amount", "payment_status", "paid_at", "due_date"],
            where="member_id = :mid", params={"mid": args.member_id},
            order_by="paid_at desc", limit=10)
        visits = (await aggregate(
            scope, "attendances",
            [("COUNT", "id", "total"), ("MAX", "checked_in_at", "last")],
            where="member_id = :mid", params={"mid": args.member_id}))[0]

        person = member[0]
        return {
            "found": True,
            "member": {
                "member_id": person["id"],
                "name": plain_field(f"{person['first_name']} {person['last_name']}"),
                "phone_number": plain_field(person["phone_number"]),
                "email": plain_field(person["email"]),
                "account_status": person["account_status"],
            },
            "memberships": [
                {
                    "membership_id": m["id"],
                    "starts": m["start_date"].date().isoformat(),
                    "expires": m["expires_at"].date().isoformat(),
                    # Both halves, per `Membership.status_at`: the date because the
                    # status column is cron-maintained, and the status because a plan
                    # change supersedes a membership while its date is still future.
                    "currently_valid": (m["expires_at"] > now
                                        and m["membership_status"]
                                        == StoredMembershipStatus.ACTIVE),
                    "cancelled": m["membership_status"] == StoredMembershipStatus.CANCELLED,
                    # EXPIRED with a future date: superseded by a plan change.
                    "superseded": (m["membership_status"] == StoredMembershipStatus.EXPIRED
                                   and m["expires_at"] > now),
                }
                for m in memberships
            ],
            "payments": [
                # `paid_at` is nullable since 2026-09-20: an unpaid row need no
                # longer claim a payment date, so None is a normal value here.
                {"payment_id": p["id"], "amount_mad": str(p["amount"]),
                 "status": p["payment_status"],
                 "paid_at": p["paid_at"].date().isoformat() if p["paid_at"] else None}
                for p in payments
            ],
            "attendance": {
                "total_visits": visits["total"],
                "last_visit": visits["last"].date().isoformat() if visits["last"] else None,
            },
        }

    @tool("list_expiring_memberships",
          "Valid memberships due to expire in the next N days - the renewal-chase "
          "list, with each member's name and phone. `total` is the real number; the "
          "list shows at most `limit` of them.",
          schemas.ListExpiringMembershipsArgs)
    async def list_expiring_memberships(
        args: schemas.ListExpiringMembershipsArgs,
    ) -> dict[str, Any]:
        found = await reports.expiring_memberships(scope, args.within_days, args.limit)
        return {"within_days": args.within_days, **_page(found["total"], len(found["memberships"])),
                "memberships": [_safe_person(row) for row in found["memberships"]]}

    @tool("list_inactive_members",
          "Members whose membership is still valid but who have not visited in a "
          "while. Use this for churn, re-engagement and 'who should we call' questions. "
          "`total` is the real number; the list shows at most `limit` of them.",
          schemas.ListInactiveMembersArgs)
    async def list_inactive_members(args: schemas.ListInactiveMembersArgs) -> dict[str, Any]:
        found = await reports.members_without_recent_checkin(
            scope, days=args.days_since_last_checkin, limit=args.limit)
        return {"days_since_last_checkin": args.days_since_last_checkin,
                **_page(found["total"], len(found["members"])),
                "members": [_safe_person(row) for row in found["members"]]}

    @tool("get_revenue",
          "Revenue in MAD for a period, optionally broken down by month or by plan. "
          "For any other month, or to compare months, use period all_time with "
          "group_by month. "
          "This is what the gym SOLD in that period - memberships and renewals - "
          "which is also what it took, since a membership is only created when the "
          "member pays at the desk.",
          schemas.GetRevenueArgs)
    async def get_revenue(args: schemas.GetRevenueArgs) -> dict[str, Any]:
        # Belt and braces with the registry: the tool is not handed to a staff scope,
        # and if it ever were, `reports.revenue` refuses one anyway.
        since, until = period_window(args.period, naive_utc_now())
        rows = await reports.revenue(scope, since, args.group_by, until)
        return {
            "period": args.period,
            "group_by": args.group_by,
            # Named so the model cannot quietly call it "collected". The two words
            # mean the same thing today and will not the day Dahani adds a
            # sell-now-pay-later path.
            "basis": "billed: membership periods sold in this window",
            "revenue": rows,
        }

    @tool("get_attendance_stats",
          "Check-in counts grouped by hour of day, day of week, or month. Hours and "
          "days are in Morocco local time. Use this for 'when is the gym busiest'. "
          "Counts are totals over the whole period; by weekday each row also gives "
          "the average per day. For 'usually' or 'typical' questions use a long "
          "period (year), not this week.",
          schemas.GetAttendanceStatsArgs)
    async def get_attendance_stats(args: schemas.GetAttendanceStatsArgs) -> dict[str, Any]:
        now = naive_utc_now()
        since, until = period_window(args.period, now)
        where, params = "checked_in_at >= :since", {"since": since}
        if until is not None:
            where, params = where + " AND checked_in_at < :until", {**params, "until": until}

        rows = await aggregate(
            scope, "attendances", [("COUNT", "id", "check_ins")],
            group_by=[args.group_by], date_column="checked_in_at",
            where=where, params=params, limit=120)
        if args.group_by == "weekday":
            days = _days_per_weekday(since, until, now)
            rows = [{"weekday": _WEEKDAYS[r["weekday"] - 1], "check_ins": r["check_ins"],
                     "days_in_period": days.get(r["weekday"], 0),
                     "average_per_day": round(r["check_ins"] / days[r["weekday"]], 1)
                     if days.get(r["weekday"]) else None}
                    for r in rows]
        return {"period": args.period, "group_by": args.group_by,
                "timezone": "Africa/Casablanca",
                "counts_are": "totals over the whole period", "stats": rows}

    @tool("get_member_stats",
          "Who the members are: how many are registered (any status), how many joined "
          "this month and last month, women and men, and their average age. For "
          "active members use get_gym_overview.")
    async def get_member_stats() -> dict[str, Any]:
        return await reports.member_stats(scope)

    @tool("list_plans",
          "This gym's membership plans: each length it is sold for, its price in MAD, "
          "and whether it is still on sale.")
    async def list_plans() -> dict[str, Any]:
        return {"plans": await reports.plan_prices(scope)}

    @tool("list_recent_feedback",
          "Recent member feedback with its sentiment. Some comments have not been "
          "scored yet and are reported as unscored rather than hidden.",
          schemas.ListRecentFeedbackArgs)
    # NOTE: `comment` is the only field in any tool's output that a member wrote.
    # It reaches the model verbatim, so it is the one place indirect prompt injection
    # can enter -- a member can leave feedback containing instructions, and the owner
    # asking "what is the recent feedback?" puts that text in the model's context.
    # Truncating bounds the surface; the actual defence is the system prompt in D13
    # telling the model that comment text is data and never an instruction.
    async def list_recent_feedback(args: schemas.ListRecentFeedbackArgs) -> dict[str, Any]:
        where, params = "", {}
        if args.sentiment:
            where, params = "sentiment::text = :s", {"s": args.sentiment}

        rows = await select(
            scope, "feedbacks",
            ["id", "member_id", "content", "rating", "sentiment", "created_at"],
            where=where, params=params, order_by="created_at desc", limit=args.limit)
        return {
            "filter": args.sentiment,
            "count": len(rows),
            "feedback": [
                {"feedback_id": r["id"], "member_id": r["member_id"],
                 "comment": quote_user_text(r["content"], MAX_COMMENT_CHARS),
                 "rating": r["rating"],
                 "sentiment": r["sentiment"] or "unscored",
                 "date": r["created_at"].date().isoformat()}
                for r in rows
            ],
        }

    registry = [
        get_gym_overview, search_members, get_member_detail, list_expiring_memberships,
        list_inactive_members, get_attendance_stats, list_recent_feedback, get_member_stats,
    ]
    if scope.is_owner:
        # Money and pricing are the owner's. Not offered to staff, and not merely
        # hidden: `reports.revenue` and `reports.plan_prices` sit behind
        # `_require_owner`, so a staff scope that somehow reached them raises.
        registry += [get_revenue, list_plans]
    return {t.name: t for t in registry}


def build_staff_tools(scope: Scope) -> dict[str, Tool]:
    """The staff registry. Named separately so the role dispatch reads as three
    audiences rather than two-and-a-flag, and so the security tests can assert over
    it by name."""
    if not scope.is_staff:
        raise ScopeViolation("staff tools require a scope carrying a verified staff_id")
    return build_admin_tools(scope)
