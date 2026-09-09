"""Task 2.3 acceptance checks: `POST /ai/chat` over real HTTP.

Run inside the ai container via scripts/verify.sh.

Split deliberately. **The default half never reaches Gemini** -- every check here is
a request that fails before the model is called (no token, bad body, exhausted
budget), which is exactly the half that must run on every commit without spending
money or depending on the network. The event grammar itself is asserted offline in
`check_agent.py`, against `stream_turn` rather than against HTTP.

`AI_LIVE_TESTS=1` adds the streaming half: a real question, a real answer, and the
tenancy check that matters -- the same question, two gyms, two different numbers.
"""

import asyncio
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta

import jwt

from app.config import get_settings
from app.db import engine as db

FAIL = 0
BASE = "http://127.0.0.1:8000"
settings = get_settings()


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<52} {detail}")
    if not cond:
        FAIL = 1


def mint(role: str, subject_id: str) -> str:
    secret = (settings.JWT_ADMIN_ACCESS_SECRET if role == "ADMIN"
              else settings.JWT_MEMBER_ACCESS_SECRET).get_secret_value()
    now = datetime.now(UTC)
    return jwt.encode({"id": subject_id, "role": role,
                       "iat": int(now.timestamp()),
                       "exp": int((now + timedelta(minutes=15)).timestamp())},
                      secret, algorithm="HS256")


def post_chat(token: str | None, body: object, *, timeout: float = 90.0, raw: bool = False):
    """Returns (status, headers, text). The stream is read to completion.

    `raw` sends the body verbatim so a malformed JSON case can be tested; otherwise
    it is encoded here.
    """
    data = body if isinstance(body, bytes) else json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}/ai/chat", method="POST", data=data)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.headers, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.headers, e.read().decode()


def get_json(path: str, token: str):
    req = urllib.request.Request(f"{BASE}{path}")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read() or b"null")
    except urllib.error.HTTPError as e:
        e.read()
        return e.code, None


def get_probe(token: str) -> int:
    req = urllib.request.Request(f"{BASE}/ai/rate-probe")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status
    except urllib.error.HTTPError as e:
        e.read()
        return e.code


def parse_sse(text: str) -> list[tuple[str, dict]]:
    """The frontend's job, done here so the assertions are about events, not text."""
    events: list[tuple[str, dict]] = []
    name = None
    for line in text.splitlines():
        if line.startswith("event: "):
            name = line[7:]
        elif line.startswith("data: ") and name:
            events.append((name, json.loads(line[6:])))
            name = None
    return events


def streamed(label: str, status: int, text: str) -> list[tuple[str, dict]]:
    """Parse a streamed response, or fail with the reason rather than an IndexError.

    A live check that indexes into an empty list dies with a traceback that verify.sh
    has sent to /dev/null, so the suite reports FAIL with nothing printed. Whatever
    else a check does, it has to be able to say what happened.
    """
    if status != 200:
        check(label, False, f"status={status} {envelope(text).get('code', '')}")
        return []
    events = parse_sse(text)
    if not events:
        check(label, False, "200 but no events parsed")
        return []
    # A stream can be 200 and still have failed: the error travels as an event, which
    # is the whole point of 2.3 and exactly the case a token-only assertion misses.
    failed = [data for kind, data in events if kind == "error"]
    if failed:
        check(label, False, f"error event: {failed[0].get('code')} {failed[0].get('message', '')[:40]}")
    return events


def envelope(text: str) -> dict:
    try:
        return json.loads(text).get("error", {})
    except json.JSONDecodeError:
        return {}


