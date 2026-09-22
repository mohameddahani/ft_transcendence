"""Task 2.1 acceptance checks: the tool layer.

Run inside the ai container via scripts/verify.sh.

The security half asserts over the **whole registry**, not tool by tool, so a tool
somebody adds in week 4 is covered by these tests the day it is written. That is the
point of having a `Tool` object rather than a bare dict of callables.
"""

import asyncio
from datetime import UTC, datetime
from decimal import Decimal
import json
import sys

from pydantic import ValidationError

from app.agents.tools import (
    build_staff_tools,
    FORBIDDEN_PARAMETERS,
    MEMBER_ID_ALLOWED_IN,
    build_admin_tools,
    build_member_tools,
    schemas,
)
from app.agents.tools.admin import MAX_COMMENT_CHARS
from app.agents.tools.base import tool
from app.config import get_settings
from app.db import engine as db
from app.db import reports
from app.db.scope import Scope, ScopeViolation, aggregate
from app.db.scope import select as sc_select
from app.agents.tools.schemas import GetMemberDetailArgs

FAIL = 0


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


def _param_names(schema: dict) -> set[str]:
    return set(schema.get("properties", {}))


async def main() -> None:  # noqa: C901
    await db.init_engine(get_settings())
    atlas = (await db._fetch_one("SELECT id FROM users WHERE company_name = :e",
                                 {"e": "Atlas Fitness Agadir"}))["id"]
    oasis = (await db._fetch_one("SELECT id FROM users WHERE company_name = :e",
                                 {"e": "Oasis Gym Marrakech"}))["id"]

    owner = Scope(admin_id=atlas)
    admin_tools = build_admin_tools(owner)

    # ------------------------------------------------------------ the schemas
    check("ten owner tools are registered", len(admin_tools) == 10,
          ", ".join(sorted(admin_tools)))

    # The headline guarantee. Asserted over every tool at once, so it keeps holding
    # for tools nobody has written yet.
    offenders = {
        name: sorted(_param_names(t.json_schema()) & FORBIDDEN_PARAMETERS)
        for name, t in admin_tools.items()
        if (_param_names(t.json_schema()) & FORBIDDEN_PARAMETERS)
        and name not in MEMBER_ID_ALLOWED_IN
    }
    check("no admin tool lets the model choose a tenant", not offenders, str(offenders))
    check("...not even indirectly: no schema mentions admin_id",
          not any("admin_id" in json.dumps(t.json_schema()) for t in admin_tools.values()))
    # The one exception, and it is deliberate: an owner asking about one of their own
    # members. A wrong id here returns nothing, because scope.py still filters.
    check("get_member_detail is the only tool taking a member_id",
          _param_names(admin_tools["get_member_detail"].json_schema()) == {"member_id"})

    check("every tool describes when to use it",
          all(len(t.description) > 40 for t in admin_tools.values()))
    bounded = {n: t for n, t in admin_tools.items() if "limit" in _param_names(t.json_schema())}
    check("every tool taking a limit bounds it in its schema",
          all(t.json_schema()["properties"]["limit"].get("maximum") for t in bounded.values()),
          f"{len(bounded)} tools with a limit")

    try:
        schemas.ListInactiveMembersArgs(limit=5000)
        check("an out-of-range argument is rejected", False, "ACCEPTED")
    except ValidationError:
        check("an out-of-range argument is rejected", True)

    # --------------------------------------------------------------- behaviour
    async def call(tools, name, args=None):
        out = await (tools[name].run(args) if args is not None else tools[name].run())
        json.dumps(out)   # every payload reaches the model as JSON
        return out

    overview = await call(admin_tools, "get_gym_overview")
    truth = await db._fetch_one(
        """SELECT count(DISTINCT member_id) AS n FROM memberships
           WHERE admin_id = :a AND expires_at > now() AND membership_status <> 'CANCELLED'""",
        {"a": atlas})
    check("get_gym_overview counts this gym only", overview["active_members"] == truth["n"],
          f"{overview['active_members']} active, {overview['revenue_month_to_date_mad']} MAD MTD")
    # Cancelled-but-not-yet-expired memberships are exactly the rows where deriving
    # from the date differs from reading the column, so they are what makes this
    # assertion mean something. Asserting merely that two counts differ was a
    # property of the data, not of the code -- and it passed one day and failed the
    # next when the corpus shifted.
    cancelled_future = (await db._fetch_one(
        """SELECT count(DISTINCT member_id) AS n FROM memberships WHERE admin_id = :a
           AND expires_at > now() AND membership_status = 'CANCELLED'""", {"a": atlas}))["n"]
    naive = (await db._fetch_one(
        """SELECT count(DISTINCT member_id) AS n FROM memberships
           WHERE admin_id = :a AND expires_at > now()""", {"a": atlas}))["n"]
    check("...and excludes members who cancelled but have not expired",
          cancelled_future > 0 and overview["active_members"] < naive,
          f"{cancelled_future} cancelled-but-current excluded from {naive}")

    mine = await call(admin_tools, "search_members", schemas.SearchMembersArgs(query="a", limit=50))
    ids = {m["member_id"] for m in mine["members"]}
    foreign = {r["id"] for r in await db._fetch_all(
        "SELECT id FROM members WHERE admin_id = :a", {"a": oasis})}
    check("search_members never returns another gym's member", not (ids & foreign),
          f"{len(ids)} matches")

    # The test that proves a row id is safe as a parameter: it is not validated, it
    # is scoped, and a foreign one simply finds nothing.
    theirs = (await db._fetch_one(
        "SELECT id FROM members WHERE admin_id = :a LIMIT 1", {"a": oasis}))["id"]
    stolen = await call(admin_tools, "get_member_detail",
                        schemas.GetMemberDetailArgs(member_id=theirs))
    check("get_member_detail on another gym's member finds nothing",
          stolen["found"] is False and "name" not in json.dumps(stolen),
          "not an error, not their data")

    # A small page on purpose: the bug was reporting the page size as the total
    # ("There are 25" when 38 had stopped coming), and a check with the default page
    # and `count > 0` could never have seen it.
    expiring = await call(admin_tools, "list_expiring_memberships",
                          schemas.ListExpiringMembershipsArgs(within_days=30, limit=10))
    truth = (await db._fetch_one(
        """SELECT count(*) AS n FROM memberships WHERE admin_id = :a
           AND membership_status = 'ACTIVE' AND expires_at > now()
           AND expires_at <= now() + interval '30 days'""", {"a": atlas}))["n"]
    check("list_expiring_memberships reports the real total, not the page size",
          expiring["total"] == truth and expiring["shown"] == 10 < truth,
          f"{truth} expiring, 10 shown")
    check("...each with a name and the days left",
          all(m["name"] and 0 <= m["days_left"] <= 30 for m in expiring["memberships"]))

    inactive = await call(admin_tools, "list_inactive_members",
                          schemas.ListInactiveMembersArgs(days_since_last_checkin=21, limit=5))
    truth = (await db._fetch_one(
        """SELECT count(DISTINCT ms.member_id) AS n FROM memberships ms
           WHERE ms.admin_id = :a AND ms.membership_status = 'ACTIVE' AND ms.expires_at > now()
             AND NOT EXISTS (SELECT 1 FROM attendances c WHERE c.member_id = ms.member_id
                             AND c.admin_id = :a AND c.checked_in_at >= now() - interval '21 days')""",
        {"a": atlas}))["n"]
    check("list_inactive_members reports the real total, not the page size",
          inactive["total"] == truth and inactive["shown"] == 5 < truth, f"{truth} inactive, 5 shown")
    still_visiting = await db._fetch_all(
        """SELECT 1 FROM attendances WHERE admin_id = :a AND member_id = ANY(:ids)
           AND checked_in_at > now() - interval '21 days'""",
        {"a": atlas, "ids": [m["member_id"] for m in inactive["members"]]})
    check("...and every one of them really has stopped coming", not still_visiting)

    sold = await call(admin_tools, "get_revenue",
                      schemas.GetRevenueArgs(period="all_time"))
    billed = (await db._fetch_one(
        """SELECT coalesce(sum(d.price), 0) AS t FROM memberships m
           JOIN membership_plan_durations d ON d.id = m.membership_plan_duration_id
           WHERE m.admin_id = :a""", {"a": atlas}))["t"]
    check("get_revenue reports every period the gym sold",
          Decimal(sold["revenue"][0]["billed_mad"]) == billed, f"{billed} MAD")
    # The word matters: `billed` and `collected` are the same number today only
    # because a membership is never created without a payment at the desk.
    check("...and says so, rather than calling it collected",
          "billed" in sold["basis"], sold["basis"])

    by_plan = await call(admin_tools, "get_revenue",
                         schemas.GetRevenueArgs(period="all_time", group_by="plan"))
    catalogue = {r["plan_name"] for r in await db._fetch_all(
        "SELECT plan_name FROM membership_plans WHERE admin_id = :a", {"a": atlas})}
    check("get_revenue by plan stays inside this gym's catalogue",
          {r["plan_name"] for r in by_plan["revenue"]} <= catalogue,
          f"{len(by_plan['revenue'])} plans")

    last = await call(admin_tools, "get_revenue", schemas.GetRevenueArgs(period="last_month"))
    billed_last = (await db._fetch_one(
        """SELECT coalesce(sum(d.price), 0) AS t FROM memberships m
           JOIN membership_plan_durations d ON d.id = m.membership_plan_duration_id
           WHERE m.admin_id = :a AND m.start_date >= date_trunc('month', now()) - interval '1 month'
             AND m.start_date < date_trunc('month', now())""", {"a": atlas}))["t"]
    check("get_revenue can answer 'last month'",
          Decimal(last["revenue"][0]["billed_mad"]) == billed_last, f"{billed_last} MAD")

    weekdays = await call(admin_tools, "get_attendance_stats",
                          schemas.GetAttendanceStatsArgs(period="month", group_by="weekday"))
    names = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
    check("attendance by weekday: names, not numbers, and a per-day average",
          all(r["weekday"] in names and r["average_per_day"] == round(r["check_ins"] / r["days_in_period"], 1)
              for r in weekdays["stats"]) and "totals" in weekdays["counts_are"])
    check("...counting every day of the month so far exactly once",
          sum(r["days_in_period"] for r in weekdays["stats"]) == datetime.now(UTC).day,
          f"{sum(r['days_in_period'] for r in weekdays['stats'])} days")

    stats = await call(admin_tools, "get_member_stats")
    truth = await db._fetch_one(
        """SELECT count(*) FILTER (WHERE gender = 'FEMALE') AS women,
                  count(*) FILTER (WHERE gender = 'MALE') AS men,
                  count(*) FILTER (WHERE created_at >= date_trunc('month', now())) AS joined,
                  round(avg(extract(year FROM age(birth_date)))::numeric, 1) AS age
           FROM members WHERE admin_id = :a""", {"a": atlas})
    check("get_member_stats matches the members table",
          (stats["women"], stats["men"], stats["joined_this_month"], stats["average_age"])
          == (truth["women"], truth["men"], truth["joined"], float(truth["age"])),
          f"{stats['women']} women, {stats['men']} men, {stats['joined_this_month']} new, age {stats['average_age']}")

    plans = await call(admin_tools, "list_plans")
    truth = {(r["plan_name"], r["duration_days"], str(r["price"])) for r in await db._fetch_all(
        """SELECT pl.plan_name, d.duration_days, d.price FROM membership_plans pl
           JOIN membership_plan_durations d ON d.membership_plan_id = pl.id
           WHERE pl.admin_id = :a""", {"a": atlas})}
    check("list_plans gives this gym's prices, and only this gym's",
          {(p["plan_name"], p["duration_days"], p["price_mad"]) for p in plans["plans"]} == truth,
          f"{len(truth)} prices")

    hours = await call(admin_tools, "get_attendance_stats",
                       schemas.GetAttendanceStatsArgs(period="year", group_by="hour"))
    peak = max(hours["stats"], key=lambda r: r["check_ins"])
    check("get_attendance_stats peaks in the evening, in local time",
          18 <= peak["hour"] <= 20 and isinstance(peak["hour"], int),
          f"{peak['hour']}:00 busiest, {peak['check_ins']} visits")

    feedback = await call(admin_tools, "list_recent_feedback",
                          schemas.ListRecentFeedbackArgs(limit=20, sentiment="NEGATIVE"))
    check("list_recent_feedback filters by sentiment",
          feedback["shown"] > 0
          and {f["sentiment"] for f in feedback["feedback"]} == {"NEGATIVE"})
    truth = (await db._fetch_one("SELECT count(*) AS n FROM feedbacks WHERE admin_id = :a "
                                 "AND sentiment::text = 'NEGATIVE'", {"a": atlas}))["n"]
    few = await call(admin_tools, "list_recent_feedback", schemas.ListRecentFeedbackArgs(limit=2, sentiment="NEGATIVE"))
    check("...and gives the real total, not the page size", few["total"] == truth and few["shown"] == 2,
          f"total {few['total']} (SQL {truth}), shown {few['shown']}")
    many = await call(admin_tools, "list_recent_feedback", schemas.ListRecentFeedbackArgs(limit=500))
    check("...and a limit over 50 returns 50 instead of an error", many.get("shown") == 50, str(many.get("shown")))
    first = feedback["feedback"][0]
    author = await db._fetch_one("SELECT first_name || ' ' || last_name AS name FROM members m "
                                 "JOIN feedbacks f ON f.member_id = m.id WHERE f.id = :f", {"f": first["feedback_id"]})
    check("...and names each author, so the answer need not print an id",
          all(f["member"] for f in feedback["feedback"]) and first["member"] == author["name"], first["member"])

    # ------------------------------------------------------------ member tools
    busiest = (await db._fetch_all(
        "SELECT member_id, count(*) n FROM attendances WHERE admin_id = :a"
        " GROUP BY 1 ORDER BY 2 DESC LIMIT 1", {"a": atlas}))[0]
    member = Scope(admin_id=atlas, member_id=busiest["member_id"])
    member_tools = build_member_tools(member)

    check("three member tools are registered", len(member_tools) == 3)
    check("no member tool lets the model name a member",
          not any(_param_names(t.json_schema()) & FORBIDDEN_PARAMETERS
                  for t in member_tools.values()),
          "member_id comes from the JWT, not the schema")

    # Exact, not a range: `0 < visits <= all-time total` passed for anything plausible.
    attendance = await call(member_tools, "get_my_attendance",
                            schemas.GetMyAttendanceArgs(period="year"))
    this_year = (await db._fetch_one(
        """SELECT count(*) AS n FROM attendances WHERE member_id = :m
           AND checked_in_at >= date_trunc('year', now())""", {"m": busiest["member_id"]}))["n"]
    check("get_my_attendance counts exactly the caller's visits this year",
          attendance["visits"] == this_year, f"{this_year} visits")
    check("...by named weekday, not a number",
          attendance["by_weekday"] and all(r["weekday"] in names for r in attendance["by_weekday"]))
    payments = await call(member_tools, "get_my_payments", schemas.GetMyPaymentsArgs())
    owned = {r["id"] for r in await db._fetch_all(
        "SELECT id FROM payments WHERE member_id = :m", {"m": busiest["member_id"]})}
    check("get_my_payments returns only the caller's payments",
          {p["payment_id"] for p in payments["payments"]} <= owned and owned)
    my_membership = await call(member_tools, "get_my_membership")
    truth = await db._fetch_one(
        """SELECT pl.plan_name, ms.expires_at FROM memberships ms
           JOIN membership_plans pl ON pl.id = ms.membership_plan_id
           WHERE ms.member_id = :m
           ORDER BY (ms.membership_status = 'ACTIVE' AND ms.expires_at > now()) DESC,
                    ms.expires_at DESC LIMIT 1""", {"m": busiest["member_id"]})
    check("get_my_membership names the plan and its end date (AI_SPECS 4.2)",
          (my_membership["plan"], my_membership["expires"]) == (truth["plan_name"], truth["expires_at"].date().isoformat()),
          f"{my_membership['plan']}, until {my_membership['expires']}")
    check("get_my_membership needs no arguments",
          member_tools["get_my_membership"].json_schema()["properties"] == {})

    try:
        build_member_tools(owner)
        check("member tools refuse an owner scope", False, "BUILT")
    except ScopeViolation:
        check("member tools refuse an owner scope", True, "no member_id to narrow by")
    try:
        build_admin_tools(member)
        check("admin tools refuse a member scope", False, "BUILT")
    except ScopeViolation:
        check("admin tools refuse a member scope", True, "the router cannot mix them up")

    # ------------------------------------------------------------------ hardening
    # `%` and `_` are ILIKE wildcards. Unescaped, a search for "%" returns the whole
    # gym and the model reports it as a name match.
    everyone = (await db._fetch_one(
        "SELECT count(*) AS n FROM members WHERE admin_id = :a", {"a": atlas}))["n"]
    for wildcard in ("%", "_", "%%"):
        hits = await call(admin_tools, "search_members",
                          schemas.SearchMembersArgs(query=wildcard, limit=50))
        check(f"search_members treats {wildcard!r} as text, not a wildcard",
              hits["count"] == 0, f"{hits['count']} of {everyone} members")
    real = await call(admin_tools, "search_members",
                      schemas.SearchMembersArgs(query="Omar", limit=50))
    check("...while an ordinary search still works", real["count"] > 0,
          f"{real['count']} matches for 'Omar'")

    try:
        schemas.SearchMembersArgs(query="a" * 5000)
        check("an oversized search string is rejected", False, "ACCEPTED")
    except ValidationError:
        check("an oversized search string is rejected", True)

    # The one field in any tool's output that a member wrote. It reaches the model
    # verbatim, so it is where indirect prompt injection would enter; the length cap
    # bounds the surface, and D13's system prompt has to do the rest.
    comments = await call(admin_tools, "list_recent_feedback",
                          schemas.ListRecentFeedbackArgs(limit=50))
    check("member-authored text is length-capped before the model sees it",
          all(len(f["comment"]) <= MAX_COMMENT_CHARS for f in comments["feedback"]),
          f"cap {MAX_COMMENT_CHARS} chars")

    # ----------------------------------------------------- reports.py directly
    for name, coro in (("gym_overview", reports.gym_overview(Scope(admin_id=oasis))),
                       ("members_without_recent_checkin",
                        reports.members_without_recent_checkin(Scope(admin_id=oasis))),
                       ("search_members", reports.search_members(Scope(admin_id=oasis), "a", 50))):
        result = await coro
        # A list report now returns {"total", "members"}: look inside it, or this
        # check inspects the wrapper, finds no member_id, and passes whatever is there.
        rows = result.get("members", [result]) if isinstance(result, dict) else result
        stray = [r for r in rows if r.get("member_id") in
                 {m["member_id"] for m in mine["members"]}]
        check(f"reports.{name} under another gym's scope returns none of ours", not stray)

    for name, coro in (("gym_overview", reports.gym_overview(member)),
                       ("revenue", reports.revenue(member))):
        try:
            await coro
            check(f"reports.{name} refuses a member scope", False, "RAN")
        except ScopeViolation:
            check(f"reports.{name} refuses a member scope", True)

    # ---------------------------------------------------- the guard's two paths
    @tool("boom", "raises something ordinary")
    async def boom() -> dict:
        raise RuntimeError("connection reset by peer")

    @tool("leak", "raises a scope violation")
    async def leak() -> dict:
        raise ScopeViolation("tried to read another gym")

    result = await boom.run()
    check("an ordinary failure comes back as data, not an exception",
          "error" in result and "connection reset" not in json.dumps(result),
          "and carries no exception text")
    try:
        await leak.run()
        check("a ScopeViolation is never swallowed", False, "SWALLOWED")
    except ScopeViolation:
        check("a ScopeViolation is never swallowed", True, "it is a bug, not a message")

    # date_column is an identifier formatted into SQL, so it is allowlisted too.
    try:
        await aggregate(owner, "attendances", [("COUNT", "*", "n")],
                        group_by=["hour"], date_column="id) OR 1=1 --")
        check("a derived grouping cannot inject through date_column", False, "EXECUTED")
    except ScopeViolation:
        check("a derived grouping cannot inject through date_column", True)

    # --- revenue comes from memberships, not payments (2026-09-20) -----------
    # Dahani's cron rewrites a collected payment to OVERDUE and then UNPAID as the
    # period it bought runs out, so `payment_status` cannot carry revenue. Each
    # membership row carries its own plan and price instead: exact, and it needs no
    # column he has not shipped.
    print("  -- revenue basis --")
    by_plan = await reports.revenue(owner, None, "plan")
    by_month = await reports.revenue(owner, None, "month")
    total = (await reports.revenue(owner))[0]

    check("revenue by plan names every plan that sold",
          {r["plan_name"] for r in by_plan} and all(r["billed_mad"] for r in by_plan),
          ", ".join(f"{r['plan_name']}={r['billed_mad']}" for r in by_plan[:2]))
    check("the parts sum to the total",
          sum(Decimal(r["billed_mad"]) for r in by_plan) == Decimal(total["billed_mad"])
          and sum(Decimal(r["billed_mad"]) for r in by_month) == Decimal(total["billed_mad"]),
          f"{total['billed_mad']} MAD over {total['periods_sold']} periods")

    # The number it replaces. Summing PAID under-reports by however much the cron has
    # rewritten -- this is the assertion that stops anyone quietly putting it back.
    paid_only = (await db._fetch_one(
        "SELECT coalesce(sum(amount), 0) AS n FROM payments"
        " WHERE admin_id = :a AND payment_status = 'PAID'", {"a": atlas}))["n"]
    check("...and it is more than summing PAID payments would have reported",
          Decimal(total["billed_mad"]) > paid_only,
          f"{total['billed_mad']} billed vs {paid_only} if we had trusted payment_status")

    # One definition of revenue in the service: the overview's month-to-date figure
    # must be the same number the breakdown reports for this month.
    overview = await reports.gym_overview(owner)
    this_month = datetime.now(UTC).strftime("%Y-%m")
    month_row = next((r for r in by_month if r["month"] == this_month), None)
    check("the overview agrees with the monthly breakdown",
          month_row is not None and Decimal(month_row["billed_mad"]) == overview["revenue_mtd"],
          f"{overview['revenue_mtd']} month-to-date")

    # --- staff: the admin's reach, minus the money (2026-09-20) --------------
    # Dahani's staff controllers give an employee the admin's routes for members,
    # memberships, payments, attendance and visits, and give them nothing for
    # pricing, staff management or the gym's own subscription. The assistant mirrors
    # that, and these are the assertions that keep it mirrored.
    print("  -- staff scope --")
    staff = Scope(admin_id=atlas, staff_id="staff-under-test")
    staff_tools = build_staff_tools(staff)
    owner_tools = build_admin_tools(owner)

    check("staff hold the gym-wide tools", {"get_gym_overview", "search_members",
          "list_inactive_members", "list_expiring_memberships"} <= set(staff_tools))
    check("...but not get_revenue or list_plans",
          not {"get_revenue", "list_plans"} & set(staff_tools) and "get_member_stats" in staff_tools,
          f"{len(owner_tools) - len(staff_tools)} tools fewer than the owner")
    check("no staff tool lets the model choose a tenant",
          not any(set(t.json_schema().get("properties", {})) & FORBIDDEN_PARAMETERS
                  for name, t in staff_tools.items() if name not in MEMBER_ID_ALLOWED_IN))

    # The registry is a convenience; these two are the enforcement. A wrong edit to
    # the list above changes what the model is *offered* -- it must not change what a
    # staff scope can *reach*.
    try:
        await reports.revenue(staff)
        check("revenue refuses a staff scope", False, "IT ANSWERED")
    except ScopeViolation:
        check("revenue refuses a staff scope", True, "owner-only report")
    try:
        await sc_select(staff, "membership_plan_durations", ["price"], limit=1)
        check("prices are unreadable under a staff scope", False, "IT ANSWERED")
    except ScopeViolation:
        check("prices are unreadable under a staff scope", True,
              "no staff controller for /api/membership-plans either")

    # And the overview does not merely hide the number: the subquery never runs.
    owner_overview = await reports.gym_overview(owner)
    staff_overview = await reports.gym_overview(staff)
    check("the owner overview carries revenue", "revenue_mtd" in owner_overview)
    check("the staff overview has no revenue key at all",
          "revenue_mtd" not in staff_overview, f"{sorted(staff_overview)}")
    check("...and is otherwise the same report",
          set(owner_overview) - {"revenue_mtd"} == set(staff_overview))

    # Same gym, so the operational numbers must agree: the difference is money, not
    # tenancy. A staff scope that quietly saw less would be a different bug.
    check("staff see the same members as the owner",
          staff_overview["active_members"] == owner_overview["active_members"],
          f"{staff_overview['active_members']} active")

    staff_detail = await staff_tools["get_member_detail"].run(
        GetMemberDetailArgs(member_id=(await sc_select(
            staff, "members", ["id"], limit=1))[0]["id"]))
    check("staff may read a member's payment history",
          staff_detail["found"] and "payments" in staff_detail,
          "his /api/staffs/payments gives them the ledger too")

    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
