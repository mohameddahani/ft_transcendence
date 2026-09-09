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

from datetime import timedelta
from typing import Any

from app.agents.tools import schemas
from app.agents.tools.base import Tool, period_start, plain_field, quote_user_text, tool
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


def build_admin_tools(scope: Scope) -> dict[str, Tool]:
    """The eight owner tools, each bound to this request's verified scope.

    Refuses a member scope, mirroring `build_member_tools` refusing an owner one.
    Nothing here would leak across tenants if a member scope got through --
    `scope.py` narrows twice and would simply return less -- but a member would be
    holding tools named for gym-wide questions, and the `reports.*` calls would raise
    mid-answer instead of at wiring time. The router in D13 is one `if` away from
    getting this wrong; better that it cannot.
    """
    if scope.is_member:
        raise ScopeViolation("admin tools require an owner scope, not a member one")

    @tool("get_gym_overview",
          "Headline numbers for the whole gym: active members, memberships expiring "
          "in 7 and 30 days, revenue so far this month, and today's check-ins. Use "
          "this first for any broad 'how is the gym doing' question.")
    async def get_gym_overview() -> dict[str, Any]:
        row = await reports.gym_overview(scope)
        return {
            "active_members": row["active_members"],
            "expiring_within_7_days": row["expiring_7d"],
            "expiring_within_30_days": row["expiring_30d"],
            # Money leaves as a string. Decimal will not JSON-encode, and float would
            # undo the exactness the read models are built around.
            "revenue_month_to_date_mad": str(row["revenue_mtd"]),
            "check_ins_today": row["check_ins_today"],
        }

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
            scope, "check_ins",
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
                    # Derived, not read: `membership_status` is cron-maintained and a
                    # missed run would have this reporting a lapsed member as current.
                    "currently_valid": (m["expires_at"] > now
                                        and m["membership_status"]
                                        != StoredMembershipStatus.CANCELLED),
                    "cancelled": m["membership_status"] == StoredMembershipStatus.CANCELLED,
                }
                for m in memberships
            ],
            "payments": [
                {"payment_id": p["id"], "amount_mad": str(p["amount"]),
                 "status": p["payment_status"], "paid_at": p["paid_at"].date().isoformat()}
                for p in payments
            ],
            "attendance": {
                "total_visits": visits["total"],
                "last_visit": visits["last"].date().isoformat() if visits["last"] else None,
            },
        }

    @tool("list_expiring_memberships",
          "Memberships due to expire in the next N days - the renewal-chase list. "
          "Cancelled memberships are excluded.",
          schemas.ListExpiringMembershipsArgs)
    async def list_expiring_memberships(
        args: schemas.ListExpiringMembershipsArgs,
    ) -> dict[str, Any]:
        now = naive_utc_now()
        rows = await select(
            scope, "memberships", ["id", "member_id", "expires_at"],
            # Bound parameters, not SQL literals: `INTERVAL '7 days'` cannot pass the
            # fragment grammar, and a window computed here is testable besides.
            where="expires_at BETWEEN :now AND :until AND membership_status::text <> :cancelled",
            params={"now": now, "until": now + timedelta(days=args.within_days),
                    "cancelled": StoredMembershipStatus.CANCELLED.value},
            order_by="expires_at asc", limit=100)
        return {
            "within_days": args.within_days,
            "count": len(rows),
            "memberships": [
                {"membership_id": r["id"], "member_id": r["member_id"],
                 "expires": r["expires_at"].date().isoformat(),
                 "days_left": (r["expires_at"] - now).days}
                for r in rows
            ],
        }

    @tool("list_inactive_members",
          "Members whose membership is still valid but who have not visited in a "
          "while. Use this for churn, re-engagement and 'who should we call' questions.",
          schemas.ListInactiveMembersArgs)
    async def list_inactive_members(args: schemas.ListInactiveMembersArgs) -> dict[str, Any]:
        found = await reports.members_without_recent_checkin(
            scope, days=args.days_since_last_checkin, limit=args.limit)
        return {"days_since_last_checkin": args.days_since_last_checkin,
                "count": len(found), "members": [_safe_person(row) for row in found]}

    @tool("get_revenue",
          "Collected revenue in MAD for a period, optionally broken down by month or "
          "by plan. Only money actually received is counted.",
          schemas.GetRevenueArgs)
    async def get_revenue(args: schemas.GetRevenueArgs) -> dict[str, Any]:
        now = naive_utc_now()
        since = period_start(args.period, now)

        if args.group_by == "plan":
            return {"period": args.period, "group_by": "plan",
                    "revenue": await reports.revenue_by_plan(scope, since)}

        # PAID only. `paid_at` is NOT NULL even on an unpaid row, so summing by date
        # alone counts money that never arrived (open ask #9 to Dahani).
        where = "payment_status::text = :paid"
        params: dict[str, Any] = {"paid": "PAID"}
        if since is not None:
            where += " AND paid_at >= :since"
            params["since"] = since

        rows = await aggregate(
            scope, "payments", [("SUM", "amount", "collected"), ("COUNT", "*", "payments")],
            group_by=["month"] if args.group_by == "month" else [],
            date_column="paid_at", where=where, params=params, limit=120)
        return {
            "period": args.period,
            "group_by": args.group_by,
            "revenue": [
                {**{k: v for k, v in r.items() if k not in ("collected",)},
                 "collected_mad": str(r["collected"] or 0)}
                for r in rows
            ],
        }

    @tool("get_attendance_stats",
          "Check-in counts grouped by hour of day, day of week, or month. Hours and "
          "days are in Morocco local time. Use this for 'when is the gym busiest'.",
          schemas.GetAttendanceStatsArgs)
    async def get_attendance_stats(args: schemas.GetAttendanceStatsArgs) -> dict[str, Any]:
        since = period_start(args.period, naive_utc_now())
        where, params = "", {}
        if since is not None:
            where, params = "checked_in_at >= :since", {"since": since}

        rows = await aggregate(
            scope, "check_ins", [("COUNT", "id", "check_ins")],
            group_by=[args.group_by], date_column="checked_in_at",
            where=where, params=params, limit=120)
        return {"period": args.period, "group_by": args.group_by,
                "timezone": "Africa/Casablanca", "stats": rows}

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

    return {t.name: t for t in (
        get_gym_overview, search_members, get_member_detail, list_expiring_memberships,
        list_inactive_members, get_revenue, get_attendance_stats, list_recent_feedback,
    )}
