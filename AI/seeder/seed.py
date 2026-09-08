"""Seeder: gyms, plan catalogues and members (tasks 1.1 and 1.2).

    python -m seeder.seed                 # 4 gyms, 150-400 members each
    python -m seeder.seed --members 50    # smaller, for a quick loop
    python -m seeder.seed --seed 7        # a different but equally repeatable world

**This connects as `admin`, not `ai_readonly`, and that is the point.** The read-only
guardrail governs the *running service*: it answers questions, so it must not be able
to change the answers. The seeder is a development tool that builds the world the
service reads. Keeping them on different roles is what makes the guardrail testable --
`verify.sh` asserts the service is refused the writes this script performs.

**Deterministic within a day.** Same `--seed`, same `--members`, same date produces
byte-identical data, so an answer you verify by hand this morning is still the right
answer this afternoon. Dates are anchored to *today at midnight UTC*, not to `now()`:
anchoring to the wall clock would change every birth date on every run, and anchoring
to a fixed epoch would leave the corpus visibly stale by October. `random` is seeded
per gym rather than globally, so changing one gym's size does not reshuffle the others.

**Idempotent.** Gyms are found by email, plans by (gym, name), members by user name.
Re-running updates in place instead of duplicating, and members this script no longer
generates are removed -- except the five hand-written fixture members, which are named
explicitly in `catalogue.FIXTURE_MEMBER_USERNAMES` and never touched. Every test in
`scripts/` names one of them.

Both `check_ins` and `feedbacks` come from `seeder/pending/`, not from a Prisma
migration -- see that directory for why. The policy documents in `seeder/documents/`
are rewritten on every run, because the prices inside them come from `catalogue.py`.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import random
import sys
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path

import asyncpg

from seeder.catalogue import CATALOGUE, FIXTURE_MEMBER_USERNAMES, GymSpec
from seeder.attendance import Window, build_check_ins, new_id, pick_archetype
from seeder.documents import write_all as write_documents
from seeder.feedback import build_feedback
from seeder.history import (
    DurationOption,
    build_history,
    build_payments,
    pick_journey,
)
from seeder.names import (
    DISTRICTS,
    EMAIL_PROVIDERS,
    FEMALE_FIRST_NAMES,
    MALE_FIRST_NAMES,
    SURNAMES,
    slug,
)

MIN_MEMBERS, MAX_MEMBERS = 150, 400

# Roughly one member in sixteen shares a phone with a relative. `phone_number` is
# deliberately not unique (families share a handset), and `search_members` returns a
# list because of it -- so the corpus has to contain the case, or that code path is
# never exercised before the demo.
SHARED_PHONE_RATE = 0.06

# A membership base that is entirely ACTIVE is not a real gym. These two states are
# what makes "who is frozen?" and "who is banned?" answerable at all.
FROZEN_RATE, BANNED_RATE = 0.05, 0.01

# Members joined over the last 18 months, weighted towards recent: gyms grow, and a
# flat distribution would make every cohort analysis come out the same.
SIGNUP_WINDOW_DAYS = 548

# Sign-ups are seasonal, and this is what gives `get_revenue(group_by="month")` a
# shape worth asking about. January is resolutions, September is the post-summer
# return, summer and Ramadan are quiet. A flat series makes "which was my best
# month?" a boring answer and teaches an evaluator nothing about the agent.
MONTH_WEIGHTS: dict[int, float] = {
    1: 1.6, 2: 1.2, 3: 1.0, 4: 0.9, 5: 0.9, 6: 0.8,
    7: 0.7, 8: 0.7, 9: 1.4, 10: 1.1, 11: 1.0, 12: 0.8,
}
_PEAK_WEIGHT = max(MONTH_WEIGHTS.values())


@dataclass
class GeneratedMember:
    first_name: str
    last_name: str
    email: str
    user_name: str
    phone_number: str
    address: str
    emergency_contact: str
    gender: str
    birth_date: datetime
    account_status: str
    created_at: datetime


def _env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            values[key.strip()] = value.strip()
    return values


def resolve_dsn(explicit: str | None) -> str:
    """Where to write. `SEED_DATABASE_URL` wins, then AI/.env, then defaults."""
    if explicit:
        return explicit
    if os.environ.get("SEED_DATABASE_URL"):
        return os.environ["SEED_DATABASE_URL"]
    env = _env_file(Path(__file__).resolve().parent.parent / ".env")

    def get(key: str, fallback: str) -> str:
        return os.environ.get(key) or env.get(key) or fallback

    return (
        f"postgresql://{get('POSTGRES_USER', 'admin')}:{get('POSTGRES_PASSWORD', '1234')}"
        f"@127.0.0.1:{get('POSTGRES_PORT', '5432')}/{get('POSTGRES_DB', 'ft_transcendence')}"
    )


def weighted_choice(rng: random.Random, options: tuple[tuple[str, int], ...]) -> str:
    return rng.choices([o for o, _ in options], weights=[w for _, w in options], k=1)[0]


def today_utc() -> datetime:
    """Midnight today, naive UTC -- the anchor every generated date hangs off.

    Naive because Prisma's columns are `timestamp without time zone` holding UTC
    instants; midnight because `now()` would put microseconds into every birth date
    and make two runs on the same day differ for no useful reason.
    """
    return datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)


def _signup_date(rng: random.Random, anchor: datetime) -> datetime:
    """A join date: recent-weighted, then seasonal.

    `** 1.6` bends a uniform draw towards 0, and 0 is today -- so more members
    signed up recently than 18 months ago. Rejection sampling on top of that bends
    it again towards the busy months. Bounded retries so it always terminates and
    stays deterministic.
    """
    candidate = anchor
    for _ in range(8):
        candidate = anchor - timedelta(days=int(SIGNUP_WINDOW_DAYS * (rng.random() ** 1.6)))
        if rng.random() < MONTH_WEIGHTS[candidate.month] / _PEAK_WEIGHT:
            return candidate
    return candidate


def generate_members(gym: GymSpec, count: int, rng: random.Random) -> list[GeneratedMember]:
    districts = DISTRICTS[gym.city]
    anchor = today_utc()
    members: list[GeneratedMember] = []

    for index in range(count):
        female = rng.random() < 0.45
        first = rng.choice(FEMALE_FIRST_NAMES if female else MALE_FIRST_NAMES)
        last = rng.choice(SURNAMES)
        handle = f"{slug(first)}.{slug(last)}.{gym.key}{index:04d}"

        # Triangular rather than uniform: a gym's membership peaks in the late
        # twenties and thins out at both ends. "What is the average age of my
        # members?" should have an interesting answer.
        age = int(rng.triangular(16, 65, 28))
        birth = anchor - timedelta(days=age * 365 + rng.randint(0, 364))

        roll = rng.random()
        status = ("BANNED" if roll < BANNED_RATE
                  else "FROZEN" if roll < BANNED_RATE + FROZEN_RATE
                  else "ACTIVE")

        joined = _signup_date(rng, anchor)

        members.append(GeneratedMember(
            first_name=first,
            last_name=last,
            email=f"{slug(first)}.{slug(last)}{index}@{weighted_choice(rng, EMAIL_PROVIDERS)}",
            user_name=handle,
            # Deterministic and unique per gym; a slice of these is overwritten
            # below to create shared family numbers.
            phone_number=f"+2126{gym.key_digit}{index:07d}",
            address=f"{rng.choice(districts)}, {gym.city}",
            emergency_contact=f"+2126{rng.randint(10_000_000, 99_999_999)}",
            gender="FEMALE" if female else "MALE",
            birth_date=birth,
            account_status=status,
            created_at=joined,
        ))

    # Families: give some members the phone number of an earlier member in the same
    # gym. Done after the fact so the base numbers stay unique and reproducible.
    for position, member in enumerate(members):
        if position and rng.random() < SHARED_PHONE_RATE:
            member.phone_number = rng.choice(members[:position]).phone_number

    return members


_MEMBER_UPSERT = """
INSERT INTO members (
    id, admin_id, first_name, last_name, email, user_name, phone_number,
    address, emergency_contact, gender, birth_date, account_status, role,
    profile_image_url, created_at, updated_at
) VALUES (
    gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
    $7, $8, $9::"Gender", $10, $11::"MemberAccountStatus", 'MEMBER'::"Role",
    'default-member-image.jpg', $12, NOW()
)
ON CONFLICT (user_name) DO UPDATE SET
    admin_id = EXCLUDED.admin_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    address = EXCLUDED.address,
    emergency_contact = EXCLUDED.emergency_contact,
    gender = EXCLUDED.gender,
    birth_date = EXCLUDED.birth_date,
    account_status = EXCLUDED.account_status,
    created_at = EXCLUDED.created_at,
    updated_at = NOW()
