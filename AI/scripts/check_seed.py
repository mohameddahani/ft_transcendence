"""Tasks 1.1 + 1.2 acceptance checks: gyms, plan catalogues, members.

Runs on the HOST, not in the container, for two reasons: it imports `seeder/` (which
is excluded from the image on purpose -- a production image has no business carrying
a data generator), and it connects as `admin` to read columns the service's role
cannot see.

    .venv/bin/python -m scripts.check_seed

Two halves. The generator half tests `generate_members` as a pure function: same
seed, same people. The corpus half tests what actually landed in Postgres.
"""

from __future__ import annotations

import asyncio
import random
import re
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncpg  # noqa: E402

from seeder.catalogue import CATALOGUE, FIXTURE_MEMBER_USERNAMES, all_prices  # noqa: E402
from seeder.names import (  # noqa: E402
    FEMALE_FIRST_NAMES,
    MALE_FIRST_NAMES,
    SURNAMES,
)
from seeder.seed import (  # noqa: E402
    MAX_MEMBERS,
    MIN_MEMBERS,
    generate_members,
    resolve_dsn,
)

FAIL = 0
PHONE = re.compile(r"^\+2126\d{7,8}$")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$")


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


def check_generator() -> None:
    gym = CATALOGUE[0]

    a = generate_members(gym, 120, random.Random("42:atl"))
    b = generate_members(gym, 120, random.Random("42:atl"))
    c = generate_members(gym, 120, random.Random("7:atl"))
    check("same seed generates the same people", a == b)
    check("a different seed generates different people", a != c)

    check("every generated username is unique",
          len({m.user_name for m in a}) == len(a))
    check("every generated phone is a Moroccan mobile",
          all(PHONE.match(m.phone_number) for m in a))
    check("every generated email parses as an email",
          all(EMAIL.match(m.email) for m in a))

    check("gender agrees with the first name",
          all((m.first_name in FEMALE_FIRST_NAMES) == (m.gender == "FEMALE") for m in a))
    check("names come from the Moroccan lists",
          all(m.first_name in MALE_FIRST_NAMES + FEMALE_FIRST_NAMES
              and m.last_name in SURNAMES for m in a))

    ages = [(datetime.now() - m.birth_date).days // 365 for m in a]
    check("ages are plausible for a gym", 15 <= min(ages) and max(ages) <= 66,
          f"{min(ages)}-{max(ages)}, median {sorted(ages)[len(ages) // 2]}")
    joined = [(datetime.now() - m.created_at).days for m in a]
    check("nobody joined in the future or before the gym existed",
          min(joined) >= 0 and max(joined) <= 600, f"0-{max(joined)} days ago")

    # Families share a handset. `phone_number` is deliberately not unique and
    # `search_members` returns a list because of it -- if the corpus never contains
    # the case, that code path is first exercised in front of an evaluator.
    shared = len(a) - len({m.phone_number for m in a})
    check("some members share a phone with a relative", 0 < shared < len(a) * 0.2,
          f"{shared} of {len(a)}")

    # On a bigger sample than the 120 above: BANNED is 1%, so a 120-member draw has
    # roughly a one-in-three chance of containing none. A test that fails a third of
    # the time teaches people to ignore the suite.
    statuses = {m.account_status for m in generate_members(gym, 600, random.Random("42:atl"))}
    check("account status is a mix, not all ACTIVE", statuses == {"ACTIVE", "FROZEN", "BANNED"},
          ", ".join(sorted(statuses)))


async def check_corpus(conn: asyncpg.Connection) -> None:
    gyms = await conn.fetch(
        "SELECT id, company_name, email FROM users WHERE role = 'ADMIN' ORDER BY company_name")
    check("four gyms exist (task 1.1)", len(gyms) == len(CATALOGUE),
          ", ".join(g["company_name"] for g in gyms))
    check("every catalogued gym is present",
          {g["email"] for g in gyms} >= {g.email for g in CATALOGUE})

    prices = await conn.fetch(
        """SELECT u.company_name, p.plan_name, d.duration_days, d.price
           FROM users u
           JOIN membership_plans p ON p.admin_id = u.id
           JOIN membership_plan_durations d ON d.membership_plan_id = p.id""")
    check("every price is a Decimal, never a float",
          all(isinstance(r["price"], Decimal) for r in prices))
    check("plan names are unique across gyms",
          len({r["plan_name"] for r in prices}) == len(prices))
    check("prices are unique across gyms",
          len({r["price"] for r in prices}) == len(prices),
          "a leak shows as a wrong number, not a wrong count")
    check("the catalogue in the database matches seeder/catalogue.py",
          {r["price"] for r in prices} == set(all_prices()))
    check("prices are plausible MAD, to the centime",
          all(Decimal("100") <= r["price"] <= Decimal("6000")
              and r["price"] == r["price"].quantize(Decimal("0.01")) for r in prices))

    per_gym = await conn.fetch(
        """SELECT u.company_name, count(p.id) AS plans
           FROM users u LEFT JOIN membership_plans p ON p.admin_id = u.id
           WHERE u.role = 'ADMIN' GROUP BY 1""")
    check("every gym sells at least two plans", all(r["plans"] >= 2 for r in per_gym),
          ", ".join(f"{r['plans']}" for r in per_gym))
    orphans = await conn.fetchval(
        """SELECT count(*) FROM membership_plans p WHERE NOT EXISTS
           (SELECT 1 FROM membership_plan_durations d WHERE d.membership_plan_id = p.id)""")
    check("no plan is missing its price", orphans == 0)

    # The two fixture gyms keep their original plan at its original price. Every test
    # in scripts/ that names a price depends on the seeder not having overwritten it.
    for email, name, price in (("karim@atlasfitness.ma", "Basic Monthly", "300.00"),
                               ("nadia@oasisgym.ma", "Premium Annual", "4500.00")):
        found = await conn.fetchval(
            """SELECT d.price FROM users u
               JOIN membership_plans p ON p.admin_id = u.id AND p.plan_name = $2
               JOIN membership_plan_durations d ON d.membership_plan_id = p.id
               WHERE u.email = $1""", email, name)
        check(f"fixture plan preserved: {name}", found == Decimal(price), f"{found} MAD")

    # ---------------------------------------------------------------- members (1.2)
    counts = await conn.fetch(
        """SELECT u.company_name, count(m.id) AS n FROM users u
           LEFT JOIN members m ON m.admin_id = u.id
           WHERE u.role = 'ADMIN' GROUP BY 1 ORDER BY 1""")
    # +3 and +2 for the hand-written fixture members the seeder leaves alone.
    check("every gym has 150-400 members (task 1.2)",
          all(MIN_MEMBERS <= r["n"] <= MAX_MEMBERS + 3 for r in counts),
          ", ".join(str(r["n"]) for r in counts))
    total = sum(r["n"] for r in counts)
    check("no member is orphaned from a gym",
          await conn.fetchval("SELECT count(*) FROM members") == total, f"{total} members")

    check("no member's phone breaks the format",
          await conn.fetchval(r"SELECT count(*) FROM members WHERE phone_number !~ '^\+212\d{9}$'") == 0)
    check("no member's email breaks the format",
          await conn.fetchval(r"SELECT count(*) FROM members WHERE email !~ '^[^@]+@[^@]+\.[a-z]+$'") == 0)

    families = await conn.fetchval(
        """SELECT count(*) FROM (SELECT admin_id, phone_number FROM members
           GROUP BY 1, 2 HAVING count(*) > 1) s""")
    check("families share phone numbers", families > 0, f"{families} shared numbers")
    crossing = await conn.fetchval(
        """SELECT count(*) FROM (SELECT phone_number FROM members
           GROUP BY 1 HAVING count(DISTINCT admin_id) > 1) s""")
    check("...but never across two gyms", crossing == 0)

    mix = dict(await conn.fetch(
        "SELECT account_status::text, count(*) FROM members GROUP BY 1"))
    check("account status is a realistic mix",
          mix.get("ACTIVE", 0) > mix.get("FROZEN", 0) > 0 and mix.get("BANNED", 0) > 0,
          " ".join(f"{k}={v}" for k, v in sorted(mix.items())))

    genders = dict(await conn.fetch("SELECT gender::text, count(*) FROM members GROUP BY 1"))
    check("both genders are well represented",
          min(genders.values()) > total * 0.3, " ".join(f"{k}={v}" for k, v in genders.items()))

    future = await conn.fetchval(
        "SELECT count(*) FROM members WHERE created_at > NOW() OR birth_date > NOW()")
    check("nobody joined or was born in the future", future == 0)

    # The five hand-written members every other test script names.
    anchors = await conn.fetch(
        """SELECT user_name, first_name, last_name FROM members
           WHERE user_name = ANY($1::text[]) ORDER BY user_name""",
        sorted(FIXTURE_MEMBER_USERNAMES))
    check("the five fixture members survived seeding", len(anchors) == 5,
          ", ".join(f"{a['first_name']} {a['last_name']}" for a in anchors))
    check("their memberships survived too",
          await conn.fetchval(
              """SELECT count(*) FROM memberships m JOIN members mm ON mm.id = m.member_id
                 WHERE mm.user_name = ANY($1::text[])""",
              sorted(FIXTURE_MEMBER_USERNAMES)) == 5,
          "one each, as the fixtures wrote them")

    subs = await conn.fetchval(
        """SELECT count(*) FROM users u WHERE u.role = 'ADMIN'
           AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id)""")
    check("every gym owner has a platform subscription", subs == 0)


async def main() -> int:
    print("  -- generator --")
    check_generator()
    print("  -- corpus --")
    conn = await asyncpg.connect(resolve_dsn(None))
    try:
        await check_corpus(conn)
    finally:
        await conn.close()
    return FAIL


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
