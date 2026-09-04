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

    gyms = await db._fetch_all(
        "SELECT id, company_name FROM users WHERE role = 'ADMIN' ORDER BY company_name")
    if len(gyms) < 2:
        print("\033[31m  ✗ two-gym fixture missing — run seeder/fixtures/d4_second_gym.sql\033[0m")
        sys.exit(1)
    atlas, oasis = gyms[0]["id"], gyms[1]["id"]

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
    for table in ("members", "memberships", "payments", "membership_plans"):
        mine = await sc.select(a, table, ["id"], limit=500)
        theirs = await sc.select(o, table, ["id"], limit=500)
        overlap = {r["id"] for r in mine} & {r["id"] for r in theirs}
        check(f"{table}: gyms see disjoint rows",
              not overlap and len(mine) > 0 and len(theirs) > 0,
              f"{len(mine)} vs {len(theirs)}")

    owners = await sc.select(a, "users", ["id", "company_name"])
    check("users: tenant rule returns only my own gym",
          len(owners) == 1 and owners[0]["id"] == atlas, owners[0]["company_name"])

    # The likeliest leak in the schema: no admin_id, scoped through a subquery.
    atlas_prices = [r["price"] for r in await sc.select(a, "membership_plan_durations", ["price"])]
    oasis_prices = [r["price"] for r in await sc.select(o, "membership_plan_durations", ["price"])]
    check("membership_plan_durations: pricing is isolated",
          atlas_prices == [Decimal("300.00")] and oasis_prices == [Decimal("4500.00")],
          f"{atlas_prices} vs {oasis_prices}")

    # ------------------------------------------------- the OR-escape, and why it matters
    # Proof the parenthesis wrap is load-bearing. Same intent, built by hand the
    # naive way: the caller's OR binds looser than the scope's AND and the filter
    # evaporates. If this assertion ever fails, the leak is no longer reachable and
    # the test has stopped meaning anything.
    naive = await db._fetch_all(
        "SELECT id FROM membership_plan_durations WHERE membership_plan_id IN"
        " (SELECT id FROM membership_plans WHERE admin_id = :a) AND 1=1 OR 1=1",
        {"a": atlas})
    check("(control) unwrapped OR really does leak", len(naive) == 2, f"{len(naive)} rows")

    wrapped = await sc.select(a, "membership_plan_durations", ["price"], where="1=1 OR 1=1")
    check("select() wraps where, so OR cannot escape scope",
          [r["price"] for r in wrapped] == [Decimal("300.00")], f"{len(wrapped)} row")

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
    paid = await sc.select(a, "payments", ["id"], where="payment_status::text = :st",
                           params={"st": "PAID"})
    check("enum compares via ::text with a bound param", len(paid) == 2, f"{len(paid)} paid")

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

    ordered = await sc.select(a, "members", ["first_name"], order_by="first_name desc")
    check("order_by works when it is legal",
          [r["first_name"] for r in ordered] == ["Youssef", "Siham", "Omar"])

    capped = await sc.select(a, "members", ["id"], limit=2)
    check("limit is applied", len(capped) == 2)

    # A value that looks like SQL is still only a value.
    rows = await sc.select(a, "members", ["id"], where="first_name = :n",
                           params={"n": "x' OR '1'='1"})
    check("bound values stay data through scope()", rows == [])

    # ------------------------------------------------------------ member scoping
    atlas_members = await sc.select(a, "members", ["id", "first_name"], order_by="first_name")
    omar = next(r for r in atlas_members if r["first_name"] == "Omar")
    oasis_members = await sc.select(o, "members", ["id", "first_name"])

    m = sc.Scope(admin_id=atlas, member_id=omar["id"])
    check("member scope is recognised", m.is_member)

    own = await sc.select(m, "members", ["id"])
    check("member sees only their own members row",
          [r["id"] for r in own] == [omar["id"]], f"{len(own)} row")
    check("member sees only their own payments",
          {r["member_id"] for r in await sc.select(m, "payments", ["member_id"])} == {omar["id"]})
    check("member sees only their own memberships",
          {r["member_id"] for r in await sc.select(m, "memberships", ["member_id"])} == {omar["id"]})
    check("member still sees their gym's plans (gym-wide)",
          len(await sc.select(m, "membership_plans", ["id"])) == 1)
    check("member sees their gym's prices, not other gyms'",
          [r["price"] for r in await sc.select(m, "membership_plan_durations", ["price"])]
          == [Decimal("300.00")])

    # Both predicates apply, so a mismatched pair returns nothing rather than
    # falling back to whichever half happens to match.
    crossed = sc.Scope(admin_id=oasis, member_id=omar["id"])
    check("member_id from another gym yields nothing",
          await sc.select(crossed, "payments", ["id"]) == [])
    foreign = sc.Scope(admin_id=oasis, member_id=oasis_members[0]["id"])
    check("...while the matching pair still works",
          len(await sc.select(foreign, "payments", ["id"])) == 1)

    # --------------------------------------------------------------- aggregates
    total_a = (await sc.aggregate(a, "payments", [("SUM", "amount", "revenue"),
                                                  ("COUNT", "*", "n")]))[0]
    total_o = (await sc.aggregate(o, "payments", [("SUM", "amount", "revenue")]))[0]
    check("aggregate is scoped: revenue differs per gym",
          total_a["revenue"] == Decimal("900.00") and total_o["revenue"] == Decimal("9000.00"),
          f"{total_a['revenue']} vs {total_o['revenue']}")
    check("aggregate returns Decimal, not float", isinstance(total_a["revenue"], Decimal))
    check("aggregate COUNT(*) counts one gym only", total_a["n"] == 3)

    collected = (await sc.aggregate(a, "payments", [("SUM", "amount", "revenue")],
                                    where="payment_status::text = :st",
                                    params={"st": "PAID"}))[0]
    check("aggregate honours a where fragment", collected["revenue"] == Decimal("600.00"))

    grouped = await sc.aggregate(a, "payments", [("COUNT", "*", "n")], group_by=["payment_status"])
    check("group_by is allowlisted and scoped", len(grouped) == 2 and sum(g["n"] for g in grouped) == 3)

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

    # -------------------------------------------------------------- read models
    models = await sc.select_models(a, "members", order_by="first_name")
    check("select_models parses into read models",
          len(models) == 3 and all(isinstance(x, Member) for x in models),
          models[0].full_name)
    pays = await sc.select_models(a, "payments")
    check("select_models keeps money as Decimal",
          all(isinstance(p.amount, Decimal) for p in pays) and isinstance(pays[0], Payment))
    durs = await sc.select_models(o, "membership_plan_durations")
    check("select_models works through the transitive rule",
          len(durs) == 1 and isinstance(durs[0], MembershipPlanDuration)
          and durs[0].price == Decimal("4500.00"))

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