"""


async def ensure_gym(conn: asyncpg.Connection, gym: GymSpec) -> str:
    """Find the gym by email, or create it. Returns its `admin_id`."""
    existing = await conn.fetchval("SELECT id FROM users WHERE email = $1", gym.email)
    if existing:
        return existing
    return await conn.fetchval(
        """
        INSERT INTO users (
            id, first_name, last_name, company_name, email, user_name, password,
            phone_number, gender, birth_date, role, account_status,
            is_account_verified, terms_accepted, profile_image_url, created_at, updated_at
        ) VALUES (
            gen_random_uuid()::text, $1, $2, $3, $4, $5, 'seeded_not_a_real_hash',
            $6, $7::"Gender", $8, 'ADMIN'::"Role", 'ACTIVE'::"UserAccountStatus",
            true, true, 'default-image.jpg', NOW(), NOW()
        ) RETURNING id
        """,
        gym.owner_first, gym.owner_last, gym.company_name, gym.email, gym.user_name,
        gym.phone_number,
        "FEMALE" if gym.owner_first in FEMALE_FIRST_NAMES else "MALE",
        datetime(1985, 1, 1) + timedelta(days=len(gym.key) * 37),
    )


async def ensure_subscription(conn: asyncpg.Connection, admin_id: str) -> None:
    """Every gym owner buys a platform tier. Not read by the AI, but a gym with no
    subscription is incoherent data, and evaluators read the schema."""
    if await conn.fetchval("SELECT 1 FROM subscriptions WHERE user_id = $1", admin_id):
        return
    plan_id = await conn.fetchval("SELECT id FROM plans ORDER BY created_at LIMIT 1")
    if plan_id is None:
        plan_id = await conn.fetchval(
            """INSERT INTO plans (id, plan_name, description, max_members, is_active,
                                  created_at, updated_at)
               VALUES (gen_random_uuid()::text, 'SaaS Base Tier', 'Standard platform tier',
                       500, true, NOW(), NOW()) RETURNING id""")
    duration = await conn.fetchrow(
        "SELECT id, price FROM plan_durations WHERE plan_id = $1 LIMIT 1", plan_id)
    if duration is None:
        duration = await conn.fetchrow(
            """INSERT INTO plan_durations (id, plan_id, duration_days, price,
                                           created_at, updated_at)
               VALUES (gen_random_uuid()::text, $1, 365, 12000.00, NOW(), NOW())
               RETURNING id, price""", plan_id)
    await conn.execute(
        """INSERT INTO subscriptions (id, user_id, plan_id, plan_duration_id, amount,
                                      subscription_status, started_at, expires_at,
                                      created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'ACTIVE'::"SubscriptionStatus",
                   NOW(), NOW() + INTERVAL '1 year', NOW(), NOW())""",
        admin_id, plan_id, duration["id"], duration["price"])


async def ensure_plans(conn: asyncpg.Connection, admin_id: str, gym: GymSpec) -> int:
    """Create the gym's catalogue, leaving any plan that already exists in place.

    Matched on (admin_id, plan_name) rather than by id: the D1 fixture's
    "Basic Monthly" is referenced by real memberships, so creating a second one at
    the same name would split that gym's history across two plans.
    """
    durations = 0
    for plan in gym.plans:
        plan_id = await conn.fetchval(
            "SELECT id FROM membership_plans WHERE admin_id = $1 AND plan_name = $2",
            admin_id, plan.name)
        if plan_id is None:
            plan_id = await conn.fetchval(
                """INSERT INTO membership_plans (id, admin_id, plan_name, description,
                                                 is_active, created_at, updated_at)
                   VALUES (gen_random_uuid()::text, $1, $2, $3, true, NOW(), NOW())
                   RETURNING id""",
                admin_id, plan.name, plan.description)
        for days, price in plan.durations:
            existing = await conn.fetchval(
                """SELECT id FROM membership_plan_durations
                   WHERE membership_plan_id = $1 AND duration_days = $2""", plan_id, days)
            if existing is None:
                await conn.execute(
                    """INSERT INTO membership_plan_durations (id, membership_plan_id,
                           duration_days, price, created_at, updated_at)
                       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW())""",
                    plan_id, days, price)
            else:
                await conn.execute(
                    "UPDATE membership_plan_durations SET price = $1, updated_at = NOW()"
                    " WHERE id = $2", price, existing)
            durations += 1
    return durations


async def sync_members(
    conn: asyncpg.Connection, admin_id: str, members: list[GeneratedMember]
) -> tuple[int, int]:
    """Upsert this gym's generated members and drop any the seeder no longer makes.

    The delete is scoped by "not in the set I just wrote, and not one of the five
    hand-written fixture members". Anything else -- a `LIKE` on a prefix, say --
    eventually deletes a row somebody wrote by hand.
    """
    await conn.executemany(_MEMBER_UPSERT, [
        (admin_id, m.first_name, m.last_name, m.email, m.user_name, m.phone_number,
         m.address, m.emergency_contact, m.gender, m.birth_date, m.account_status,
         m.created_at)
        for m in members
    ])

    keep = [m.user_name for m in members] + sorted(FIXTURE_MEMBER_USERNAMES)
    stale = await conn.fetch(
        "SELECT id FROM members WHERE admin_id = $1 AND user_name <> ALL($2::text[])",
        admin_id, keep)
    if stale:
        ids = [row["id"] for row in stale]
        # Children first: these tables gain rows in tasks 1.3-1.4, and a seeder that
        # only works before those exist is a seeder that breaks next week.
        for table in ("check_ins", "feedbacks", "payments", "memberships",
                      "member_notifications", "member_refresh_tokens",
                      "member_action_tokens"):
            await conn.execute(f"DELETE FROM {table} WHERE member_id = ANY($1::text[])", ids)
        await conn.execute("DELETE FROM members WHERE id = ANY($1::text[])", ids)

    return len(members), len(stale)


_MEMBERSHIP_INSERT = """
INSERT INTO memberships (
    id, admin_id, member_id, membership_plan_id, membership_plan_duration_id,
    membership_status, start_date, expires_at, created_at, updated_at
) VALUES (
    gen_random_uuid()::text, $1, $2, $3, $4,
    $5::"MembershipStatus", $6, $7, $6, NOW()
)
"""

_PAYMENT_INSERT = """
INSERT INTO payments (
    id, admin_id, member_id, amount, paid_at, due_date, payment_status,
    created_at, updated_at
) VALUES (
    gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::"PaymentStatus", $5, NOW()
)
"""


async def sync_history(
    conn: asyncpg.Connection, admin_id: str, rng: random.Random, now: datetime
) -> tuple[int, int]:
    """Rebuild membership history and payments for this gym's generated members.

    Delete-then-insert rather than upsert: neither table has a natural unique key, so
    there is nothing to conflict on. The delete is scoped to generated members, so
    the five hand-written fixture members keep the memberships and payments that half
    the test suite asserts against.
    """
    options = [
        DurationOption(plan_id=r["plan_id"], duration_id=r["id"],
                       days=r["duration_days"], price=r["price"])
        for r in await conn.fetch(
            """SELECT d.id, d.membership_plan_id AS plan_id, d.duration_days, d.price
               FROM membership_plan_durations d
               JOIN membership_plans p ON p.id = d.membership_plan_id
               WHERE p.admin_id = $1 ORDER BY d.duration_days, d.price""", admin_id)
    ]
    if not options:
        return 0, 0

    members = await conn.fetch(
        """SELECT id, created_at FROM members
           WHERE admin_id = $1 AND user_name <> ALL($2::text[])
           ORDER BY user_name""",
        admin_id, sorted(FIXTURE_MEMBER_USERNAMES))
    ids = [m["id"] for m in members]

    await conn.execute("DELETE FROM payments WHERE member_id = ANY($1::text[])", ids)
    await conn.execute("DELETE FROM memberships WHERE member_id = ANY($1::text[])", ids)

    membership_rows, payment_rows = [], []
    for member in members:
        history = build_history(
            member["id"], member["created_at"], pick_journey(rng), options, rng, now)
        membership_rows.extend(history)
        payment_rows.extend(build_payments(history, rng, now))

    await conn.executemany(_MEMBERSHIP_INSERT, [
        (admin_id, r.member_id, r.plan_id, r.duration_id, r.status, r.start_date, r.expires_at)
        for r in membership_rows
    ])
    await conn.executemany(_PAYMENT_INSERT, [
        (admin_id, p.member_id, p.amount, p.paid_at, p.due_date, p.status)
        for p in payment_rows
    ])
    return len(membership_rows), len(payment_rows)


async def sync_attendance(
    conn: asyncpg.Connection, admin_id: str, rng: random.Random, now: datetime
) -> int:
    """Rebuild check-ins for this gym's generated members (task 1.5).

    Visits are generated per membership window, never outside one: attendance from
    somebody who was not a member that day is the most obviously wrong row the corpus
    could contain, and an owner would spot it in the first demo question.
    """
    rows = await conn.fetch(
        """SELECT m.member_id, m.start_date, m.expires_at,
                  m.membership_status = 'CANCELLED' AS cancelled
           FROM memberships m
           JOIN members mm ON mm.id = m.member_id
           WHERE m.admin_id = $1 AND mm.user_name <> ALL($2::text[])
           ORDER BY mm.user_name, m.start_date""",
        admin_id, sorted(FIXTURE_MEMBER_USERNAMES))

    by_member: dict[str, list[Window]] = {}
    for row in rows:
        by_member.setdefault(row["member_id"], []).append(Window(
            member_id=row["member_id"], start=row["start_date"],
            end=row["expires_at"], cancelled=row["cancelled"]))

    await conn.execute("DELETE FROM check_ins WHERE member_id = ANY($1::text[])",
                       list(by_member))

    records = []
    for member_id, windows in by_member.items():
        for _member, moment in build_check_ins(windows, pick_archetype(rng), rng, now):
            # copy_records_to_table takes tuples in column order and no defaults, so
            # created_at and updated_at are supplied explicitly.
            records.append((new_id(rng), member_id, admin_id, moment, moment, moment))

    if records:
        # COPY rather than executemany: this is the only table in the corpus with
        # six figures of rows, and the difference is seconds versus minutes.
        await conn.copy_records_to_table(
            "check_ins", records=records,
            columns=["id", "member_id", "admin_id", "checked_in_at",
                     "created_at", "updated_at"])
        # COPY does not update the planner's statistics, and autovacuum may not get
        # to it for minutes. Until it does, Postgres plans against a guess and
        # sequential-scans the largest table in the corpus -- which looks exactly
        # like "the index Dahani added does nothing".
        await conn.execute("ANALYZE check_ins")
    return len(records)


_FEEDBACK_INSERT = """
INSERT INTO feedbacks (
    id, member_id, admin_id, content, rating, sentiment, sentiment_score,
    created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6::"Sentiment", $7, $8, $8)
