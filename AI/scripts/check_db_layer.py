"""Task 0.2 acceptance checks -- the engine layer alone, below scoping.

Uses the private `_fetch_all` deliberately: these tests are about the engine's own
guarantees, so they must reach past `scope.py` rather than through it.

Run inside the ai container via scripts/verify.sh.

Asserts the properties that are easy to break by accident later: money stays
Decimal, timestamps stay UTC-aware, expiry stays derived, and the read-only
boundary holds at all three layers (engine guard, session, database role).
"""

import asyncio
import sys
from decimal import Decimal

from app.config import get_settings
from app.db import engine as db
from app.db.models import Member, Membership, MembershipPlanDuration, Payment

FAIL = 0


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<38} {detail}")
    if not cond:
        FAIL = 1


async def main() -> None:
    await db.init_engine(get_settings())
    # Pinned to one named gym. "The first ADMIN" was fine with two gyms; the seeder
    # makes four, and the membership-status assertions below only hold for this one.
    admin = (await db._fetch_one(
        "SELECT id FROM users WHERE email = :e", {"e": "karim@atlasfitness.ma"}))["id"]
    expected_members = (await db._fetch_one(
        "SELECT COUNT(*) AS n FROM members WHERE admin_id = :a", {"a": admin}))["n"]
    expected_durations = (await db._fetch_one(
        "SELECT COUNT(*) AS n FROM membership_plan_durations d"
        " JOIN membership_plans p ON p.id = d.membership_plan_id WHERE p.admin_id = :a",
        {"a": admin}))["n"]
    # Taken before the injection probe below, so "unchanged" means unchanged.
    corpus_size = (await db._fetch_one("SELECT COUNT(*) AS n FROM members"))["n"]

    members = [Member(**r) for r in await db._fetch_all(
        "SELECT id, admin_id, first_name, last_name, phone_number, email, gender,"
        " birth_date, account_status, created_at FROM members WHERE admin_id = :a"
        " ORDER BY first_name LIMIT 500", {"a": admin})]
    check("members parse into read models", len(members) == expected_members,
          f"{expected_members} in this gym")
    check("timestamps are tz-aware UTC", all(m.created_at.tzinfo is not None for m in members))

    pays = [Payment(**r) for r in await db._fetch_all(
        "SELECT id, admin_id, member_id, amount, paid_at, due_date, payment_status"
        " FROM payments WHERE admin_id = :a", {"a": admin})]
    check("money is Decimal, never float", all(isinstance(p.amount, Decimal) for p in pays),
          f"{pays[0].amount}")
    collected = sum(p.amount for p in pays if p.is_collected)
    check("revenue excludes uncollected", collected < sum(p.amount for p in pays),
          f"{collected} collected")

    ms = [Membership(**r) for r in await db._fetch_all(
        "SELECT id, admin_id, member_id, membership_plan_id, membership_plan_duration_id,"
        " membership_status, start_date, expires_at, created_at FROM memberships"
        " WHERE admin_id = :a LIMIT 500", {"a": admin})]
    seen = {m.status.value for m in ms}
    check("status derived from expires_at",
          {"active", "expired", "expiring_soon"} <= seen, ", ".join(sorted(seen)))
    check("no cron drift right now", not any(m.status_drifted for m in ms))
    # Not ms[0]: a CANCELLED membership cannot drift by design, so flipping its
    # stored status would prove nothing.
    live = next(m for m in ms if m.membership_status != "CANCELLED")
    stale = live.model_copy(update={
        "membership_status": "ACTIVE" if live.status.value == "expired" else "EXPIRED"})
    check("drift detector fires when stale", stale.status_drifted)

    ds = [MembershipPlanDuration(**r) for r in await db._fetch_all(
        "SELECT d.id, d.membership_plan_id, d.duration_days, d.price"
        " FROM membership_plan_durations d"
        " JOIN membership_plans p ON p.id = d.membership_plan_id"
        " WHERE p.admin_id = :a", {"a": admin})]
    check("plan_durations scoped via join",
          len(ds) == expected_durations and all(isinstance(d.price, Decimal) for d in ds),
          f"{len(ds)} durations in this gym's catalogue")

    # Layer 1: the engine's own prefix guard.
    for stmt in ("UPDATE members SET first_name = 'x'", "DELETE FROM payments",
                 "INSERT INTO members (id) VALUES ('x')"):
        try:
            await db._fetch_all(stmt)
            check(f"engine refuses {stmt.split()[0]}", False, "EXECUTED")
        except ValueError:
            check(f"engine refuses {stmt.split()[0]}", True)

    # Layer 2: a write hidden in a CTE starts with WITH, so it passes the prefix
    # guard. The READ ONLY session is what stops it -- this is why both exist.
    try:
        await db._fetch_all(
            "WITH x AS (INSERT INTO members (id) VALUES ('evil') RETURNING id) SELECT id FROM x")
        check("read-only session blocks CTE write", False, "EXECUTED")
    except Exception as e:
        check("read-only session blocks CTE write", "read-only" in str(e).lower())

    # Layer 3: the database role.
    try:
        await db._fetch_all("SELECT password FROM members LIMIT 1")
        check("role denies members.password", False, "LEAKED")
    except Exception as e:
        check("role denies members.password", "permission denied" in str(e))

    rows = await db._fetch_all("SELECT id FROM members WHERE first_name = :n",
                              {"n": "x'; DROP TABLE members; --"})
    check("bound params are data, not SQL", rows == [])
    total = (await db._fetch_one("SELECT COUNT(*) AS n FROM members"))["n"]
    check("members table intact", total == corpus_size, f"{total} rows, unchanged")

    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
