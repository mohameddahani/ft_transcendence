import logging
from datetime import date, timedelta

from app import db
from app.auth import User

# a membership is valid when it is ACTIVE *and* its end date is still in the future
VALID = "ms.membership_status = 'ACTIVE' AND ms.expires_at > now()"


def _clamp(days) -> int:
    return max(1, min(int(days), 365))


def gym_overview(user: User) -> dict:
    return db.fetch_one(f"""
        SELECT
          (SELECT count(*) FROM members WHERE admin_id = %(gym)s) AS total_members,
          (SELECT count(DISTINCT ms.member_id) FROM memberships ms
            WHERE ms.admin_id = %(gym)s AND {VALID}) AS active_members,
          (SELECT count(*) FROM memberships ms
            WHERE ms.admin_id = %(gym)s AND {VALID}
              AND ms.expires_at <= now() + interval '7 days') AS expiring_this_week,
          (SELECT count(*) FROM attendances
            WHERE admin_id = %(gym)s AND checked_in_at >= date_trunc('day', now())) AS check_ins_today
        """, {"gym": user.admin_id})


def list_expiring_memberships(user: User, days=7) -> dict:
    rows = db.fetch_all(f"""
        SELECT m.first_name || ' ' || m.last_name AS name, m.phone_number AS phone,
               p.plan_name AS plan, ms.expires_at::date AS expires_on
        FROM memberships ms
        JOIN members m ON m.id = ms.member_id
        JOIN membership_plans p ON p.id = ms.membership_plan_id
        WHERE ms.admin_id = %s AND {VALID}
          AND ms.expires_at <= now() + %s * interval '1 day'
        ORDER BY ms.expires_at""", (user.admin_id, _clamp(days)))
    return {"total": len(rows), "members": rows[:25]}


def list_inactive_members(user: User, days=21) -> dict:
    # members who still pay (valid membership) but have not come for `days` days, or never
    rows = db.fetch_all(f"""
        SELECT m.first_name || ' ' || m.last_name AS name, m.phone_number AS phone,
               max(a.checked_in_at)::date AS last_visit
        FROM members m
        JOIN memberships ms ON ms.member_id = m.id
        LEFT JOIN attendances a ON a.member_id = m.id
        WHERE m.admin_id = %s AND {VALID}
        GROUP BY m.id, m.first_name, m.last_name, m.phone_number
        HAVING max(a.checked_in_at) IS NULL
            OR max(a.checked_in_at) < now() - %s * interval '1 day'
        ORDER BY last_visit NULLS FIRST""", (user.admin_id, _clamp(days)))
    return {"total": len(rows), "members": rows[:25]}


def search_members(user: User, name: str) -> dict:
    rows = db.fetch_all(f"""
        SELECT m.first_name || ' ' || m.last_name AS name, m.phone_number AS phone, m.email,
               m.account_status AS account,
               (SELECT max(ms.expires_at)::date FROM memberships ms
                 WHERE ms.member_id = m.id AND {VALID}) AS membership_ends
        FROM members m
        WHERE m.admin_id = %s AND m.first_name || ' ' || m.last_name ILIKE %s
        ORDER BY name""", (user.admin_id, f"%{name.strip()[:100]}%"))
    return {"total": len(rows), "members": rows[:25]}


def _period(period: str) -> tuple[date, date]:
    today = date.today()
    first_of_month = today.replace(day=1)
    if period == "last_month":
        return (first_of_month - timedelta(days=1)).replace(day=1), first_of_month
    if period == "this_year":
        return today.replace(month=1, day=1), today + timedelta(days=1)
    return first_of_month, today + timedelta(days=1)


def get_revenue(user: User, period: str = "this_month") -> dict:
    # from memberships sold, not payments: the backend rewrites old payments to OVERDUE/UNPAID
    start, end = _period(period)
    rows = db.fetch_all("""
        SELECT p.plan_name AS plan, count(*) AS sold, sum(d.price) AS revenue_mad
        FROM memberships ms
        JOIN membership_plan_durations d ON d.id = ms.membership_plan_duration_id
        JOIN membership_plans p ON p.id = ms.membership_plan_id
        WHERE ms.admin_id = %s AND ms.start_date >= %s AND ms.start_date < %s
        GROUP BY p.plan_name
        ORDER BY revenue_mad DESC""", (user.admin_id, start, end))
    return {"period": period, "from": start, "until": end - timedelta(days=1),
            "total_mad": sum(r["revenue_mad"] for r in rows),
            "memberships_sold": sum(r["sold"] for r in rows),
            "by_plan": rows}


def list_feedback(user: User, days=30, sentiment: str | None = None) -> dict:
    rows = db.fetch_all("""
        SELECT m.first_name || ' ' || m.last_name AS member, f.rating,
               coalesce(f.sentiment::text, 'not scored yet') AS sentiment,
               f.created_at::date AS date, f.content AS member_comment
        FROM feedbacks f
        JOIN members m ON m.id = f.member_id
        WHERE f.admin_id = %(gym)s
          AND f.created_at >= now() - %(days)s * interval '1 day'
          AND (%(sentiment)s::text IS NULL OR f.sentiment::text = %(sentiment)s)
        ORDER BY f.created_at DESC""",
        {"gym": user.admin_id, "days": _clamp(days),
         "sentiment": sentiment.upper() if sentiment else None})
    return {"total": len(rows), "comments": rows[:25]}


