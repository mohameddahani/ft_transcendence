"""Task 0.5 acceptance checks: JWT verification and tenant resolution.

Run inside the ai container via scripts/verify.sh. Mints tokens with the same two
secrets Dahani signs with, then attacks them.

The interesting tests are the escalation ones. A JWT payload is base64, not
encryption: anyone holding a member token can rewrite `"role":"MEMBER"` to
`"ADMIN"`. What stops that is (a) never choosing the key from the unverified claim,
and (b) checking after verification that the claim matches the key that verified it.
Both are asserted below.
"""

import asyncio
import base64
import json
import sys
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta

import jwt
from pydantic import ValidationError

from app.auth.dependencies import AuthContext, require_admin
from app.auth.tokens import InvalidToken, verify_access_token
from app.config import Settings, get_settings, render_config_error
from app.db import engine as db
from app.db import tenancy
from app.db.models import Role
from app.db.scope import Scope
from app.core.errors import ApiError

FAIL = 0
BASE = "http://127.0.0.1:8000"
settings = get_settings()
ADMIN_SECRET = settings.JWT_ADMIN_ACCESS_SECRET.get_secret_value()
MEMBER_SECRET = settings.JWT_MEMBER_ACCESS_SECRET.get_secret_value()


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


def mint(subject: str, role: str, secret: str, *, ttl_seconds: int = 900,
         drop: str = "") -> str:
    """A token shaped exactly like nestjs/jwt's: {id, role, iat, exp}, HS256."""
    now = datetime.now(UTC)
    payload = {"id": subject, "role": role,
               "iat": int(now.timestamp()),
               "exp": int((now + timedelta(seconds=ttl_seconds)).timestamp())}
    payload.pop(drop, None)
    return jwt.encode(payload, secret, algorithm="HS256")


def rejects(label: str, token: str) -> None:
    try:
        claims = verify_access_token(token, settings)
        check(label, False, f"ACCEPTED as {claims.role}")
    except InvalidToken as exc:
        check(label, True, str(exc)[:34])


def b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def http(path: str, token: str | None = None, raw_header: str | None = None):
    req = urllib.request.Request(f"{BASE}{path}")
    if raw_header:
        req.add_header("Authorization", raw_header)
    elif token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read()), r.headers
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()), e.headers


