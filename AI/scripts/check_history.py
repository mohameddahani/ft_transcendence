"""Tasks 1.3 + 1.4 acceptance checks: membership history and payments.

Runs on the HOST (imports `seeder/`, reads as `admin`):

    .venv/bin/python -m scripts.check_history

Three groups. Structure is what must never be wrong -- overlaps, lengths, ordering.
Journeys is what makes the demo work: if the corpus contains no lapsed member, the
churn question has no answer no matter how good the agent is. Payments is where the
money has to reconcile against the catalogue.
"""

from __future__ import annotations

import asyncio
import subprocess
import sys
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import asyncpg  # noqa: E402

from app.db.models import (  # noqa: E402
    DerivedMembershipStatus,
    Membership,
    StoredMembershipStatus,
)
from seeder.catalogue import FIXTURE_MEMBER_USERNAMES  # noqa: E402
from seeder.history import JOURNEY_WEIGHTS  # noqa: E402
from seeder.seed import resolve_dsn  # noqa: E402

FAIL = 0


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


async def check_structure(conn: asyncpg.Connection) -> None:
    check("every member has a membership",
          await conn.fetchval("""SELECT count(*) FROM members m WHERE NOT EXISTS
                                 (SELECT 1 FROM memberships x WHERE x.member_id = m.id)""") == 0)

    # An overlap is silent and makes one person count twice in "active members".
    overlaps = await conn.fetchval(
        """SELECT count(*) FROM (
             SELECT start_date, lag(expires_at) OVER (PARTITION BY member_id ORDER BY start_date) prev
             FROM memberships) s
           WHERE prev IS NOT NULL AND start_date < prev""")
    check("no member has two overlapping memberships", overlaps == 0)

    # The agent divides revenue by days. A length that disagrees with the catalogue
    # is a wrong answer with no visible cause.
    check("expires_at is start_date + the plan's own duration",
          await conn.fetchval(
              """SELECT count(*) FROM memberships m
                 JOIN membership_plan_durations d ON d.id = m.membership_plan_duration_id
                 WHERE (m.expires_at::date - m.start_date::date) <> d.duration_days""") == 0)

    check("nothing starts before the member joined",
          await conn.fetchval("""SELECT count(*) FROM memberships m JOIN members mm
                                 ON mm.id = m.member_id WHERE m.start_date < mm.created_at""") == 0)
    check("nothing starts in the future",
          await conn.fetchval("SELECT count(*) FROM memberships WHERE start_date > now()") == 0)

    # The cron column is never trusted for expiry, but a healthy corpus should not
    # ship pre-broken: check_db_layer.py asserts zero drift.
    check("membership_status agrees with expires_at",
          await conn.fetchval(
              """SELECT count(*) FROM memberships WHERE membership_status <> 'CANCELLED'
                 AND (membership_status = 'EXPIRED') <> (expires_at < now())""") == 0)

    cancelled = await conn.fetch(
        """SELECT id, admin_id, member_id, membership_plan_id, membership_plan_duration_id,
                  membership_status::text, start_date, expires_at, created_at
           FROM memberships WHERE membership_status = 'CANCELLED' AND expires_at > now() LIMIT 5""")
    check("some memberships were cancelled mid-term", len(cancelled) > 0, f"{len(cancelled)}+ rows")
    if cancelled:
        model = Membership(**dict(cancelled[0]))
        # The bug this corpus exists to catch: expires_at is untouched by a
        # cancellation, so a status derived from the date alone would call this
        # member ACTIVE and the owner would be told a quitter is still training.
        check("a cancelled membership is not reported active",
              model.status is DerivedMembershipStatus.CANCELLED and not model.is_valid,
              f"expires in {model.days_remaining}d, status={model.status.value}")
        check("...and cancellation is never mistaken for cron drift",
              not model.status_drifted)
        still = model.model_copy(update={"membership_status": StoredMembershipStatus.ACTIVE})
        check("(control) the same row without the flag reads as valid", still.is_valid)


