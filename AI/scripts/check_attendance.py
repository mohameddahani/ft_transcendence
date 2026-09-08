"""Task 1.5 acceptance checks: check-in events from archetypes.

Runs on the HOST (imports `seeder/`, reads as `admin`):

    .venv/bin/python -m scripts.check_attendance

Integrity is the easy half. The half that matters is **signal**: a corpus where
everyone visits at random passes every integrity check and is still worthless,
because attendance then carries no information and every churn question returns
noise. So the tests below assert that two distinguishable populations exist, that
the week and the day have a shape, and that `list_inactive_members` has real
answers in every gym.

Also covers the plumbing for `feedbacks` -- shape, indexes, and the read model.
Its content is task 1.6.
"""

from __future__ import annotations

import asyncio
import subprocess
import sys
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import asyncpg  # noqa: E402

from app.db.models import CheckIn, Feedback, Sentiment, to_local  # noqa: E402
from seeder.attendance import ARCHETYPE_WEIGHTS, CLASS_SLOTS  # noqa: E402
from seeder.catalogue import FIXTURE_MEMBER_USERNAMES  # noqa: E402
from seeder.seed import resolve_dsn  # noqa: E402

FAIL = 0


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


async def check_integrity(conn: asyncpg.Connection) -> None:
    # The most obviously wrong row the corpus could contain: attendance from
    # somebody who was not a member that day. An owner spots it in one question.
    check("no visit outside a paid membership window",
          await conn.fetchval(
              """SELECT count(*) FROM check_ins c WHERE NOT EXISTS (
                   SELECT 1 FROM memberships m WHERE m.member_id = c.member_id
                   AND c.checked_in_at >= m.start_date AND c.checked_in_at < m.expires_at)""") == 0)
    check("no visit in the future",
          await conn.fetchval("SELECT count(*) FROM check_ins WHERE checked_in_at > now()") == 0)
    check("nobody checks in twice in one day",
          await conn.fetchval(
              """SELECT count(*) FROM (SELECT member_id, checked_in_at::date
                   FROM check_ins GROUP BY 1, 2 HAVING count(*) > 1) s""") == 0)
    # admin_id is denormalised onto check_ins so the tenant filter needs no join.
    # If it ever disagrees with the member's own gym, every scoped count is wrong.
    check("a visit's gym always matches the member's gym",
          await conn.fetchval(
              """SELECT count(*) FROM check_ins c JOIN members m ON m.id = c.member_id
                 WHERE m.admin_id <> c.admin_id""") == 0)
    check("every gym has attendance",
          await conn.fetchval(
              """SELECT count(*) FROM users u WHERE u.role = 'ADMIN' AND NOT EXISTS
                 (SELECT 1 FROM check_ins c WHERE c.admin_id = u.id)""") == 0)
    check("the fixture members are left out of the generator",
          await conn.fetchval(
              """SELECT count(*) FROM check_ins c JOIN members m ON m.id = c.member_id
                 WHERE m.user_name = ANY($1::text[])""",
              sorted(FIXTURE_MEMBER_USERNAMES)) == 0, "their history is hand-written")


