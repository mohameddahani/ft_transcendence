"""Member tools (AI_SPECS §4.2). Three tools, and none of them takes an id.

Guardrail #4, stated precisely: **member tools take `member_id` from the verified
JWT, never from the model.** Not "validate the id the model supplies" -- there is no
id parameter to validate. `scope.member_id` came out of a signature Dahani produced
with a secret we hold, and it is closed over here before the model sees anything.

The difference matters. With a `member_id` parameter, "show me Omar's payments"
becomes a well-formed function call that some layer then has to refuse, and the
refusal is one refactor away from being forgotten. Without one, the sentence has
nowhere to go: the schema has no field for it.

`scope.py` narrows twice under a member scope -- `admin_id` AND `member_id` -- so
even a bug in this file cannot reach another member's rows.
"""

from __future__ import annotations

from typing import Any

from app.agents.tools import schemas
from app.agents.tools.base import Tool, period_start, tool
from app.db.models import StoredMembershipStatus, naive_utc_now
from app.db.scope import Scope, ScopeViolation, aggregate, select


def build_member_tools(scope: Scope) -> dict[str, Tool]:
    """The three member tools, bound to the caller's own scope.

    Refuses an owner scope at build time. A member tool running without
    `scope.member_id` would silently widen to the whole gym, and "the narrowing
    quietly did not happen" is the failure mode worth making impossible rather than
    unlikely.
    """
    if not scope.is_member:
        raise ScopeViolation("member tools require a scope carrying a verified member_id")

    @tool("get_my_membership",
          "Your current membership: plan dates, whether it is still valid, and how "
          "many days are left.")
    async def get_my_membership() -> dict[str, Any]:
        now = naive_utc_now()
        rows = await select(
            scope, "memberships",
            ["id", "membership_status", "start_date", "expires_at"],
            order_by="expires_at desc", limit=1)
        if not rows:
            return {"has_membership": False,
                    "message": "There is no membership on your account yet."}

        row = rows[0]
        cancelled = row["membership_status"] == StoredMembershipStatus.CANCELLED
        return {
            "has_membership": True,
            "starts": row["start_date"].date().isoformat(),
            "expires": row["expires_at"].date().isoformat(),
            # Derived from the date, never read from the cron-maintained column.
            # Cancellation is the one thing only that column records, so it is read
            # for that and nothing else.
            "currently_valid": row["expires_at"] > now and not cancelled,
            "cancelled": cancelled,
            "days_remaining": max(0, (row["expires_at"] - now).days),
        }

    @tool("get_my_payments",
          "Your own payment history, most recent first.",
          schemas.GetMyPaymentsArgs)
    async def get_my_payments(args: schemas.GetMyPaymentsArgs) -> dict[str, Any]:
        rows = await select(
            scope, "payments", ["id", "amount", "payment_status", "paid_at", "due_date"],
            order_by="paid_at desc", limit=args.limit)
        return {
            "count": len(rows),
            "payments": [
                {"payment_id": r["id"], "amount_mad": str(r["amount"]),
                 "status": r["payment_status"],
                 "due": r["due_date"].date().isoformat(),
                 # Only meaningful when it was actually paid: the column is NOT NULL,
                 # so an unpaid row still carries a date.
                 "paid_on": (r["paid_at"].date().isoformat()
                             if r["payment_status"] == "PAID" else None)}
                for r in rows
            ],
        }

    @tool("get_my_attendance",
          "How often you have visited in a period, and when you last came.",
          schemas.GetMyAttendanceArgs)
    async def get_my_attendance(args: schemas.GetMyAttendanceArgs) -> dict[str, Any]:
        since = period_start(args.period, naive_utc_now())
        where, params = "", {}
        if since is not None:
            where, params = "checked_in_at >= :since", {"since": since}

        summary = (await aggregate(
            scope, "check_ins",
            [("COUNT", "id", "visits"), ("MAX", "checked_in_at", "last")],
            where=where, params=params))[0]
        by_weekday = await aggregate(
            scope, "check_ins", [("COUNT", "id", "visits")],
            group_by=["weekday"], date_column="checked_in_at",
            where=where, params=params, limit=7)
        return {
            "period": args.period,
            "visits": summary["visits"],
            "last_visit": summary["last"].date().isoformat() if summary["last"] else None,
            "by_weekday": by_weekday,
        }

    return {t.name: t for t in (get_my_membership, get_my_payments, get_my_attendance)}