async def check_journeys(conn: asyncpg.Connection) -> None:
    # Journeys are not stored; they are recovered from the shape of the sequence,
    # which is the same thing the agent will have to do.
    rows = await conn.fetch(
        """WITH seq AS (
             SELECT m.member_id, u.company_name,
                    m.start_date - lag(m.expires_at) OVER w AS gap,
                    max(m.expires_at) OVER (PARTITION BY m.member_id) AS last_expiry,
                    count(*) OVER (PARTITION BY m.member_id) AS n
             FROM memberships m JOIN users u ON u.id = m.admin_id
             WINDOW w AS (PARTITION BY m.member_id ORDER BY m.start_date))
           SELECT company_name, member_id,
                  bool_or(gap >= interval '30 days') AS lapsed,
                  max(last_expiry) AS last_expiry, max(n) AS n
           FROM seq GROUP BY 1, 2""")

    now = datetime.now()
    by_gym: dict[str, set[str]] = {}
    for row in rows:
        gone = (now - row["last_expiry"]).days
        if gone >= 30:
            journey = "churned"
        elif row["lapsed"]:
            journey = "lapsed"
        elif row["n"] == 1:
            journey = "new"
        else:
            journey = "continuous"
        by_gym.setdefault(row["company_name"], set()).add(journey)

    check("every gym has all four member journeys",
          all(seen == set(JOURNEY_WEIGHTS) for seen in by_gym.values()),
          " / ".join(f"{len(v)}" for v in by_gym.values()))

    lapsed = sum(1 for r in rows if r["lapsed"])
    check("enough members left and came back", lapsed >= 100,
          f"{lapsed} with a gap of 30+ days")

    # The renewal-chase list. Empty for any gym means a dead demo.
    windows = await conn.fetch(
        """SELECT u.company_name,
                  count(*) FILTER (WHERE m.expires_at BETWEEN now() AND now() + interval '7 days') w7,
                  count(*) FILTER (WHERE m.expires_at BETWEEN now() AND now() + interval '30 days') w30
           FROM users u JOIN memberships m ON m.admin_id = u.id
           WHERE u.role = 'ADMIN' AND m.membership_status <> 'CANCELLED'
           GROUP BY 1 ORDER BY 1""")
    check("every gym has someone expiring this week", all(r["w7"] >= 1 for r in windows),
          ", ".join(str(r["w7"]) for r in windows))
    check("...and several expiring this month", all(r["w30"] >= 5 for r in windows),
          ", ".join(str(r["w30"]) for r in windows))


async def check_payments(conn: asyncpg.Connection) -> None:
    check("exactly one payment per membership",
          await conn.fetchval(
              """SELECT count(*) FROM (
                   SELECT member_id, count(*) n FROM memberships GROUP BY 1) ms
                 FULL JOIN (SELECT member_id, count(*) n FROM payments GROUP BY 1) p
                 USING (member_id)
                 WHERE ms.n IS DISTINCT FROM p.n""") == 0)

    check("every amount is a real price from that gym's catalogue",
          await conn.fetchval(
              """SELECT count(*) FROM payments p WHERE NOT EXISTS (
                   SELECT 1 FROM membership_plan_durations d
                   JOIN membership_plans pl ON pl.id = d.membership_plan_id
                   WHERE pl.admin_id = p.admin_id AND d.price = p.amount)""") == 0)

    check("no payment is due before its member joined",
          await conn.fetchval("""SELECT count(*) FROM payments p JOIN members m
                                 ON m.id = p.member_id WHERE p.due_date < m.created_at""") == 0)

    # paid_at is NOT NULL in Dahani's schema, so an unpaid row still carries a date.
    # Summing by paid_at alone therefore counts money that never arrived; the gap has
    # to be big enough that getting it wrong is visible.
    everything, collected = await conn.fetchrow(
        """SELECT sum(amount), sum(amount) FILTER (WHERE payment_status = 'PAID') FROM payments""")
    check("uncollected money is a material share",
          collected < everything * Decimal("0.98"),
          f"{collected:,} collected of {everything:,} MAD")
    check("unpaid rows still carry a date (the schema flaw, not a bug here)",
          await conn.fetchval(
              "SELECT count(*) FROM payments WHERE payment_status <> 'PAID'") > 0)

    months = await conn.fetch(
        """SELECT to_char(date_trunc('month', paid_at), 'YYYY-MM') AS m, sum(amount) AS total
           FROM payments WHERE payment_status = 'PAID' GROUP BY 1 ORDER BY 1""")
    check("revenue spans at least twelve months", len(months) >= 12, f"{len(months)} months")
    # Complete months only: the current one is partial by definition and would
    # always look like the worst.
    totals = [m["total"] for m in months[:-1]]
    check("monthly revenue has a shape, not a flat line",
          max(totals) >= min(totals) * Decimal("1.5"),
          f"best {max(totals):,} vs worst {min(totals):,} MAD")

    check("every plan in every catalogue has sold something",
          await conn.fetchval(
              """SELECT count(*) FROM membership_plan_durations d WHERE NOT EXISTS (
                   SELECT 1 FROM memberships m JOIN payments p ON p.member_id = m.member_id
                   WHERE m.membership_plan_duration_id = d.id AND p.amount = d.price)""") == 0)