async def check_signal(conn: asyncpg.Connection) -> None:
    # Local hours, because "my busiest hour" means the hour on the clock in the gym.
    # The column holds UTC instants, so this conversion is not optional.
    hours = dict(await conn.fetch(
        """SELECT extract(hour FROM checked_in_at AT TIME ZONE 'UTC'
                                AT TIME ZONE 'Africa/Casablanca')::int, count(*)
           FROM check_ins GROUP BY 1"""))
    peak = max(hours, key=hours.get)
    check("the day peaks in the evening", 18 <= peak <= 20, f"{peak}:00 is busiest")
    morning = max(range(6, 12), key=lambda h: hours.get(h, 0))
    check("...with a second, smaller morning peak",
          hours[morning] < hours[peak] and hours[morning] > hours[peak] * 0.2,
          f"{morning}:00, {hours[morning]} visits vs {hours[peak]}")
    check("no empty hour between 06:00 and 21:00",
          all(hours.get(h, 0) > 0 for h in range(6, 22)),
          "a gym with zero visits at 15:00 reads as generated")

    days = dict(await conn.fetch(
        """SELECT extract(isodow FROM checked_in_at AT TIME ZONE 'UTC'
                                  AT TIME ZONE 'Africa/Casablanca')::int, count(*)
           FROM check_ins GROUP BY 1"""))
    quietest = sorted(days, key=days.get)[:2]
    # Friday (5) and Sunday (7): midday prayer breaks Friday in half.
    check("the week has a shape, and Friday is one of the troughs",
          5 in quietest, f"quietest are isodow {sorted(quietest)}")
    check("every weekday has attendance", len(days) == 7)

    # Two populations. Without them, "who is about to churn?" is answered from noise.
    rates = await conn.fetch(
        """WITH span AS (
             SELECT member_id, min(checked_in_at) f, max(checked_in_at) l
             FROM check_ins GROUP BY 1 HAVING count(*) >= 8)
           SELECT s.member_id,
             (SELECT count(*) FROM check_ins c WHERE c.member_id = s.member_id
                AND c.checked_in_at < s.f + interval '30 days') early,
             (SELECT count(*) FROM check_ins c WHERE c.member_id = s.member_id
                AND c.checked_in_at > s.l - interval '30 days') late
           FROM span s WHERE s.l - s.f > interval '90 days'""")
    faded = sum(1 for r in rates if r["late"] < r["early"] * 0.4)
    steady = sum(1 for r in rates if r["late"] >= r["early"] * 0.7)
    check("a fading population exists", faded >= 50,
          f"{faded} of {len(rates)} dropped below 40% of their starting rate")
    check("...and a steady one, distinguishable from it", steady >= 150, f"{steady} steady")

    # The single most useful thing the assistant can tell an owner.
    inactive = await conn.fetch(
        """SELECT u.company_name, count(*) n FROM users u
           JOIN memberships m ON m.admin_id = u.id
           WHERE m.membership_status = 'ACTIVE' AND m.expires_at > now()
             AND NOT EXISTS (SELECT 1 FROM check_ins c WHERE c.member_id = m.member_id
                             AND c.checked_in_at > now() - interval '21 days')
           GROUP BY 1 ORDER BY 1""")
    check("every gym has members to chase (valid, absent 21+ days)",
          len(inactive) == 4 and all(r["n"] >= 10 for r in inactive),
          ", ".join(str(r["n"]) for r in inactive))

    counts = [r["n"] for r in await conn.fetch(
        "SELECT count(*) n FROM check_ins GROUP BY member_id ORDER BY 1")]
    median = counts[len(counts) // 2]
    check("visits per member are a long tail, not one cluster",
          max(counts) >= median * 5, f"median {median}, max {max(counts)}")
    never = await conn.fetchval(
        """SELECT count(*) FROM members m WHERE NOT EXISTS
           (SELECT 1 FROM check_ins c WHERE c.member_id = m.id)""")
    check("some members paid and never came", never > 0, f"{never} members")

    slots = await conn.fetchval(
        """SELECT count(*) FROM check_ins WHERE extract(minute FROM checked_in_at) IN (0, 5, 10)
           AND extract(hour FROM checked_in_at AT TIME ZONE 'UTC'
                                AT TIME ZONE 'Africa/Casablanca') = ANY($1::int[])""",
        sorted({h for _, h in CLASS_SLOTS}))
    check("class times produce clustered arrivals", slots > 1000,
          f"{slots} visits on the hour at a class slot")


async def check_models(conn: asyncpg.Connection) -> None:
    row = await conn.fetchrow(
        """SELECT id, admin_id, member_id, checked_in_at FROM check_ins
           ORDER BY checked_in_at DESC LIMIT 1""")
    visit = CheckIn(**dict(row))
    check("CheckIn parses into the read model", visit.checked_in_at.tzinfo is not None)
    check("...and reports the local hour, not the stored one",
          visit.hour == to_local(visit.checked_in_at).hour
          and 0 <= visit.weekday <= 6,
          f"stored {visit.checked_in_at:%H:%M}Z -> {visit.hour}:00 local")

    # feedbacks has no rows until task 1.6; the read model is still testable, and
    # the nullable pair is the part that will break if it is got wrong.
    unscored = Feedback(id="f1", admin_id="a", member_id="m", content="Great coach.",
                        rating=5, sentiment=None, sentiment_score=None,
                        created_at=datetime.now(UTC))
    check("Feedback parses before it has been scored", not unscored.is_scored)
    scored = unscored.model_copy(update={"sentiment": Sentiment.POSITIVE,
                                         "sentiment_score": Decimal("0.870")})
    check("...and after", scored.is_scored and scored.sentiment_score == Decimal("0.870"))
    check("the sentiment score stays Decimal", isinstance(scored.sentiment_score, Decimal))


async def check_shadow_schema(conn: asyncpg.Connection) -> None:
    """The two tables come from seeder/pending/, not from a Prisma migration."""
    for table, cols in (("check_ins", 6), ("feedbacks", 9)):
        found = await conn.fetchval(
            "SELECT count(*) FROM information_schema.columns WHERE table_name = $1", table)
        check(f"{table} has the shape Prisma will generate", found == cols, f"{found} columns")
    indexes = {r["indexname"] for r in await conn.fetch(
        "SELECT indexname FROM pg_indexes WHERE tablename IN ('check_ins', 'feedbacks')")}
    # These are the actual ask to Dahani: without them every attendance question
    # seq-scans a table that already holds 37k rows and will hold more.
    check("the composite indexes exist",
          {"check_ins_admin_id_checked_in_at_idx",
           "check_ins_member_id_checked_in_at_idx",
           "feedbacks_admin_id_created_at_idx"} <= indexes)
    # fetch, not fetchval: EXPLAIN returns one row per plan line, and the scan node
    # is never the first of them. The admin id is passed in rather than looked up in
    # a subquery -- otherwise the plan contains an index scan on `users` and the
    # assertion passes without ever saying anything about check_ins.
    admin_id = await conn.fetchval("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1")
    plan = [r[0].strip() for r in await conn.fetch(
        """EXPLAIN SELECT count(*) FROM check_ins
           WHERE admin_id = $1 AND checked_in_at > now() - interval '21 days'""", admin_id)]
    # Postgres has three ways to use this index -- Index Scan, Index Only Scan, or a
    # Bitmap Index Scan feeding a Bitmap Heap Scan -- and it chooses between them
    # from statistics that shift as the corpus grows. Asserting on one of them made
    # this fail on a clean rebuild for no real reason. What matters is the negative:
    # the index is named in the plan, and nothing sequential-scans the table.
    joined = " ".join(plan)
    check("...and the planner uses them for check_ins",
          "check_ins_admin_id_checked_in_at_idx" in joined
          and "Seq Scan on check_ins" not in joined,
          next((line for line in plan if "check_ins" in line), "")[:56])


async def check_seeder_properties(conn: asyncpg.Connection) -> None:
    async def fingerprint() -> tuple[str, int]:
        row = await conn.fetchrow(
            """SELECT md5(string_agg(member_id || checked_in_at::text, '|'
                          ORDER BY member_id, checked_in_at)) m, count(*) n FROM check_ins""")
        return row["m"], row["n"]

    # Seeded once first: everything here is anchored to midnight today, so a
    # database left over from yesterday would fail this for the wrong reason.
    def reseed():
        return subprocess.run([sys.executable, "-m", "seeder.seed"], cwd=ROOT,
                              capture_output=True, text=True)

    first = reseed()
    check("the seeder re-runs cleanly", first.returncode == 0, first.stderr.strip()[:60])
    before = await fingerprint()
    reseed()
    after = await fingerprint()
    check("same seed, same day, same attendance", before[0] == after[0])
    check("re-running duplicates nothing", before[1] == after[1], f"{after[1]:,} check-ins")
    check("all four archetypes are wired up", len(ARCHETYPE_WEIGHTS) == 4,
          ", ".join(ARCHETYPE_WEIGHTS))


async def main() -> int:
    conn = await asyncpg.connect(resolve_dsn(None))
    try:
        print("  -- integrity --")
        await check_integrity(conn)
        print("  -- signal --")
        await check_signal(conn)
        print("  -- read models --")
        await check_models(conn)
        print("  -- shadow schema --")
        await check_shadow_schema(conn)
        print("  -- seeder properties --")
        await check_seeder_properties(conn)
    finally:
        await conn.close()
    return FAIL


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