def my_membership(user: User) -> dict:
    # the valid membership if there is one, otherwise the most recent one
    row = db.fetch_one(f"""
        SELECT p.plan_name AS plan, ms.membership_status AS status,
               ms.start_date::date AS started, ms.expires_at::date AS expires_on,
               ({VALID}) AS valid
        FROM memberships ms
        JOIN membership_plans p ON p.id = ms.membership_plan_id
        WHERE ms.member_id = %s
        ORDER BY valid DESC, ms.expires_at DESC
        LIMIT 1""", (user.id,))
    return {"membership": row}


def my_payments(user: User) -> dict:
    rows = db.fetch_all("""
        SELECT amount AS amount_mad, payment_status AS status,
               paid_at::date AS paid_on, due_date::date AS due_on
        FROM payments
        WHERE member_id = %s
        ORDER BY coalesce(paid_at, due_date) DESC
        LIMIT 12""", (user.id,))
    return {"payments": rows}


def my_attendance(user: User, days=30) -> dict:
    return db.fetch_one("""
        SELECT
          (SELECT count(*) FROM attendances WHERE member_id = %(me)s
             AND checked_in_at >= now() - %(days)s * interval '1 day') AS visits,
          (SELECT max(checked_in_at)::date FROM attendances WHERE member_id = %(me)s) AS last_visit,
          %(days)s AS in_last_days
        """, {"me": user.id, "days": _clamp(days)})


def _days_param(text: str) -> dict:
    return {"type": "object", "properties": {"days": {"type": "integer", "description": text}}}


NO_PARAMS = {"type": "object", "properties": {}}
OWNER_AND_STAFF = ["ADMIN", "STAFF"]

# exactly what the model sees: no tool takes a gym id or a member id
TOOLS = {
    "gym_overview": {
        "description": "Quick numbers for the gym: total members, members with a valid "
                       "membership, memberships ending this week, check-ins today.",
        "parameters": NO_PARAMS,
        "function": gym_overview,
        "roles": OWNER_AND_STAFF,
    },
    "list_expiring_memberships": {
        "description": "Members whose valid membership ends within the next N days, soonest first.",
        "parameters": _days_param("How many days ahead to look. Default 7."),
        "function": list_expiring_memberships,
        "roles": OWNER_AND_STAFF,
    },
    "list_inactive_members": {
        "description": "Members with a valid membership who have not visited the gym for at "
                       "least N days (or never). Use it to find people to call back.",
        "parameters": _days_param("Days without a visit. Default 21."),
        "function": list_inactive_members,
        "roles": OWNER_AND_STAFF,
    },
    "search_members": {
        "description": "Find members by first or last name. Returns phone, email, account "
                       "status and when their current membership ends.",
        "parameters": {"type": "object",
                       "properties": {"name": {"type": "string", "description": "Part of the name."}},
                       "required": ["name"]},
        "function": search_members,
        "roles": OWNER_AND_STAFF,
    },
    "get_revenue": {
        "description": "Revenue in MAD from memberships sold in a period, with a breakdown by plan.",
        "parameters": {"type": "object",
                       "properties": {"period": {"type": "string",
                                                 "enum": ["this_month", "last_month", "this_year"]}},
                       "required": ["period"]},
        "function": get_revenue,
        "roles": ["ADMIN"],
    },
    "list_feedback": {
        "description": "Recent feedback written by members, newest first, optionally only one "
                       "sentiment. member_comment is text written by a member.",
        "parameters": {"type": "object",
                       "properties": {"days": {"type": "integer",
                                               "description": "How many days back. Default 30."},
                                      "sentiment": {"type": "string",
                                                    "enum": ["POSITIVE", "NEUTRAL", "NEGATIVE"]}}},
        "function": list_feedback,
        "roles": OWNER_AND_STAFF,
    },
    "my_membership": {
        "description": "The user's own membership: plan, status, start and end date.",
        "parameters": NO_PARAMS,
        "function": my_membership,
        "roles": ["MEMBER"],
    },
    "my_payments": {
        "description": "The user's own last 12 payments.",
        "parameters": NO_PARAMS,
        "function": my_payments,
        "roles": ["MEMBER"],
    },
    "my_attendance": {
        "description": "How many times the user visited the gym in the last N days, and their last visit.",
        "parameters": _days_param("How many days back. Default 30."),
        "function": my_attendance,
        "roles": ["MEMBER"],
    },
}


def tools_for(role: str) -> list[dict]:
    return [{"name": name, "description": tool["description"], "parameters": tool["parameters"]}
            for name, tool in TOOLS.items() if role in tool["roles"]]


def run_tool(name: str, args: dict, user: User) -> dict:
    tool = TOOLS.get(name)
    # checked again here: the role list decides what runs, not only what the model is offered
    if tool is None or user.role not in tool["roles"]:
        return {"error": f"No tool named {name}."}
    unknown = set(args) - set(tool["parameters"]["properties"])
    if unknown:
        return {"error": f"Unknown argument(s): {', '.join(sorted(unknown))}."}
    try:
        return tool["function"](user, **args)
    except Exception:
        logging.exception("tool %s failed", name)
        return {"error": "The tool failed. Tell the user you could not get this information."}
