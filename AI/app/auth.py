import hmac
import threading
import time
from dataclasses import dataclass

import jwt
from fastapi import Depends, Header, HTTPException

from app import config, db

RATE_LIMIT = 20
RATE_WINDOW = 60


@dataclass(frozen=True)
class User:
    id: str
    role: str       # ADMIN, STAFF or MEMBER
    admin_id: str   # the gym this user belongs to


# only ACTIVE accounts get in, like the backend: PENDING (frozen) and BANNED are refused
def _find_gym(role: str, user_id: str) -> str | None:
    if role == "ADMIN":
        row = db.fetch_one("SELECT id FROM users WHERE id = %s AND role = 'ADMIN' AND account_status = 'ACTIVE'",
                           (user_id,))
        return row["id"] if row else None
    if role == "STAFF":
        row = db.fetch_one("SELECT admin_id FROM staffs WHERE id = %s AND account_status = 'ACTIVE'",
                           (user_id,))
    else:
        row = db.fetch_one("SELECT admin_id FROM members WHERE id = %s AND account_status = 'ACTIVE'",
                           (user_id,))
    return row["admin_id"] if row else None


# like the backend: the gym must have an active platform subscription on an active plan, or nobody of it gets in
def _has_subscription(admin_id: str) -> bool:
    row = db.fetch_one("""
        SELECT 1 FROM subscriptions s JOIN plans p ON p.id = s.plan_id
        WHERE s.user_id = %s AND s.subscription_status = 'ACTIVE' AND s.expires_at > now() AND p.is_active
        LIMIT 1""", (admin_id,))
    return row is not None


def current_user(authorization: str = Header(default="")) -> User: # FastAPI fill this parameter from the HTTP Authorization header
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
            # 403, not 401: the login is valid, the gym's subscription is not
            if not _has_subscription(admin_id):
                raise HTTPException(403, "An active admin subscription is required to continue.")
            return User(id=payload["id"], role=role, admin_id=admin_id)
        break
    raise HTTPException(401, "Invalid or expired token")


_requests: dict[str, list[float]] = {} # This dictionary stores recent request times per user
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

# authenticate the user and apply the rate limit
def rate_limited_user(user: User = Depends(current_user)) -> User:  # noqa: B008
    check_rate_limit(user)
    return user


def require_api_key(x_api_key: str = Header(default="")) -> None:
    # compare_digest takes the same time wherever the keys differ, so timing leaks nothing
    if not hmac.compare_digest(x_api_key.encode(), config.INTERNAL_API_KEY.encode()):
        raise HTTPException(401, "Invalid API key")
