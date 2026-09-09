"""Task 0.7 acceptance checks: the sliding-window rate limiter.

Run inside the ai container via scripts/verify.sh.

Two levels, because they prove different things. The HTTP tests prove the wiring:
the right limit on the right route, the headers, the 429 envelope. The function-level
tests prove the algorithm: that the window really slides, and that concurrent writers
cannot both slip through the same free slot.

The restart-survival check lives in verify.sh, since it has to restart the container.
"""

import asyncio
import json
import math
import sys
import time
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta

import aiosqlite
import jwt

from app.config import get_settings
from app.core.ratelimit import rate_limit
from app.db import engine as db
from app.state import db as state_db
from app.state.limits import Decision, check_and_record, sweep_expired

FAIL = 0
BASE = "http://127.0.0.1:8000"
settings = get_settings()
LIMIT = settings.RATE_LIMIT_CHAT_PER_MIN
DOCS_LIMIT = settings.RATE_LIMIT_DOCS_PER_MIN
WINDOW = settings.RATE_LIMIT_WINDOW_SECONDS


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


def mint(subject: str, role: str) -> str:
    secret = (settings.JWT_MEMBER_ACCESS_SECRET if role == "MEMBER"
              else settings.JWT_ADMIN_ACCESS_SECRET).get_secret_value()
    now = datetime.now(UTC)
    return jwt.encode({"id": subject, "role": role, "iat": int(now.timestamp()),
                       "exp": int((now + timedelta(minutes=15)).timestamp())},
                      secret, algorithm="HS256")


def http(path: str, token: str | None = None, key: str | None = None):
    req = urllib.request.Request(f"{BASE}{path}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if key:
        req.add_header("X-API-Key", key)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read() or b"null"), r.headers
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null"), e.headers


async def fresh_connection() -> aiosqlite.Connection:
    """A separate writer, i.e. what a second uvicorn worker would be."""
    conn = await aiosqlite.connect(settings.SQLITE_PATH, isolation_level=None)
    await conn.execute("PRAGMA busy_timeout = 5000")
    return conn