async def fingerprint(conn: asyncpg.Connection) -> tuple[str, str, int, int]:
    row = await conn.fetchrow(
        """SELECT md5(string_agg(k, '|' ORDER BY k)) AS m, count(*) AS n FROM (
             SELECT member_id || start_date::text || expires_at::text || membership_status::text AS k
             FROM memberships) s""")
    pay = await conn.fetchrow(
        """SELECT md5(string_agg(k, '|' ORDER BY k)) AS m, count(*) AS n FROM (
             SELECT member_id || amount::text || due_date::text || payment_status::text AS k
             FROM payments) s""")
    return row["m"], pay["m"], row["n"], pay["n"]


def _reseed() -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, "-m", "seeder.seed"], cwd=ROOT,
                          capture_output=True, text=True)


async def check_seeder_properties(conn: asyncpg.Connection) -> None:
    # The corpus was normalised in main() before anything was asserted, so the
    # property under test here is "two runs agree", not "the database happens to be
    # from today".
    before = await fingerprint(conn)
    _reseed()
    after = await fingerprint(conn)

    check("same seed, same day, same history", before[:2] == after[:2])
    check("re-running duplicates nothing",
          before[2:] == after[2:], f"{after[2]} memberships, {after[3]} payments")

    anchors = await conn.fetch(
        """SELECT m.user_name,
                  (SELECT count(*) FROM memberships x WHERE x.member_id = m.id) AS ms,
                  (SELECT count(*) FROM payments p WHERE p.member_id = m.id) AS ps
           FROM members m WHERE m.user_name = ANY($1::text[]) ORDER BY m.user_name""",
        sorted(FIXTURE_MEMBER_USERNAMES))
    check("the five fixture members are untouched by the generator",
          len(anchors) == 5 and all(a["ms"] == 1 and a["ps"] == 1 for a in anchors),
          ", ".join(f"{a['user_name']}:{a['ms']}/{a['ps']}" for a in anchors))

    # Youssef 20 days out, Siham 5, Omar 30 days expired -- the three states the whole
    # test suite was built on, and the reason those names appear in five scripts.
    states = dict(await conn.fetch(
        """SELECT m.user_name, (x.expires_at - now())::text FROM members m
           JOIN memberships x ON x.member_id = m.id
           WHERE m.user_name IN ('youssef_a', 'siham_i', 'omar_t')"""))
    check("the three fixture states still read as intended",
          len(states) == 3 and "-" in states["omar_t"] and "-" not in states["siham_i"],
          "expired / expiring soon / active")


async def main() -> int:
    # Normalise the corpus BEFORE anything is asserted, not halfway down.
    # Everything the seeder writes is anchored to midnight *today*, so a database
    # generated yesterday disagrees with `now()` for reasons that are the calendar's
    # doing and not the seeder's: memberships that expired overnight still carry the
    # status they were given, and `membership_status agrees with expires_at` fails.
    # D12 moved this reseed in front of the *determinism* group for exactly this
    # reason and stopped there, which left the structure group failing on the first
    # run of every day -- and a suite that fails every morning is a suite people
    # stop reading.
    first = _reseed()
    check("the seeder re-runs cleanly", first.returncode == 0, first.stderr.strip()[:60])

    conn = await asyncpg.connect(resolve_dsn(None))
    try:
        print("  -- structure --")
        await check_structure(conn)
        print("  -- journeys --")
        await check_journeys(conn)
        print("  -- payments --")
        await check_payments(conn)
        print("  -- seeder properties --")
        await check_seeder_properties(conn)
    finally:
        await conn.close()
    return FAIL


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
