"""Mint a development access token, shaped exactly like Dahani's.

    docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/mint_token.py admin
    docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/mint_token.py member omar@gmail.com

The second argument matches `email` exactly, falling back to a name search. Use the
email in anything scripted: the seeder puts several hundred members in each gym, so
"Omar" is now ambiguous and a name search would pick a different person as the data
grows. Not `user_name`, unique though it is -- it is deliberately outside the
`ai_readonly` column grant, and this script reads through the service's own role.
Prints the token and nothing else, so it composes:
TOKEN=$(... mint_token.py admin); curl -H "Authorization: Bearer $TOKEN"

Development only. It signs with the same secrets the service verifies, so it exists
purely because the real login lives in Dahani's Nest app and this service has no way
to obtain a token on its own.
"""

import asyncio
import sys
from datetime import UTC, datetime, timedelta

import jwt

from app.config import get_settings
from app.db import engine as db

TTL = timedelta(minutes=15)  # matches JWT_ADMIN_ACCESS_EXPIRES_IN in backend/.env


async def main() -> None:
    role = (sys.argv[1] if len(sys.argv) > 1 else "admin").upper()
    who = sys.argv[2] if len(sys.argv) > 2 else None
    settings = get_settings()
    await db.init_engine(settings)

    if role == "ADMIN":
        secret = settings.JWT_ADMIN_ACCESS_SECRET.get_secret_value()
        if who:
            row = await db._fetch_one(
                "SELECT id FROM users WHERE role = 'ADMIN'"
                " AND (email = :exact OR company_name ILIKE :like)"
                " ORDER BY (email = :exact) DESC, company_name LIMIT 1",
                {"exact": who, "like": f"%{who}%"})
        else:
            row = await db._fetch_one(
                "SELECT id FROM users WHERE role = 'ADMIN' ORDER BY company_name LIMIT 1")
    elif role == "MEMBER":
        secret = settings.JWT_MEMBER_ACCESS_SECRET.get_secret_value()
        if who:
            # An exact email sorts first, so it wins over any number of members who
            # happen to share a first name.
            row = await db._fetch_one(
                "SELECT id FROM members WHERE email = :exact OR first_name ILIKE :like"
                " ORDER BY (email = :exact) DESC, email LIMIT 1",
                {"exact": who, "like": f"%{who}%"})
        else:
            row = await db._fetch_one("SELECT id FROM members ORDER BY email LIMIT 1")
    else:
        sys.exit(f"role must be admin or member, got {role!r}")

    await db.dispose_engine()
    if row is None:
        sys.exit(f"no {role} matching {who!r} in the database")

    now = datetime.now(UTC)
    print(jwt.encode(
        {"id": row["id"], "role": role,
         "iat": int(now.timestamp()), "exp": int((now + TTL).timestamp())},
        secret, algorithm="HS256"))


asyncio.run(main())
