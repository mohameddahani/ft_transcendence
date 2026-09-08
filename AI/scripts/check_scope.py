"""Task 0.3 + 0.4 acceptance checks: tenant scoping and the boot schema contract.

Run inside the ai container via scripts/verify.sh.

Every isolation test below needs TWO gyms in the database. With one gym, "returns
Karim's members" and "returns every member" are the same result set, and the whole
file would pass against code that does no scoping at all. Run
seeder/fixtures/d4_second_gym.sql first; this script refuses to run without it.
"""

import asyncio
import sys
from decimal import Decimal

from app.config import get_settings
from app.db import engine as db
from app.db import scope as sc
from app.db.models import Member, MembershipPlanDuration, Payment
from app.db.schema import TABLES, SchemaMismatch, verify_schema

FAIL = 0


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


async def refuses(label: str, coro) -> None:
    """The query must be rejected in Python, before Postgres ever sees it."""
    try:
        await coro
        check(label, False, "ALLOWED — this is a tenant leak")
    except (sc.ScopeViolation, ValueError) as exc:
        check(label, True, type(exc).__name__)


async def main() -> None:  # noqa: C901 - a flat list of assertions reads better flat
    await db.init_engine(get_settings())

    # Anchored on email, not on row order or first name. The seeder puts 150-400
    # members in every gym, so "the first ADMIN by company name" and "the member
    # called Omar" both stopped being unique the moment task 1.2 landed. Email is
    # unique for these nine fixture rows and is inside the ai_readonly column grant;
    # user_name is unique too but is deliberately NOT granted.
    async def by_email(table: str, email: str) -> str:
        row = await db._fetch_one(f"SELECT id FROM {table} WHERE email = :e", {"e": email})
        if row is None:
            print(f"\033[31m  x fixture row {email} missing - run the D1/D4 fixtures\033[0m")
            sys.exit(1)
        return row["id"]

    atlas = await by_email("users", "karim@atlasfitness.ma")
    oasis = await by_email("users", "nadia@oasisgym.ma")

    a = sc.Scope(admin_id=atlas)
    o = sc.Scope(admin_id=oasis)

    # ---------------------------------------------------------------- 0.4 schema
    await verify_schema()
    check("schema contract matches the live database", True,
          f"{len(TABLES)} tables, {sum(len(s.columns) for s in TABLES.values())} columns")

    original = TABLES["members"].columns
    try:
        object.__setattr__(TABLES["members"], "columns", {**original, "nonexistent_col": "text"})
        try:
            await verify_schema()
            check("boot check fails on a missing column", False, "PASSED — it checks nothing")
        except SchemaMismatch as exc:
            check("boot check fails on a missing column", "nonexistent_col" in str(exc))
    finally:
        object.__setattr__(TABLES["members"], "columns", original)

    try:
        object.__setattr__(TABLES["payments"], "columns", {**TABLES["payments"].columns,
                                                           "amount": "double precision"})
        try:
            await verify_schema()
            check("boot check fails on a changed type", False, "PASSED — Decimal guarantee unguarded")
        except SchemaMismatch as exc:
            check("boot check fails on a changed type", "amount" in str(exc))
    finally:
        object.__setattr__(TABLES["payments"], "columns",
                           {**TABLES["payments"].columns, "amount": "numeric"})

    # ---------------------------------------------------- 0.3 cross-gym isolation
    for table in ("members", "memberships", "payments", "membership_plans",
                  "check_ins", "feedbacks"):
        mine = await sc.select(a, table, ["id"], limit=500)
        theirs = await sc.select(o, table, ["id"], limit=500)
        overlap = {r["id"] for r in mine} & {r["id"] for r in theirs}
        check(f"{table}: gyms see disjoint rows",
              not overlap and len(mine) > 0 and len(theirs) > 0,
              f"{len(mine)} vs {len(theirs)}")

    owners = await sc.select(a, "users", ["id", "company_name"])
    check("users: tenant rule returns only my own gym",
          len(owners) == 1 and owners[0]["id"] == atlas, owners[0]["company_name"])

    # The likeliest leak in the schema: no admin_id, scoped through a subquery. Every
    # gym's prices are distinct by construction (seeder/catalogue.py), so a leak here
    # shows up as a wrong NUMBER in an answer, not merely as a wrong row count.
    atlas_prices = {r["price"] for r in await sc.select(a, "membership_plan_durations", ["price"])}
    oasis_prices = {r["price"] for r in await sc.select(o, "membership_plan_durations", ["price"])}
    check("membership_plan_durations: pricing is isolated",
          bool(atlas_prices) and bool(oasis_prices) and not (atlas_prices & oasis_prices),
          f"{len(atlas_prices)} vs {len(oasis_prices)} prices, no overlap")
    check("...and each gym sees its own catalogue's prices",
          Decimal("300.00") in atlas_prices and Decimal("4500.00") in oasis_prices
          and Decimal("4500.00") not in atlas_prices)

    # ------------------------------------------------- the OR-escape, and why it matters
    # Proof the parenthesis wrap is load-bearing. Same intent, built by hand the
    # naive way: the caller's OR binds looser than the scope's AND and the filter
    # evaporates. If this assertion ever fails, the leak is no longer reachable and
    # the test has stopped meaning anything.
    everyones = (await db._fetch_all(
        "SELECT COUNT(*) AS n FROM membership_plan_durations"))[0]["n"]
    naive = await db._fetch_all(
        "SELECT id FROM membership_plan_durations WHERE membership_plan_id IN"
        " (SELECT id FROM membership_plans WHERE admin_id = :a) AND 1=1 OR 1=1",
        {"a": atlas})
    check("(control) unwrapped OR really does leak",
          len(naive) == everyones > len(atlas_prices),
          f"{len(naive)} rows = every gym's, not {len(atlas_prices)}")

    wrapped = await sc.select(a, "membership_plan_durations", ["price"], where="1=1 OR 1=1")
    check("select() wraps where, so OR cannot escape scope",
          {r["price"] for r in wrapped} == atlas_prices, f"{len(wrapped)} rows, own gym only")

    await refuses("where refuses an early ')' (paren escape)",
                  sc.select(a, "payments", ["id"], where="1=1) OR (1=1"))
    await refuses("where refuses an unbalanced '('",
                  sc.select(a, "payments", ["id"], where="(1=1"))
    await refuses("where refuses a string literal",
                  sc.select(a, "payments", ["id"], where="payment_status = 'PAID'"))
    await refuses("where refuses a semicolon",
                  sc.select(a, "payments", ["id"], where="1=1; DROP TABLE members"))
    await refuses("where refuses a SQL comment",
                  sc.select(a, "payments", ["id"], where="1=1 -- rest is mine"))
    await refuses("where refuses dollar quoting",
                  sc.select(a, "payments", ["id"], where="1=1 OR $$x$$=$$x$$"))
    # A nested SELECT is not covered by the tenant predicate, which constrains only
    # the outer query. Control first: the value such a subquery would see.
    peek = (await db._fetch_all("SELECT max(amount) AS m FROM payments"))[0]["m"]
    check("(control) an unscoped subquery sees every gym",
          peek == Decimal("4500.00"), f"max={peek}, Atlas' own max is 300.00")
    await refuses("where refuses a nested SELECT",
                  sc.select(a, "payments", ["id"],
                            where="amount = (SELECT max(amount) FROM payments)"))
    await refuses("where refuses UNION (it needs a SELECT)",
                  sc.select(a, "members", ["id"], where="1=1 UNION SELECT id FROM members"))

    # The supported way to compare an enum, since literals are banned.
    atlas_paid = (await db._fetch_one(
        "SELECT COUNT(*) AS n FROM payments WHERE admin_id = :a AND payment_status = 'PAID'",
        {"a": atlas}))["n"]
    paid = await sc.select(a, "payments", ["id"], where="payment_status::text = :st",
                           params={"st": "PAID"}, limit=500)
    check("enum compares via ::text with a bound param",
          len(paid) == min(atlas_paid, 500), f"{len(paid)} paid rows")

    # ----------------------------------------------------------- allowlisting
    await refuses("unknown table refused before the database",
                  sc.select(a, "user_refresh_tokens", ["id"]))
    await refuses("token table refused even by exact name",
                  sc.select(a, "member_refresh_tokens", ["id"]))
    await refuses("members.password refused by the contract",
                  sc.select(a, "members", ["id", "password"]))
    await refuses("users.password refused by the contract",
                  sc.select(a, "users", ["id", "password"]))
    await refuses("column injection refused",
                  sc.select(a, "members", ["id, (SELECT password FROM users LIMIT 1)"]))
    await refuses("empty column list refused", sc.select(a, "members", []))

    await refuses("reserved param name refused",
                  sc.select(a, "members", ["id"], where="1=1",
                            params={"scope_admin_id": oasis}))
    await refuses("limit above the cap refused", sc.select(a, "members", ["id"], limit=10_000))
    await refuses("limit of zero refused", sc.select(a, "members", ["id"], limit=0))
    await refuses("order_by injection refused",
                  sc.select(a, "members", ["id"], order_by="id; DROP TABLE members"))
    await refuses("order_by on a non-contract column refused",
                  sc.select(a, "members", ["id"], order_by="password"))

    ordered = [r["first_name"] for r in
               await sc.select(a, "members", ["first_name"], order_by="first_name desc")]
    check("order_by works when it is legal",
          len(ordered) > 1 and ordered == sorted(ordered, reverse=True),
          f"{len(ordered)} names, descending")

    capped = await sc.select(a, "members", ["id"], limit=2)
    check("limit is applied", len(capped) == 2)

    # A value that looks like SQL is still only a value.
    rows = await sc.select(a, "members", ["id"], where="first_name = :n",
                           params={"n": "x' OR '1'='1"})
    check("bound values stay data through scope()", rows == [])

    # ------------------------------------------------------------ member scoping
    omar = {"id": await by_email("members", "omar@gmail.com")}
    rachid_id = await by_email("members", "rachid@gmail.com")

    m = sc.Scope(admin_id=atlas, member_id=omar["id"])
    check("member scope is recognised", m.is_member)

    own = await sc.select(m, "members", ["id"])
    check("member sees only their own members row",
          [r["id"] for r in own] == [omar["id"]], f"{len(own)} row")
    check("member sees only their own payments",
          {r["member_id"] for r in await sc.select(m, "payments", ["member_id"])} == {omar["id"]})
    check("member sees only their own memberships",
          {r["member_id"] for r in await sc.select(m, "memberships", ["member_id"])} == {omar["id"]})
    admin_plans = len(await sc.select(a, "membership_plans", ["id"]))
    check("member still sees their gym's plans (gym-wide)",
          len(await sc.select(m, "membership_plans", ["id"])) == admin_plans,
          f"{admin_plans} plans, same as the owner sees")
    check("member sees their gym's prices, not other gyms'",
          {r["price"] for r in await sc.select(m, "membership_plan_durations", ["price"])}
          == atlas_prices)

    # Both predicates apply, so a mismatched pair returns nothing rather than
    # falling back to whichever half happens to match.
    crossed = sc.Scope(admin_id=oasis, member_id=omar["id"])
    check("member_id from another gym yields nothing",
          await sc.select(crossed, "payments", ["id"]) == [])
    foreign = sc.Scope(admin_id=oasis, member_id=rachid_id)
    check("...while the matching pair still works",
          len(await sc.select(foreign, "payments", ["id"])) == 1)

    # --------------------------------------------------------------- aggregates
    truth = await db._fetch_one(
        """SELECT COUNT(*) AS n, SUM(amount) AS revenue,
                  SUM(amount) FILTER (WHERE payment_status = 'PAID') AS collected
           FROM payments WHERE admin_id = :a""", {"a": atlas})
    total_a = (await sc.aggregate(a, "payments", [("SUM", "amount", "revenue"),
                                                  ("COUNT", "*", "n")]))[0]
    total_o = (await sc.aggregate(o, "payments", [("SUM", "amount", "revenue")]))[0]
    check("aggregate is scoped: revenue differs per gym",
          total_a["revenue"] == truth["revenue"] and total_o["revenue"] != total_a["revenue"],
          f"{total_a['revenue']} vs {total_o['revenue']} MAD")
    check("aggregate returns Decimal, not float", isinstance(total_a["revenue"], Decimal))
    check("aggregate COUNT(*) counts one gym only", total_a["n"] == truth["n"],
          f"{truth['n']} payments")

    collected = (await sc.aggregate(a, "payments", [("SUM", "amount", "revenue")],
                                    where="payment_status::text = :st",
                                    params={"st": "PAID"}))[0]
    check("aggregate honours a where fragment",
          collected["revenue"] == truth["collected"] < truth["revenue"],
          f"{collected['revenue']} of {truth['revenue']} collected")

    grouped = await sc.aggregate(a, "payments", [("COUNT", "*", "n")], group_by=["payment_status"])
    check("group_by is allowlisted and scoped",
          len(grouped) >= 2 and sum(g["n"] for g in grouped) == truth["n"])

    await refuses("aggregate refuses an unknown function",
                  sc.aggregate(a, "payments", [("EXTRACT", "amount", "x")]))
    await refuses("aggregate refuses a non-contract column",
                  sc.aggregate(a, "members", [("COUNT", "password", "x")]))
    await refuses("aggregate refuses an injected alias",
                  sc.aggregate(a, "payments", [("SUM", "amount", "x FROM users --")]))
    await refuses("aggregate refuses SUM(*)", sc.aggregate(a, "payments", [("SUM", "*", "x")]))
    await refuses("aggregate refuses a group_by outside the contract",
                  sc.aggregate(a, "members", [("COUNT", "*", "n")], group_by=["password"]))
    await refuses("aggregate refuses an early ')' in where",
                  sc.aggregate(a, "payments", [("COUNT", "*", "n")], where="1=1) OR (1=1"))

    # ----------------------------------------------- the two shadow-schema tables
    # check_ins and feedbacks arrived from seeder/pending/, not from a Prisma
    # migration. They go through exactly the same guardrails as everything else --
    # being locally created is not a reason for them to be less scoped.
    visits = await sc.select_models(a, "check_ins", order_by="checked_in_at desc", limit=20)
    check("check_ins: a scoped read parses into the model",
          len(visits) == 20 and all(v.admin_id == atlas for v in visits),
          f"latest at {visits[0].hour}:00 local")
    # A member who actually HAS visits. Omar is a fixture member and the generator
    # skips those, so scoping to him would return an empty set and the assertion
    # would hold without proving anything.
    busiest = (await db._fetch_all(
        "SELECT member_id, COUNT(*) AS n FROM check_ins WHERE admin_id = :a"
        " GROUP BY 1 ORDER BY 2 DESC LIMIT 1", {"a": atlas}))[0]
    regular = sc.Scope(admin_id=atlas, member_id=busiest["member_id"])
    mine_visits = await sc.select(regular, "check_ins", ["member_id"], limit=500)
    check("check_ins: a member sees only their own visits",
          len(mine_visits) == min(busiest["n"], 500) > 0
          and {r["member_id"] for r in mine_visits} == {busiest["member_id"]},
          f"{len(mine_visits)} rows, all theirs")
    counted = (await sc.aggregate(a, "check_ins", [("COUNT", "*", "n")]))[0]["n"]
    everyones_visits = (await db._fetch_all("SELECT COUNT(*) AS n FROM check_ins"))[0]["n"]
    check("check_ins: an aggregate counts one gym, not all four",
          0 < counted < everyones_visits, f"{counted} of {everyones_visits}")

    comments = await sc.select_models(a, "feedbacks", order_by="created_at desc", limit=10)
    check("feedbacks: a scoped read parses into the model",
          len(comments) == 10 and all(c.admin_id == atlas for c in comments),
          f"{sum(c.is_scored for c in comments)}/10 already scored")
    # A member reading their own feedback back is a member tool; a member reading
    # somebody else's is the leak this narrowing exists to prevent.
    noisy = (await db._fetch_all(
        "SELECT member_id, COUNT(*) AS n FROM feedbacks WHERE admin_id = :a"
        " GROUP BY 1 ORDER BY 2 DESC LIMIT 1", {"a": atlas}))[0]
    theirs = await sc.select(sc.Scope(admin_id=atlas, member_id=noisy["member_id"]),
                             "feedbacks", ["member_id"])
    check("feedbacks: a member sees only their own comments",
          len(theirs) == noisy["n"] > 0
          and {r["member_id"] for r in theirs} == {noisy["member_id"]},
          f"{len(theirs)} rows, all theirs")
    await refuses("feedbacks: an off-contract column is refused",
                  sc.select(a, "feedbacks", ["id", "internal_notes"]))
    await refuses("feedbacks: a nested SELECT is refused",
                  sc.select(a, "feedbacks", ["id"],
                            where="rating = (SELECT max(rating) FROM feedbacks)"))
    for table in ("check_ins", "feedbacks"):
        owner_sql, _ = sc._scope_sql(TABLES[table], a, table)
        member_sql, _ = sc._scope_sql(TABLES[table], m, table)
        check(f"{table}: a member scope narrows twice, an owner scope once",
              "admin_id = " in owner_sql and "member_id = " not in owner_sql
              and "admin_id = " in member_sql and "member_id = " in member_sql)

    # -------------------------------------------------------------- read models
    models = await sc.select_models(a, "members", order_by="first_name", limit=50)
    check("select_models parses into read models",
          len(models) == 50 and all(isinstance(x, Member) for x in models),
          models[0].full_name)
    pays = await sc.select_models(a, "payments")
    check("select_models keeps money as Decimal",
          all(isinstance(p.amount, Decimal) for p in pays) and isinstance(pays[0], Payment))
    durs = await sc.select_models(o, "membership_plan_durations")
    check("select_models works through the transitive rule",
          len(durs) == len(oasis_prices) and all(isinstance(d, MembershipPlanDuration) for d in durs)
          and Decimal("4500.00") in {d.price for d in durs})

    # ------------------------------------------------------------------- Scope
    try:
        sc.Scope(admin_id="")
        check("Scope rejects an empty admin_id", False, "ACCEPTED")
    except ValueError:
        check("Scope rejects an empty admin_id", True)
    try:
        object.__setattr__ and a.__setattr__("admin_id", oasis)
        check("Scope is immutable", False, "MUTATED")
    except Exception:
        check("Scope is immutable", True)

    # ------------------------------------------------ the back door stays closed
    check("engine exposes no public query function",
          not hasattr(db, "fetch_all") and not hasattr(db, "fetch_one"))

    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
