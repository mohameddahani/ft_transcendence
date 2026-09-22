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
from app.agents.tools.base import WEEKDAYS, Tool, period_window, tool
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
          "Your current membership: which plan, its dates, whether it is still valid, "
          "and how many days are left.")
    async def get_my_membership() -> dict[str, Any]:
        now = naive_utc_now()
        # Several, not one. "Latest expiry" is the wrong pick after a *downgrade*:
        # the plan change leaves the old, longer membership stored EXPIRED with its
        # original future date, so ordering by date alone would tell the member they
        # are still on the plan they just left.
        rows = await select(
            scope, "memberships",
            ["id", "membership_status", "start_date", "expires_at", "membership_plan_id"],
            order_by="expires_at desc", limit=5)
        if not rows:
            return {"has_membership": False,
                    "message": "There is no membership on your account yet."}

        live = [r for r in rows
                if r["membership_status"] == StoredMembershipStatus.ACTIVE
                and r["expires_at"] > now]
        row = live[0] if live else rows[0]
        cancelled = row["membership_status"] == StoredMembershipStatus.CANCELLED
        plan = await select(scope, "membership_plans", ["plan_name"],
                            where="id = :plan", params={"plan": row["membership_plan_id"]}, limit=1)
        return {
            "has_membership": True,
            "plan": plan[0]["plan_name"] if plan else None,
            "starts": row["start_date"].date().isoformat(),
            "expires": row["expires_at"].date().isoformat(),
            # Valid needs both halves: the date, because the status column is
            # cron-maintained and can be stale; and the status, because a person can
            # end a membership before its date (plan change, cancellation).
            "currently_valid": bool(live),
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
                # Both dates are nullable since 2026-09-20, and `paid_at` is still
                # written on rows that were never collected, so it is reported only
                # when the status agrees that money arrived.
                {"payment_id": r["id"], "amount_mad": str(r["amount"]),
                 "status": r["payment_status"],
                 "due": r["due_date"].date().isoformat() if r["due_date"] else None,
                 "paid_on": (r["paid_at"].date().isoformat()
                             if r["payment_status"] == "PAID" and r["paid_at"] else None)}
                for r in rows
            ],
        }

    @tool("get_my_attendance",
          "How often you have visited in a period, on which days of the week, and "
          "when you last came.",
          schemas.GetMyAttendanceArgs)
    async def get_my_attendance(args: schemas.GetMyAttendanceArgs) -> dict[str, Any]:
        since, until = period_window(args.period, naive_utc_now())
        where, params = "checked_in_at >= :since", {"since": since}
        if until is not None:
            where, params = where + " AND checked_in_at < :until", {**params, "until": until}

        summary = (await aggregate(
            scope, "attendances",
            [("COUNT", "id", "visits"), ("MAX", "checked_in_at", "last")],
            where=where, params=params))[0]
        by_weekday = await aggregate(
            scope, "attendances", [("COUNT", "id", "visits")],
            group_by=["weekday"], date_column="checked_in_at",
            where=where, params=params, limit=7)
        return {
            "period": args.period,
            "visits": summary["visits"],
            "last_visit": summary["last"].date().isoformat() if summary["last"] else None,
            "by_weekday": [{"weekday": WEEKDAYS[r["weekday"] - 1], "visits": r["visits"]}
                           for r in by_weekday],
        }

    return {t.name: t for t in (get_my_membership, get_my_payments, get_my_attendance)}
