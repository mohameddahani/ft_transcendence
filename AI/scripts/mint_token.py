"""Mint a development access token, shaped exactly like Dahani's.

    docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/mint_token.py admin
    docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/mint_token.py member Omar

With no id, it looks one up from the fixture. Prints the token and nothing else, so
it composes: TOKEN=$(... mint_token.py admin); curl -H "Authorization: Bearer $TOKEN"

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
        row = await db._fetch_one(
            "SELECT id FROM users WHERE role = 'ADMIN'"
            + (" AND company_name ILIKE :w" if who else "")
            + " ORDER BY company_name LIMIT 1",
            {"w": f"%{who}%"} if who else {})
    elif role == "MEMBER":
        secret = settings.JWT_MEMBER_ACCESS_SECRET.get_secret_value()
        row = await db._fetch_one(
            "SELECT id FROM members"
            + (" WHERE first_name ILIKE :w" if who else "")
            + " ORDER BY first_name LIMIT 1",
            {"w": f"%{who}%"} if who else {})
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
