from __future__ import annotations

import argparse
import asyncio
import hashlib
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

# families share one phone number, which is why phone_number is not unique
SHARED_PHONE_RATE = 0.06

FROZEN_RATE, BANNED_RATE = 0.05, 0.01

SIGNUP_WINDOW_DAYS = 548

# more sign-ups in January and September, fewer in summer
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


# the seeder connects as the admin user: it writes, while the AI service can only read
def resolve_dsn(explicit: str | None) -> str:
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


# check-ins are generated up to the current hour, so today is never empty
def now_hour() -> datetime:
    return datetime.now(UTC).replace(minute=0, second=0, microsecond=0, tzinfo=None)


def today_utc() -> datetime:
    return datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)


def _signup_date(rng: random.Random, anchor: datetime) -> datetime:
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
            phone_number=f"+2126{gym.key_digit}{index:07d}",
            address=f"{rng.choice(districts)}, {gym.city}",
            emergency_contact=f"+2126{rng.randint(10_000_000, 99_999_999)}",
            gender="FEMALE" if female else "MALE",
            birth_date=birth,
            account_status=status,
            created_at=joined,
        ))

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
    durations = 0
    for plan in gym.plans:
        plan_id = await conn.fetchval(
            "SELECT id FROM membership_plans WHERE admin_id = $1 AND plan_name = $2",
            admin_id, plan.name)
        if plan_id is None:
            plan_id = await conn.fetchval(
                """INSERT INTO membership_plans (id, admin_id, plan_name, description,
                                                 weekly_visit_limit, is_active,
                                                 created_at, updated_at)
                   VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW())
                   RETURNING id""",
                admin_id, plan.name, plan.description, plan.weekly_visit_limit)
        else:
            await conn.execute(
                "UPDATE membership_plans SET weekly_visit_limit = $2 WHERE id = $1",
                plan_id, plan.weekly_visit_limit)
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


STAFF_PER_GYM = (
    ("reception", "ACTIVE"),
    ("ex.reception", "BANNED"),
)


async def ensure_staff(conn: asyncpg.Connection, admin_id: str, gym: GymSpec) -> int:
    written = 0
    for handle, status in STAFF_PER_GYM:
        user_name = f"{handle}.{gym.key}"
        existing = await conn.fetchval(
            "SELECT id FROM staffs WHERE user_name = $1", user_name)
        if existing is None:
            await conn.execute(
                """INSERT INTO staffs (id, admin_id, first_name, last_name, gender,
                                       birth_date, user_name, email, phone_number,
                                       company_name, role, account_status,
                                       created_at, updated_at)
                   VALUES (gen_random_uuid()::text, $1, $2, $3, 'FEMALE'::"Gender",
                           $4, $5, $6, $7, $8, 'STAFF'::"Role",
                           $9::"UserAccountStatus", NOW(), NOW())""",
                admin_id, "Hafsa" if status == "ACTIVE" else "Yassine",
                "Ouazzani" if status == "ACTIVE" else "Berrada",
                today_utc() - timedelta(days=31 * 365),
                user_name, f"{user_name}@{gym.email.split('@')[1]}",
                f"+2126{gym.key_digit}9{'1' if status == 'ACTIVE' else '2'}00000",
                gym.company_name, status)
        else:
            await conn.execute(
                'UPDATE staffs SET account_status = $2::"UserAccountStatus" WHERE id = $1',
                existing, status)
        written += 1
    return written