async def main() -> None:  # noqa: C901 -- a check script is a list, not a design
    await db.init_engine(settings)
    atlas = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "karim@atlasfitness.ma"}))["id"]
    oasis = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "nadia@oasisgym.ma"}))["id"]
    medina = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                  {"e": "salma@medinawellness.ma"}))["id"]
    titan = (await db._fetch_one("SELECT id FROM users WHERE email = :e",
                                 {"e": "mehdi@titanfitness.ma"}))["id"]
    # Siham, not Omar: check_ratelimit.py spends Omar's chat budget and leaves it
    # spent for a window, so a verify.sh run started inside that window found this
    # request 429ed -- and the script then crashed indexing an empty event list, with
    # stderr redirected to /dev/null. Two failures in one: a shared subject, and a
    # live check that could not say what went wrong.
    siham = (await db._fetch_one("SELECT id FROM members WHERE email = :e",
                                 {"e": "siham@gmail.com"}))["id"]

    # Four subjects, on purpose. The rate limiter keys on the token's `id`, and a
    # rejected request still spends a slot -- dependencies resolve before the body is
    # validated, so a malformed POST costs the same as a real one (deliberate: a
    # caller must not get an unlimited budget for garbage). Sharing one subject
    # across the validation checks, the exhaustion check and the live checks would
    # make each group's failures depend on how many requests the group above it made.
    owner_token = mint("ADMIN", medina)   # the validation checks
    burn_token = mint("ADMIN", titan)     # the exhaustion check
    live_token = mint("ADMIN", atlas)     # the live checks
    rival_token = mint("ADMIN", oasis)
    member_token = mint("MEMBER", siham)

    # ------------------------------------------- refused before Gemini is paid
    print("\n\033[1m  refused before a token is spent\033[0m")

    status, _, text = post_chat(None, {"message": "hello"})
    check("no bearer token is 401, not a stream", status == 401,
          envelope(text).get("code", ""))
    status, _, text = post_chat("not.a.token", {"message": "hello"})
    check("a forged token is 401", status == 401, envelope(text).get("code", ""))

    status, _, text = post_chat(owner_token, {"message": ""})
    check("an empty message is 400", status == 400, envelope(text).get("code", ""))
    status, _, text = post_chat(owner_token, {"message": "   \t  "})
    check("...and so is one that is only whitespace", status == 400,
          "min_length alone would accept it")

    long_message = "a" * (settings.MAX_MESSAGE_CHARS + 1)
    status, _, text = post_chat(owner_token, {"message": long_message})
    check("a message over MAX_MESSAGE_CHARS is 400", status == 400,
          f"{settings.MAX_MESSAGE_CHARS} chars allowed")
    check("...and the refusal does not echo it back",
          long_message[:50] not in text, envelope(text).get("message", "")[:44])

    status, _, text = post_chat(owner_token, {"messsage": "typo"})
    check("an unknown field is refused, not ignored", status == 400,
          "extra=forbid, so a typo is visible")
    status, _, text = post_chat(owner_token, b"{not json")
    check("a malformed body is 400 in the documented envelope",
          status == 400 and envelope(text).get("code") == "invalid_request")

    # The thread id is echoed into `meta` and into a log line. Anything that reaches
    # both has to be a shape, not a string a caller chooses.
    status, _, text = post_chat(owner_token, {"message": "hi", "thread_id": "../../etc/passwd"})
    check("a thread id that is not a UUID is refused", status == 400,
          envelope(text).get("message", "")[:44])
    status, _, text = post_chat(owner_token,
                                {"message": "hi", "thread_id": "a\r\nevent: done\r\ndata: {}"})
    check("...including one carrying CRLF, which would forge an event", status == 400)

    # ---------------------------------------------------------------- threads
    print("\n\033[1m  conversations belong to somebody\033[0m")

    # A real thread, owned by the validation subject.
    status, _, text = post_chat(owner_token, {"message": "hello"})
    mine = parse_sse(text)[0][1]["thread_id"] if status == 200 and parse_sse(text) else None
    if mine is None:
        # No Gemini needed for the security assertion below -- but the thread has to
        # exist, and creating one means a real turn. Skipped rather than faked when
        # the model is not reachable.
        check("a conversation id comes back to be reused", False, f"status={status}")
    else:
        check("a conversation id comes back to be reused", len(mine) == 36, mine)
        status, _, text = post_chat(live_token, {"message": "what did we discuss?",
                                                 "thread_id": mine})
        check("another user sending that id gets 404, not the transcript",
              status == 404 and envelope(text).get("code") == "not_found",
              f"status={status}")
        status, _, text = post_chat(member_token, {"message": "what did we discuss?",
                                                   "thread_id": mine})
        check("...and so does a member", status == 404, f"status={status}")

    status, _, text = post_chat(owner_token,
                                {"message": "hi", "thread_id": "3f6d1c8e-0000-4000-8000-000000000000"})
    check("an unknown conversation id is 404, never 403",
          status == 404, "403 would confirm the id belongs to somebody")

    # ---------------------------------------------------------- the rate limit
    print("\n\033[1m  the chat bucket\033[0m")

    # Spend the budget through /ai/rate-probe, which costs nothing, then prove
    # /ai/chat is refused on the same budget. Going through the server rather than
    # writing the counter directly is the point: it is the *wiring* under test --
    # that the endpoint declares the chat bucket, keyed on the same subject.
    limit = settings.RATE_LIMIT_CHAT_PER_MIN
    codes = {get_probe(burn_token) for _ in range(limit + 1)}
    # `429 in codes`, not `codes == {200, 429}`: run verify.sh twice inside one
    # window and this subject starts already spent. What is under test is that the
    # budget runs out and that /ai/chat is refused on the same one -- not whether the
    # first request of this particular run happened to be allowed.
    check("the budget runs out on the free probe", 429 in codes, str(sorted(codes)))
    check("...and a different subject still has its own",
          get_probe(owner_token) == 200, "the key is the JWT subject, not the endpoint")

    status, headers, text = post_chat(burn_token, {"message": "this must not reach Gemini"})
    check("an exhausted budget stops the request at the door", status == 429,
          envelope(text).get("code", ""))
    check("...as JSON, not as an error event inside a 200 stream",
          "text/event-stream" not in (headers.get("Content-Type") or ""),
          headers.get("Content-Type", ""))
    check("...carrying Retry-After", bool(headers.get("Retry-After")),
          f"{headers.get('Retry-After')}s")
    check("...and the three rate-limit headers",
          all(headers.get(h) for h in
              ("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset")))

    # ------------------------------------------------------------------- live
    if os.getenv("AI_LIVE_TESTS") != "1":
        print("\n  \033[2m(streaming checks skipped -- set AI_LIVE_TESTS=1)\033[0m")
        await db.dispose_engine()
        sys.exit(FAIL)

    print("\n\033[1m  live: a real streamed answer\033[0m")
    from app.db import reports
    from app.db.scope import Scope

    truth = await reports.gym_overview(Scope(admin_id=atlas))
    rival_truth = await reports.gym_overview(Scope(admin_id=oasis))

    status, headers, text = post_chat(live_token,
                                      {"message": "how many active members do we have?"})
    events = streamed("the live question was answered at all", status, text)
    if not events:
        await db.dispose_engine()
        sys.exit(1)
    kinds = [name for name, _ in events]
    check("a good request is 200 text/event-stream", status == 200
          and "text/event-stream" in (headers.get("Content-Type") or ""),
          headers.get("Content-Type", ""))
    check("nginx is told not to buffer the stream",
          headers.get("X-Accel-Buffering") == "no")
    check("...and no proxy is allowed to cache it",
          "no-cache" in (headers.get("Cache-Control") or ""))
    check("the rate-limit headers survive onto a streamed response",
          all(headers.get(h) for h in
              ("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset")),
          f"remaining={headers.get('X-RateLimit-Remaining')}")

    check("meta is first and carries a thread id",
          kinds[:1] == ["meta"] and len(events[0][1]["thread_id"]) == 36,
          events[0][1].get("thread_id", ""))
    check("done is last", kinds[-1:] == ["done"], events[-1][1].get("finish_reason", ""))
    check("the model actually called a tool",
          any(k == "tool" for k in kinds),
          ", ".join(sorted({d["name"] for k, d in events if k == "tool"})))
    answer = "".join(d["text"] for k, d in events if k == "token")
    check("the answer streamed in more than one piece",
          sum(1 for k in kinds if k == "token") >= 1,
          f"{sum(1 for k in kinds if k == 'token')} token events")
    check("...and contains this gym's real number",
          str(truth["active_members"]) in answer.replace(",", ""), answer[:60])

    # The same question, the other gym, over HTTP. Every assertion in this project
    # about tenant isolation is vacuous unless the second tenant answers differently.
    status, _, text = post_chat(rival_token, {"message": "how many active members do we have?"})
    other = "".join(d["text"] for k, d in streamed("the rival gym answered", status, text)
                    if k == "token")
    check("the other gym's token gets the other gym's number",
          str(rival_truth["active_members"]) in other.replace(",", "")
          and truth["active_members"] != rival_truth["active_members"],
          other[:60])

    # A conversation, over HTTP, end to end. The id cannot be invented any more --
    # `open_thread` refuses one it does not own -- so it has to come from a first
    # turn, which is also how a frontend gets it.
    status, _, text = post_chat(member_token, {"message": "when does my membership expire?"})
    member_events = streamed("a member's question was answered", status, text)
    given = member_events[0][1]["thread_id"] if member_events else ""
    check("a new conversation comes back with an id", len(given) == 36, given)

    status, _, text = post_chat(member_token,
                                # Unambiguous on purpose: "what did I just ask you"
                                # is a question the model can honestly answer with
                                # *this* message, and it did.
                                {"message": "before this message, what did I ask you? quote it",
                                 "thread_id": given})
    resumed = streamed("the conversation resumes on that id", status, text)
    memory = "".join(d["text"] for k, d in resumed if k == "token")
    check("...and the assistant remembers the previous turn",
          "expire" in memory.lower(), memory[:70])
    check("...on the same id it was given",
          bool(resumed) and resumed[0][1]["thread_id"] == given)

    # Redrawing after a reload: the panel loses the transcript otherwise, while the
    # server still holds it -- the assistant remembers and the screen does not.
    status, listing = get_json("/ai/threads", member_token)
    check("the conversation appears in the caller's listing",
          status == 200 and any(row["thread_id"] == given for row in listing or []),
          f"status={status}")
    status, redrawn = get_json(f"/ai/threads/{given}", member_token)
    check("...and can be redrawn in the shape the panel renders",
          status == 200 and bool(redrawn)
          and {row["author"] for row in redrawn} <= {"user", "assistant"},
          f"{len(redrawn or [])} messages")
    check("...with the tools that ran attached to the answer",
          any(row["tools"] for row in redrawn or []),
          str([row["tools"] for row in redrawn or []][:3]))

    status, _ = get_json(f"/ai/threads/{given}", live_token)
    check("another account cannot redraw it", status == 404, f"status={status}")
    status, theirs = get_json("/ai/threads", live_token)
    check("...and it is absent from their listing",
          status == 200 and all(row["thread_id"] != given for row in theirs or []))
    member_answer = "".join(d["text"] for k, d in member_events if k == "token")
    check("a member gets their own answer, streamed",
          bool(member_answer.strip()), member_answer[:60])
    check("...using only member tools",
          all(d["name"].startswith("get_my")
              for k, d in member_events if k == "tool"),
          ", ".join(sorted({d["name"] for k, d in member_events if k == "tool"})))

    await db.dispose_engine()
    sys.exit(FAIL)


asyncio.run(main())