async def main() -> None:  # noqa: C901
    await db.init_engine(settings)
    await state_db.init_state_db(settings)

    # Start from a known state: these tests assert exact counts, and a previous run
    # (or the smoke test in verify.sh) would otherwise have spent part of the budget.
    await state_db.get_state_db().execute("DELETE FROM rate_events")

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
    omar = await by_email("members", "omar@gmail.com")
    rachid = await by_email("members", "rachid@gmail.com")

    omar_token, rachid_token = mint(omar, "MEMBER"), mint(rachid, "MEMBER")

    # ------------------------------------------------------------ headers, 1..N
    status, _, headers = http("/ai/rate-probe", omar_token)
    check("first request is allowed", status == 200)
    check("X-RateLimit-Limit reports the configured limit",
          headers.get("X-RateLimit-Limit") == str(LIMIT), f"limit={LIMIT}")
    check("X-RateLimit-Remaining counts this request",
          headers.get("X-RateLimit-Remaining") == str(LIMIT - 1))
    reset = int(headers["X-RateLimit-Reset"])
    # `<= WINDOW + 1`, not `<= WINDOW`: reset_at is rounded UP to a whole second so a
    # client never retries a fraction early. Retry-After has no such slack -- it is a
    # duration, and one longer than the window would be wrong.
    check("X-RateLimit-Reset is now + window",
          0 < reset - int(time.time()) <= WINDOW + 1, f"in {reset - int(time.time())}s")

    remaining = []
    for _ in range(LIMIT - 1):
        status, _, headers = http("/ai/rate-probe", omar_token)
        remaining.append((status, headers.get("X-RateLimit-Remaining")))
    check("requests 2..N are all allowed", all(s == 200 for s, _ in remaining))
    check("remaining counts down to zero",
          [r for _, r in remaining][-1] == "0",
          f"{LIMIT} requests, last remaining={remaining[-1][1]}")

    # -------------------------------------------------------------------- N + 1
    status, body, headers = http("/ai/rate-probe", omar_token)
    check("request N+1 is refused", status == 429)
    check("429 uses the documented envelope",
          body["error"]["code"] == "rate_limited", json.dumps(body))
    check("429 carries Retry-After", headers.get("Retry-After") is not None)
    check("429 still carries all three X-RateLimit headers",
          all(headers.get(h) for h in
              ("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset")))
    retry = int(headers["Retry-After"])
    check("Retry-After is a usable number of seconds", 1 <= retry <= WINDOW, f"{retry}s")
    check("the 429 message tells the caller when to come back",
          f"{retry}s" in body["error"]["message"], body["error"]["message"])
    check("remaining is zero, not negative", headers["X-RateLimit-Remaining"] == "0")

    # ------------------------------------------------- one exhausted subject only
    # The test that proves the key is the token subject. If it were the IP, or a
    # global counter, Rachid would be locked out by Omar's traffic.
    status, _, headers = http("/ai/rate-probe", rachid_token)
    check("a different subject has its own budget",
          status == 200 and headers["X-RateLimit-Remaining"] == str(LIMIT - 1))

    # ------------------------------------------------------ buckets are separate
    status, _, headers = http("/ai/rate-probe-docs", omar_token)
    check("a different bucket has its own budget",
          status == 200 and headers["X-RateLimit-Limit"] == str(DOCS_LIMIT),
          f"chat exhausted, docs limit={DOCS_LIMIT}")

    # ------------------------------------------------------------ exempt surfaces
    key = settings.INTERNAL_API_KEY.get_secret_value()
    codes = {http("/internal/ping", key=key)[0] for _ in range(DOCS_LIMIT + LIMIT + 5)}
    check("/internal/* is never rate limited", codes == {200}, f"{len(codes)} distinct status")
    status, _, headers = http("/ai/me", omar_token)
    check("/ai/me is not rate limited (identity probe)",
          status == 200 and headers.get("X-RateLimit-Limit") is None)
    status, _, _ = http("/ai/rate-probe")
    check("no token is still 401, not 429", status == 401)

    # ----------------------------------------------------- the window really slides
    # Two-second window, so the test finishes. This is the property that separates a
    # sliding window from a fixed one: the budget frees up as individual events age
    # out, not all at once on a clock boundary.
    subject, short = "slide-test-subject", 2
    for _ in range(3):
        await check_and_record(subject, "chat", 3, short)
    denied = await check_and_record(subject, "chat", 3, short)
    check("short window fills up", not denied.allowed)
    await asyncio.sleep(short + 0.3)
    freed = await check_and_record(subject, "chat", 3, short)
    check("the window slides: a slot frees up once events age out", freed.allowed,
          f"after {short}s, remaining={freed.remaining}")

    # A fixed-window implementation would have freed ALL three slots at once. Here
    # only the aged-out events are gone, so the next two go through and the fourth
    # does not.
    await check_and_record(subject, "chat", 3, short)
    await check_and_record(subject, "chat", 3, short)
    check("...and only the aged-out slots, not the whole budget",
          not (await check_and_record(subject, "chat", 3, short)).allowed)

    # -------------------------------------------------- concurrency, over HTTP
    # Through the real server, on the real shared connection. This is the test that
    # matters: an earlier version passed the separate-connection test below while
    # this one returned 4 x 200 and 36 x 500, because two concurrent requests both
    # issued BEGIN IMMEDIATE on the same connection and SQLite refused the second
    # with "cannot start a transaction within a transaction". A limiter that 500s
    # under load has not limited anything; it has just broken differently.
    # A member, not a gym admin, and that matters to the *suite* rather than to this
    # check: this test leaves its subject's budget fully spent for a whole window,
    # and check_chat.py needs the four admin subjects to have budget. Two suites
    # quietly sharing one subject made check_chat fail only when verify.sh was run
    # twice inside a minute -- the worst kind of failure to diagnose.
    burst_subject = await by_email("members", "latifa@gmail.com")
    burst_token = mint(burst_subject, "MEMBER")
    burst = await asyncio.gather(*[
        asyncio.to_thread(http, "/ai/rate-probe", burst_token) for _ in range(LIMIT * 2)
    ])
    codes = [status for status, _, _ in burst]
    check("parallel requests: exactly `limit` allowed",
          codes.count(200) == LIMIT, f"{len(codes)} at once -> {codes.count(200)} x 200")
    check("...and every refusal is a 429, never a 500",
          codes.count(429) == len(codes) - LIMIT and 500 not in codes,
          f"{codes.count(429)} x 429, {codes.count(500)} x 500")

    # ------------------------------------------- concurrency, separate connections
    # The other half: writers the in-process lock cannot see. A second uvicorn
    # worker or a second container is a separate connection to the same file, and
    # BEGIN IMMEDIATE is the only thing standing between them.
    race_subject, race_limit, attempts = "race-test-subject", 10, 40
    conns = [await fresh_connection() for _ in range(attempts)]
    try:
        results = await asyncio.gather(*[
            check_and_record(race_subject, "chat", race_limit, WINDOW, conn=c) for c in conns
        ])
    finally:
        for c in conns:
            await c.close()
    allowed = sum(1 for r in results if r.allowed)
    check("concurrent writers cannot exceed the limit", allowed == race_limit,
          f"{attempts} parallel requests, {allowed} allowed, limit {race_limit}")

    rows = await state_db.get_state_db().execute_fetchall(
        "SELECT COUNT(*) FROM rate_events WHERE subject = ?", (race_subject,))
    check("...and recorded exactly as many events as it allowed", rows[0][0] == race_limit)

    # --------------------------------------------------------------- housekeeping
    conn = state_db.get_state_db()
    await conn.execute("INSERT INTO rate_events VALUES ('gone-forever', 'chat', ?)",
                       (time.time() - 10_000,))
    removed = await sweep_expired(WINDOW)
    check("the startup sweep removes events nobody will check again", removed >= 1,
          f"{removed} rows")
    left = await conn.execute_fetchall(
        "SELECT COUNT(*) FROM rate_events WHERE subject = 'gone-forever'")
    check("...and leaves nothing behind for that subject", left[0][0] == 0)

    # ---------------------------------------------------------------- the shape
    decision = await check_and_record("shape-test", "chat", 5, WINDOW)
    check("a Decision is frozen", isinstance(decision, Decision) and decision.allowed)
    try:
        object.__setattr__ and decision.__setattr__("allowed", False)
        check("a Decision cannot be edited after the fact", False, "MUTATED")
    except Exception:
        check("a Decision cannot be edited after the fact", True)
    check("reset_at is a whole number of epoch seconds",
          isinstance(decision.reset_at, int)
          and decision.reset_at >= math.floor(time.time()))
    try:
        rate_limit("nonexistent-bucket")
        check("an unknown bucket is refused at wiring time", False, "ACCEPTED")
    except ValueError:
        check("an unknown bucket is refused at wiring time", True)

    await state_db.close_state_db()
    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