async def sync_members(
    conn: asyncpg.Connection, admin_id: str, members: list[GeneratedMember]
) -> tuple[int, int]:
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
        for table in ("attendances", "visits", "feedbacks", "payments", "memberships",
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

    await conn.execute("DELETE FROM attendances WHERE member_id = ANY($1::text[])", ids)
    await conn.execute("DELETE FROM visits WHERE member_id = ANY($1::text[])", ids)
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
    rows = await conn.fetch(
        """SELECT m.id AS membership_id, m.member_id, m.start_date, m.expires_at,
                  m.membership_status = 'CANCELLED' AS cancelled,
                  p.weekly_visit_limit
           FROM memberships m
           JOIN members mm ON mm.id = m.member_id
           JOIN membership_plans p ON p.id = m.membership_plan_id
           WHERE m.admin_id = $1 AND mm.user_name <> ALL($2::text[])
           ORDER BY mm.user_name, m.start_date""",
        admin_id, sorted(FIXTURE_MEMBER_USERNAMES))

    by_member: dict[str, list[Window]] = {}
    for row in rows:
        by_member.setdefault(row["member_id"], []).append(Window(
            member_id=row["member_id"], membership_id=row["membership_id"],
            start=row["start_date"], end=row["expires_at"],
            cancelled=row["cancelled"], weekly_visit_limit=row["weekly_visit_limit"]))

    await conn.execute("DELETE FROM attendances WHERE member_id = ANY($1::text[])",
                       list(by_member))
    await conn.execute("DELETE FROM visits WHERE member_id = ANY($1::text[])",
                       list(by_member))

    # every check-in needs the booking (visit) it came from, so both are written
    visits: list[tuple] = []
    attendances: list[tuple] = []
    for member_id, windows in by_member.items():
        for _member, membership_id, moment in build_check_ins(
                windows, pick_archetype(rng), rng, now):
            visit_id = new_id(rng)
            qr_hash = hashlib.sha256(new_id(rng).encode()).hexdigest()
            visits.append((visit_id, admin_id, member_id, membership_id, moment,
                           moment + timedelta(minutes=30), "CHECKED_IN", qr_hash,
                           moment, moment))
            method = "MANUAL" if rng.random() < 0.18 else "QR_CODE"
            attendances.append((new_id(rng), admin_id, member_id, membership_id,
                                visit_id, method, moment, moment, moment))

    # COPY loads ~10,000 rows at once instead of one INSERT each
    if visits:
        await conn.copy_records_to_table(
            "visits", records=visits,
            columns=["id", "admin_id", "member_id", "membership_id",
                     "visit_date_and_time", "visit_date_and_time_expires_at",
                     "visit_status", "qr_token_hash", "created_at", "updated_at"])
        await conn.copy_records_to_table(
            "attendances", records=attendances,
            columns=["id", "admin_id", "member_id", "membership_id", "visit_id",
                     "attendance_method", "checked_in_at", "created_at", "updated_at"])
        # refresh the planner statistics after a bulk load
        await conn.execute("ANALYZE attendances")
        await conn.execute("ANALYZE visits")
    return len(attendances)


_RESOLVED_AFTER_DAYS = 21


def _feedback_status(row, rng: random.Random) -> str:
    if row.sentiment is None:
        return "OPEN"
    age_days = (today_utc() - row.created_at).days
    if row.sentiment == "NEGATIVE":
        if age_days > _RESOLVED_AFTER_DAYS:
            return weighted_choice(rng, (("RESOLVED", 65), ("DISMISSED", 15), ("IN_REVIEW", 20)))
        return weighted_choice(rng, (("OPEN", 70), ("IN_REVIEW", 30)))
    return weighted_choice(rng, (("OPEN", 85), ("RESOLVED", 15)))


_FEEDBACK_INSERT = """
INSERT INTO feedbacks (
    id, member_id, admin_id, content, rating, sentiment, sentiment_score,
    feedback_status, created_at, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6::"SentimentType", $7, $8::"FeedbackStatus", $9, $9)
"""


async def sync_feedback(
    conn: asyncpg.Connection, admin_id: str, rng: random.Random, now: datetime
) -> tuple[int, int]:
    memberships = await conn.fetch(
        """SELECT m.member_id, m.start_date, m.expires_at FROM memberships m
           JOIN members mm ON mm.id = m.member_id
           WHERE m.admin_id = $1 AND mm.user_name <> ALL($2::text[])
           ORDER BY mm.user_name, m.start_date""",
        admin_id, sorted(FIXTURE_MEMBER_USERNAMES))
    visits = dict(await conn.fetch(
        "SELECT member_id, count(*) FROM attendances WHERE admin_id = $1 GROUP BY 1", admin_id))

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
         r.sentiment, r.sentiment_score, _feedback_status(r, rng), r.created_at)
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
            # one RNG per gym, so changing one gym does not reshuffle the others
            rng = random.Random(f"{args.seed}:{gym.key}")
            count = args.members if args.members is not None else rng.randint(MIN_MEMBERS, MAX_MEMBERS)

            async with conn.transaction():
                admin_id = await ensure_gym(conn, gym)
                await ensure_subscription(conn, admin_id)
                durations = await ensure_plans(conn, admin_id, gym)
                await ensure_staff(conn, admin_id, gym)
                written, _removed = await sync_members(
                    conn, admin_id, generate_members(gym, count, rng))
                memberships, payments = await sync_history(conn, admin_id, rng, anchor)
                check_ins = await sync_attendance(conn, admin_id, rng, now_hour())
                comments, _unscored = await sync_feedback(conn, admin_id, rng, anchor)

            print(f"{gym.company_name:<28}{len(gym.plans):>7}"
                  f"{written:>9}{memberships:>9}{payments:>10}{check_ins:>11}{comments:>10}")

        totals = await conn.fetchrow(
            """SELECT (SELECT count(*) FROM users WHERE role = 'ADMIN') AS gyms,
                      (SELECT count(*) FROM membership_plans) AS plans,
                      (SELECT count(*) FROM members) AS members,
                      (SELECT count(*) FROM memberships) AS memberships,
                      (SELECT count(*) FROM payments) AS payments,
                      (SELECT count(*) FROM attendances) AS check_ins,
                      (SELECT count(*) FROM feedbacks) AS feedbacks,
                      (SELECT coalesce(sum(amount), 0) FROM payments
                        WHERE payment_status = 'PAID') AS collected""")
        print("-" * len(header))
        print(f"{'total':<28}{totals['plans']:>7}{totals['members']:>9}"
              f"{totals['memberships']:>9}{totals['payments']:>10}"
              f"{totals['check_ins']:>11}{totals['feedbacks']:>10}")

        docs = write_documents()
        print(f"\n{totals['gyms']} gyms, {totals['collected']:,} MAD collected, "
              f"{len(docs)} policy documents written.")
    finally:
        await conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
