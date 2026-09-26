import hmac
import threading
import time
from dataclasses import dataclass

import jwt
from fastapi import Depends, Header, HTTPException

from app import config, db

RATE_LIMIT = 20    # requests per user...
RATE_WINDOW = 60   # ...in any 60 seconds


@dataclass(frozen=True)
class User:
    id: str
    role: str       # ADMIN, STAFF or MEMBER
    admin_id: str   # the gym this user belongs to


def _find_gym(role: str, user_id: str) -> str | None:
    if role == "ADMIN":
        row = db.fetch_one("SELECT id FROM users WHERE id = %s AND role = 'ADMIN'", (user_id,))
        return row["id"] if row else None
    if role == "STAFF":
        row = db.fetch_one("SELECT admin_id FROM staffs WHERE id = %s AND account_status = 'ACTIVE'",
                           (user_id,))
    else:
        # a frozen member can still ask why; a banned one is out
        row = db.fetch_one("SELECT admin_id FROM members WHERE id = %s AND account_status <> 'BANNED'",
                           (user_id,))
    return row["admin_id"] if row else None


def current_user(authorization: str = Header(default="")) -> User:
    token = authorization.removeprefix("Bearer ")
    for role, secret in config.JWT_SECRETS.items():
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"],
                                 options={"require": ["exp", "id", "role"]})
        except jwt.InvalidTokenError:
            continue
        # the role inside the token must match the secret that signed it
        if payload["role"] != role:
            continue
        admin_id = _find_gym(role, payload["id"])
        if admin_id:
            return User(id=payload["id"], role=role, admin_id=admin_id)
        break
    raise HTTPException(401, "Invalid or expired token")


_requests: dict[str, list[float]] = {}
_lock = threading.Lock()


def check_rate_limit(user: User) -> None:
    now = time.monotonic()
    # requests run in parallel threads, so only one may update the dict at a time
    with _lock:
        recent = [t for t in _requests.get(user.id, []) if t > now - RATE_WINDOW]
        if len(recent) >= RATE_LIMIT:
            retry_after = int(recent[0] + RATE_WINDOW - now) + 1
            raise HTTPException(429, "Too many requests", headers={"Retry-After": str(retry_after)})
        recent.append(now)
        _requests[user.id] = recent


def rate_limited_user(user: User = Depends(current_user)) -> User:
    check_rate_limit(user)
    return user


def require_api_key(x_api_key: str = Header(default="")) -> None:
    # compare_digest takes the same time wherever the keys differ, so timing leaks nothing
    if not hmac.compare_digest(x_api_key.encode(), config.INTERNAL_API_KEY.encode()):
        raise HTTPException(401, "Invalid API key")