"""


async def sync_feedback(
    conn: asyncpg.Connection, admin_id: str, rng: random.Random, now: datetime
) -> tuple[int, int]:
    """Rebuild feedback for this gym's generated members (task 1.6).

    Returns (written, unscored). Comments are dated inside a membership the member
    actually held: a review from somebody who was not a member that month is the
    same class of wrong row as a check-in outside a window.
    """
    memberships = await conn.fetch(
        """SELECT m.member_id, m.start_date, m.expires_at FROM memberships m
           JOIN members mm ON mm.id = m.member_id
           WHERE m.admin_id = $1 AND mm.user_name <> ALL($2::text[])
           ORDER BY mm.user_name, m.start_date""",
        admin_id, sorted(FIXTURE_MEMBER_USERNAMES))
    visits = dict(await conn.fetch(
        "SELECT member_id, count(*) FROM check_ins WHERE admin_id = $1 GROUP BY 1", admin_id))

    windows: dict[str, list[tuple[datetime, datetime]]] = {}
    for row in memberships:
        windows.setdefault(row["member_id"], []).append((row["start_date"], row["expires_at"]))

    await conn.execute("DELETE FROM feedbacks WHERE member_id = ANY($1::text[])", list(windows))

    rows = []
    for member_id, member_windows in windows.items():
        rows.extend(build_feedback(
            member_id, member_windows, visits.get(member_id, 0), rng, now))

    await conn.executemany(_FEEDBACK_INSERT, [
        (new_id(rng), r.member_id, admin_id, r.content, r.rating,
         r.sentiment, r.sentiment_score, r.created_at)
        for r in rows
    ])
    return len(rows), sum(1 for r in rows if r.sentiment is None)


async def main() -> int:
    parser = argparse.ArgumentParser(description="Seed gyms, plans and members.")
    parser.add_argument("--members", type=int, default=None,
                        help=f"members per gym; default is {MIN_MEMBERS}-{MAX_MEMBERS}, chosen per gym")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed; same seed, same world")
    parser.add_argument("--dsn", default=None, help="overrides SEED_DATABASE_URL and AI/.env")
    args = parser.parse_args()

    if args.members is not None and args.members < 1:
        parser.error("--members must be at least 1")

    conn = await asyncpg.connect(resolve_dsn(args.dsn))
    try:
        who = await conn.fetchval("SELECT current_user")
        print(f"connected as {who}\n")
        header = (f"{'gym':<28}{'plans':>7}{'members':>9}{'history':>9}"
                  f"{'payments':>10}{'check-ins':>11}{'feedback':>10}")
        print(header)
        print("-" * len(header))
        anchor = today_utc()

        for gym in CATALOGUE:
            rng = random.Random(f"{args.seed}:{gym.key}")
            count = args.members if args.members is not None else rng.randint(MIN_MEMBERS, MAX_MEMBERS)

            # One transaction per gym: a failure halfway through leaves that gym
            # untouched rather than half-built, and the next run starts clean.
            async with conn.transaction():
                admin_id = await ensure_gym(conn, gym)
                await ensure_subscription(conn, admin_id)
                durations = await ensure_plans(conn, admin_id, gym)
                written, _removed = await sync_members(
                    conn, admin_id, generate_members(gym, count, rng))
                memberships, payments = await sync_history(conn, admin_id, rng, anchor)
                check_ins = await sync_attendance(conn, admin_id, rng, anchor)
                comments, _unscored = await sync_feedback(conn, admin_id, rng, anchor)

            print(f"{gym.company_name:<28}{len(gym.plans):>7}"
                  f"{written:>9}{memberships:>9}{payments:>10}{check_ins:>11}{comments:>10}")

        totals = await conn.fetchrow(
            """SELECT (SELECT count(*) FROM users WHERE role = 'ADMIN') AS gyms,
                      (SELECT count(*) FROM membership_plans) AS plans,
                      (SELECT count(*) FROM members) AS members,
                      (SELECT count(*) FROM memberships) AS memberships,
                      (SELECT count(*) FROM payments) AS payments,
                      (SELECT count(*) FROM check_ins) AS check_ins,
                      (SELECT count(*) FROM feedbacks) AS feedbacks,
                      (SELECT coalesce(sum(amount), 0) FROM payments
                        WHERE payment_status = 'PAID') AS collected""")
        print("-" * len(header))
        print(f"{'total':<28}{totals['plans']:>7}{totals['members']:>9}"
              f"{totals['memberships']:>9}{totals['payments']:>10}"
              f"{totals['check_ins']:>11}{totals['feedbacks']:>10}")

        # Regenerated every run, because the prices inside them come from
        # catalogue.py. A document quoting a price the database no longer charges
        # makes the assistant contradict itself, and it reads as a model failure.
        docs = write_documents()
        print(f"\n{totals['gyms']} gyms, {totals['collected']:,} MAD collected, "
              f"{len(docs)} policy documents written.")
    finally:
        await conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