async def main() -> None:  # noqa: C901
    await db.init_engine(settings)

    # Anchored on email: the seeder puts 150-400 members in each gym, so row order
    # and first names stopped identifying anyone. user_name would be unique but is
    # deliberately outside the ai_readonly column grant.
    async def by_email(table: str, email: str) -> str:
        row = await db._fetch_one(f"SELECT id FROM {table} WHERE email = :e", {"e": email})
        if row is None:
            print(f"\033[31m  x fixture row {email} missing\033[0m")
            sys.exit(1)
        return row["id"]

    atlas = await by_email("users", "karim@atlasfitness.ma")
    oasis = await by_email("users", "nadia@oasisgym.ma")
    omar = await by_email("members", "omar@gmail.com")
    rachid = await by_email("members", "rachid@gmail.com")

    # ------------------------------------------------------------ happy path
    admin_token = mint(atlas, "ADMIN", ADMIN_SECRET)
    member_token = mint(omar, "MEMBER", MEMBER_SECRET)

    c = verify_access_token(admin_token, settings)
    check("admin token verifies", c.role is Role.ADMIN and c.subject == atlas)
    c = verify_access_token(member_token, settings)
    check("member token verifies", c.role is Role.MEMBER and c.subject == omar)

    # ------------------------------------------------------ privilege escalation
    # The attack the whole module is shaped around: take your own member token and
    # rewrite the role claim.
    forged = mint(omar, "ADMIN", MEMBER_SECRET)
    rejects("member's key cannot mint an ADMIN claim", forged)
    rejects("admin's key cannot mint a MEMBER claim", mint(atlas, "MEMBER", ADMIN_SECRET))

    # Same attack at the wire level: keep the valid signature, swap the payload.
    head, body, sig = member_token.split(".")
    claims = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
    claims["role"] = "ADMIN"
    rejects("tampered payload breaks the signature",
            f"{head}.{b64(json.dumps(claims).encode())}.{sig}")

    # alg:none — the token that verifies against nothing at all.
    none_token = (b64(json.dumps({"alg": "none", "typ": "JWT"}).encode()) + "."
                  + b64(json.dumps({"id": atlas, "role": "ADMIN",
                                    "iat": 0, "exp": 9_999_999_999}).encode()) + ".")
    rejects("alg:none is refused", none_token)

    rejects("unknown signing secret is refused", mint(atlas, "ADMIN", "z" * 64))
    rejects("OWNER token is refused (we hold no owner key)",
            mint(atlas, "OWNER", "owner-secret-that-we-do-not-have-x"))
    rejects("expired token is refused", mint(atlas, "ADMIN", ADMIN_SECRET, ttl_seconds=-60))
    rejects("token without exp is refused", mint(atlas, "ADMIN", ADMIN_SECRET, drop="exp"))
    rejects("token without iat is refused", mint(atlas, "ADMIN", ADMIN_SECRET, drop="iat"))
    rejects("token without id is refused", mint(atlas, "ADMIN", ADMIN_SECRET, drop="id"))
    rejects("garbage is refused", "not-even-a-jwt")
    rejects("empty token is refused", "")

    # Leeway is a deliberate widening of the expiry window; assert its size.
    check("clock-skew leeway accepts a just-expired token",
          verify_access_token(mint(atlas, "ADMIN", ADMIN_SECRET, ttl_seconds=-5),
                              settings).role is Role.ADMIN,
          f"leeway={settings.JWT_LEEWAY_SECONDS}s")

    # ---------------------------------------------------- config: secrets must differ
    base_kwargs = dict(INTERNAL_API_KEY="x" * 16,
                       AI_DATABASE_URL="postgresql+asyncpg://ai_readonly:p@h:5432/d")
    try:
        Settings(_env_file=None, JWT_ADMIN_ACCESS_SECRET="s" * 40,
                 JWT_MEMBER_ACCESS_SECRET="s" * 40, **base_kwargs)
        check("boot refuses two identical role secrets", False, "ACCEPTED")
    except ValidationError as exc:
        check("boot refuses two identical role secrets", "identical" in str(exc))
    # A boot log ends up in `docker compose logs`, in CI output, and in whatever
    # someone pastes into a chat asking why the container will not start. Pydantic's
    # own message would print the rejected secret verbatim.
    leaky = "hunter2-real-secret"  # under 32 chars
    try:
        Settings(_env_file=None, JWT_ADMIN_ACCESS_SECRET=leaky,
                 JWT_MEMBER_ACCESS_SECRET="b" * 40, **base_kwargs)
        check("a too-short secret is refused", False, "ACCEPTED")
    except ValidationError as exc:
        check("a too-short secret is refused", "at least 32" in str(exc))
        check("(control) pydantic's own error would print it", leaky in str(exc))
        check("boot error redacts the rejected secret", leaky not in render_config_error(exc),
              render_config_error(exc).splitlines()[1].strip())

    ok_settings = Settings(_env_file=None, JWT_ADMIN_ACCESS_SECRET="a" * 40,
                           JWT_MEMBER_ACCESS_SECRET="b" * 40, **base_kwargs)
    check("...and accepts two different ones", ok_settings.APP_ENV == "development")
    check("secrets do not appear in a settings repr",
          "a" * 40 not in repr(ok_settings), repr(ok_settings.JWT_ADMIN_ACCESS_SECRET))

    # ------------------------------------------------------- tenant resolution
    ident = await tenancy.resolve_admin(atlas)
    check("resolve_admin finds the gym", ident is not None and ident.admin_id == atlas,
          ident.company_name)
    check("resolve_admin builds a gym-wide scope",
          ident.scope == Scope(admin_id=atlas) and ident.scope.member_id is None)
    check("a member id does not resolve as an admin", await tenancy.resolve_admin(omar) is None)
    check("an unknown id does not resolve", await tenancy.resolve_admin("no-such-id") is None)

    mem = await tenancy.resolve_member(omar)
    check("resolve_member finds the member's gym", mem is not None and mem.admin_id == atlas)
    check("resolve_member builds a doubly-narrowed scope",
          mem.scope == Scope(admin_id=atlas, member_id=omar) and mem.scope.is_member)
    check("a member of gym 2 resolves to gym 2",
          (await tenancy.resolve_member(rachid)).admin_id == oasis)
    check("an unknown member does not resolve",
          await tenancy.resolve_member("no-such-id") is None)

    # ----------------------------------------------------------- HTTP end to end
    status, body, headers = http("/ai/me")
    check("no header -> 401 in the documented envelope",
          status == 401 and body["error"]["code"] == "unauthorized", json.dumps(body))
    check("401 carries WWW-Authenticate: Bearer",
          headers.get("WWW-Authenticate") == "Bearer")
    check("401 message names no cause",
          "secret" not in json.dumps(body).lower() and "expired" not in json.dumps(body).lower(),
          body["error"]["message"])

    status, body, _ = http("/ai/me", raw_header="Basic YWRtaW46YWRtaW4=")
    check("wrong auth scheme -> 401", status == 401)
    status, body, _ = http("/ai/me", token=forged)
    check("forged admin token -> 401", status == 401)
    status, body, _ = http("/ai/me", token=mint(atlas, "ADMIN", ADMIN_SECRET, ttl_seconds=-600))
    check("expired token -> 401, same message as any other failure",
          status == 401 and body["error"]["message"] == "Invalid or expired token.")

    status, body, _ = http("/ai/me", token=admin_token)
    check("admin token -> 200 with its own gym",
          status == 200 and body["gym"] == "Atlas Fitness Agadir" and body["member_name"] is None,
          json.dumps(body))
    status, body, _ = http("/ai/me", token=member_token)
    check("member token -> 200, own name, own gym",
          status == 200 and body["gym"] == "Atlas Fitness Agadir"
          and body["member_name"] == "Omar Tazi", json.dumps(body))
    status, body, _ = http("/ai/me", token=mint(rachid, "MEMBER", MEMBER_SECRET))
    check("gym 2's member sees gym 2, through the whole chain",
          status == 200 and body["gym"] == "Oasis Gym Marrakech"
          and body["member_name"] == "Rachid Ouali", json.dumps(body))
    check("the response echoes no tenant ids",
          atlas not in json.dumps(body) and oasis not in json.dumps(body))

    status, _, _ = http("/health")
    check("/health stays unauthenticated", status == 200)

    # ------------------------------------------------------------- role gate
    member_ctx = AuthContext(scope=Scope(admin_id=atlas, member_id=omar),
                             role=Role.MEMBER, subject=omar)
    try:
        await require_admin(member_ctx)
        check("require_admin refuses a member token", False, "ALLOWED")
    except ApiError as exc:
        check("require_admin refuses a member token",
              exc.status_code == 403 and exc.detail["error"]["code"] == "forbidden")
    admin_ctx = AuthContext(scope=Scope(admin_id=atlas), role=Role.ADMIN, subject=atlas)
    check("require_admin passes an admin token",
          (await require_admin(admin_ctx)) is admin_ctx)

    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
