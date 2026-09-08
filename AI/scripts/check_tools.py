"""Task 2.1 acceptance checks: the tool layer.

Run inside the ai container via scripts/verify.sh.

The security half asserts over the **whole registry**, not tool by tool, so a tool
somebody adds in week 4 is covered by these tests the day it is written. That is the
point of having a `Tool` object rather than a bare dict of callables.
"""

import asyncio
import json
import sys

from pydantic import ValidationError

from app.agents.tools import (
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
    atlas = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "karim@atlasfitness.ma"}))["id"]
    oasis = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "nadia@oasisgym.ma"}))["id"]

    owner = Scope(admin_id=atlas)
    admin_tools = build_admin_tools(owner)

    # ------------------------------------------------------------ the schemas
    check("eight admin tools are registered", len(admin_tools) == 8,
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

    expiring = await call(admin_tools, "list_expiring_memberships",
                          schemas.ListExpiringMembershipsArgs(within_days=7))
    check("list_expiring_memberships returns the renewal-chase list",
          expiring["count"] > 0 and all(0 <= m["days_left"] <= 7 for m in expiring["memberships"]),
          f"{expiring['count']} expiring")

    inactive = await call(admin_tools, "list_inactive_members",
                          schemas.ListInactiveMembersArgs(days_since_last_checkin=21, limit=25))
    check("list_inactive_members finds people to chase", inactive["count"] > 0,
          f"{inactive['count']} members")
    still_visiting = await db._fetch_all(
        """SELECT 1 FROM check_ins WHERE admin_id = :a AND member_id = ANY(:ids)
           AND checked_in_at > now() - interval '21 days'""",
        {"a": atlas, "ids": [m["member_id"] for m in inactive["members"]]})
    check("...and every one of them really has stopped coming", not still_visiting)

    everything = (await db._fetch_one(
        "SELECT sum(amount) AS t FROM payments WHERE admin_id = :a", {"a": atlas}))["t"]
    collected = await call(admin_tools, "get_revenue",
                           schemas.GetRevenueArgs(period="all_time"))
    total = collected["revenue"][0]["collected_mad"]
    check("get_revenue counts money received, not money due",
          float(total) < float(everything), f"{total} of {everything} MAD")

    by_plan = await call(admin_tools, "get_revenue",
                         schemas.GetRevenueArgs(period="all_time", group_by="plan"))
    catalogue = {r["plan_name"] for r in await db._fetch_all(
        "SELECT plan_name FROM membership_plans WHERE admin_id = :a", {"a": atlas})}
    check("get_revenue by plan stays inside this gym's catalogue",
          {r["plan_name"] for r in by_plan["revenue"]} <= catalogue,
          f"{len(by_plan['revenue'])} plans")

    hours = await call(admin_tools, "get_attendance_stats",
                       schemas.GetAttendanceStatsArgs(period="year", group_by="hour"))
    peak = max(hours["stats"], key=lambda r: r["check_ins"])
    check("get_attendance_stats peaks in the evening, in local time",
          18 <= peak["hour"] <= 20 and isinstance(peak["hour"], int),
          f"{peak['hour']}:00 busiest, {peak['check_ins']} visits")

    feedback = await call(admin_tools, "list_recent_feedback",
                          schemas.ListRecentFeedbackArgs(limit=20, sentiment="NEGATIVE"))
    check("list_recent_feedback filters by sentiment",
          feedback["count"] > 0
          and {f["sentiment"] for f in feedback["feedback"]} == {"NEGATIVE"})

    # ------------------------------------------------------------ member tools
    busiest = (await db._fetch_all(
        "SELECT member_id, count(*) n FROM check_ins WHERE admin_id = :a"
        " GROUP BY 1 ORDER BY 2 DESC LIMIT 1", {"a": atlas}))[0]
    member = Scope(admin_id=atlas, member_id=busiest["member_id"])
    member_tools = build_member_tools(member)

    check("three member tools are registered", len(member_tools) == 3)
    check("no member tool lets the model name a member",
          not any(_param_names(t.json_schema()) & FORBIDDEN_PARAMETERS
                  for t in member_tools.values()),
          "member_id comes from the JWT, not the schema")

    attendance = await call(member_tools, "get_my_attendance",
                            schemas.GetMyAttendanceArgs(period="year"))
    check("get_my_attendance reports only the caller's visits",
          0 < attendance["visits"] <= busiest["n"], f"{attendance['visits']} visits")
    payments = await call(member_tools, "get_my_payments", schemas.GetMyPaymentsArgs())
    owned = {r["id"] for r in await db._fetch_all(
        "SELECT id FROM payments WHERE member_id = :m", {"m": busiest["member_id"]})}
    check("get_my_payments returns only the caller's payments",
          {p["payment_id"] for p in payments["payments"]} <= owned and owned)
    await call(member_tools, "get_my_membership")
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
        rows = [result] if isinstance(result, dict) else result
        stray = [r for r in rows if r.get("member_id") in
                 {m["member_id"] for m in mine["members"]}]
        check(f"reports.{name} under another gym's scope returns none of ours", not stray)

    for name, coro in (("gym_overview", reports.gym_overview(member)),
                       ("revenue_by_plan", reports.revenue_by_plan(member))):
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
        await aggregate(owner, "check_ins", [("COUNT", "*", "n")],
                        group_by=["hour"], date_column="id) OR 1=1 --")
        check("a derived grouping cannot inject through date_column", False, "EXECUTED")
    except ScopeViolation:
        check("a derived grouping cannot inject through date_column", True)

    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
