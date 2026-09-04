"""Tasks 0.6 + 0.8 acceptance checks: internal API-key auth, error taxonomy, logging.

Run inside the ai container via scripts/verify.sh.

The log-content assertions (that a token never reaches a log line) live in
verify.sh instead, because they read `docker compose logs` from the host.
"""

import json
import logging
import sys
import time
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta

import jwt
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError, create_model

from app.auth.apikey import keys_match
from app.config import get_settings
from app.core import logging as applog
from app.core.errors import summarise_validation
from app.db import engine as db

FAIL = 0
BASE = "http://127.0.0.1:8000"
settings = get_settings()
KEY = settings.INTERNAL_API_KEY.get_secret_value()


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<46} {detail}")
    if not cond:
        FAIL = 1


def http(path, *, key=None, bearer=None, request_id=None, method="GET"):
    req = urllib.request.Request(f"{BASE}{path}", method=method)
    if key is not None:
        req.add_header("X-API-Key", key)
    if bearer:
        req.add_header("Authorization", f"Bearer {bearer}")
    if request_id:
        req.add_header("X-Request-ID", request_id)
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read() or b"null"), r.headers
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw), e.headers
        except json.JSONDecodeError:
            return e.code, {"_raw": raw.decode()[:200]}, e.headers


def main() -> None:  # noqa: C901
    # This is a separate process from the server, so the logging setup under test
    # has to be applied here before anything about it can be asserted.
    applog.configure_logging(settings)

    # ------------------------------------------------------- 0.6 API-key auth
    status, body, _ = http("/internal/ping", key=KEY)
    check("correct key -> 200", status == 200 and body["status"] == "ok")

    denials = []
    for label, key in (("no X-API-Key header", None),
                       ("empty key", ""),
                       ("wrong key", "totally-wrong"),
                       ("right prefix, wrong tail", KEY[:-1] + ("x" if KEY[-1] != "x" else "y")),
                       ("key that is a prefix of the real one", KEY[:-4])):
        status, body, _ = http("/internal/ping", key=key)
        check(f"{label} -> 401", status == 401 and body["error"]["code"] == "unauthorized")
        denials.append(json.dumps(body))
    check("every denial is byte-identical", len(set(denials)) == 1,
          "no oracle in the response body")

    # The two auth schemes must not substitute for each other.
    now = datetime.now(UTC)
    admin_id = "irrelevant-the-signature-is-what-is-checked"
    token = jwt.encode({"id": admin_id, "role": "ADMIN",
                        "iat": int(now.timestamp()),
                        "exp": int((now + timedelta(minutes=5)).timestamp())},
                       settings.JWT_ADMIN_ACCESS_SECRET.get_secret_value(), algorithm="HS256")
    status, _, _ = http("/internal/ping", bearer=token)
    check("a valid JWT does not open /internal", status == 401)
    status, _, _ = http("/ai/me", key=KEY)
    check("the API key does not open /ai", status == 401)

    # ------------------------------------------------- constant-time comparison
    check("keys_match accepts the real key", keys_match(KEY, KEY))
    check("keys_match rejects a one-character miss", not keys_match(KEY[:-1] + "Z", KEY))
    check("keys_match rejects a different length", not keys_match(KEY + "extra", KEY))

    # Both sides are hashed first, so every comparison is over 32 bytes no matter
    # what was presented. A `==` here would return early and the ratio would drift
    # far from 1: that difference, sampled enough times, recovers the key.
    def mean_ns(candidate: str, rounds: int = 30_000) -> float:
        start = time.perf_counter_ns()
        for _ in range(rounds):
            keys_match(candidate, KEY)
        return (time.perf_counter_ns() - start) / rounds

    early = mean_ns("Z" + KEY[1:])        # differs at character 0
    late = mean_ns(KEY[:-1] + "Z")        # differs at the last character
    ratio = early / late
    check("comparison time does not depend on the prefix", 0.5 < ratio < 2.0,
          f"first-char vs last-char miss: ratio {ratio:.2f}")

    # ------------------------------------------------------ 0.8 error taxonomy
    status, body, _ = http("/no-such-route")
    check("404 -> not_found envelope",
          status == 404 and body["error"]["code"] == "not_found", json.dumps(body))
    status, body, _ = http("/health", method="POST")
    check("405 -> invalid_request envelope",
          status == 405 and body["error"]["code"] == "invalid_request")
    status, body, _ = http("/internal/ping", key=KEY, method="DELETE")
    check("an unsupported method still gets the envelope",
          status == 405 and "error" in body)

    status, body, headers = http("/internal/boom", key=KEY)
    text = json.dumps(body)
    check("unhandled exception -> 500 internal_error",
          status == 500 and body["error"]["code"] == "internal_error")
    check("the 500 body carries no stack trace",
          not any(w in text for w in ("Traceback", "RuntimeError", "/app/", "line ")), text[:70])
    check("the 500 body carries no exception text",
          "sk-secret-should-not-be-in-the-response" not in text)
    check("the 500 reference matches X-Request-ID",
          headers.get("X-Request-ID") and headers["X-Request-ID"] in text,
          headers.get("X-Request-ID"))

    # Validation errors must not echo values, for the same reason config errors
    # must not: a request body can contain anything a caller typed.
    Model = create_model("Model", password=(str, ...))
    try:
        Model(password=12345)
    except ValidationError as exc:
        raw = exc.errors()
        # What FastAPI actually raises: the loc is prefixed with the request part.
        as_body = [{**e, "loc": ("body", *e["loc"])} for e in raw]
        summary = summarise_validation(RequestValidationError(as_body))
        check("validation errors name the field", summary.startswith("password:"), summary)
        check("the request-part prefix is stripped", "body." not in summary)
        # A loc with no request part must not be swallowed by a blind slice.
        bare = summarise_validation(RequestValidationError(raw))
        check("a single-segment loc survives", bare.startswith("password:"), bare)
        check("(control) pydantic's own error prints the value", "12345" in str(exc))
        check("validation errors do not echo the value", "12345" not in summary)

    # --------------------------------------------------------- request context
    status, _, headers = http("/health")
    check("every response carries X-Request-ID", bool(headers.get("X-Request-ID")))
    status, _, headers = http("/health", request_id="trace-abc-123")
    check("a caller's X-Request-ID is reused", headers.get("X-Request-ID") == "trace-abc-123")
    status, _, headers = http("/health", request_id="bad id with spaces")
    check("an unsafe X-Request-ID is replaced, not echoed",
          headers.get("X-Request-ID") not in (None, "bad id with spaces"),
          headers.get("X-Request-ID"))
    a = http("/health")[2]["X-Request-ID"]
    b = http("/health")[2]["X-Request-ID"]
    check("ids are unique per request", a != b)

    # -------------------------------------------------------------- formatters
    record = logging.LogRecord("app.test", logging.INFO, __file__, 1,
                               "hello %s", ("world",), None)
    record.fields = {"status": 200, "path": "/ai/chat"}
    line = applog._JsonFormatter().format(record)
    parsed = json.loads(line)
    check("production logs are one JSON object per line",
          parsed["msg"] == "hello world" and parsed["status"] == 200
          and parsed["logger"] == "app.test" and "ts" in parsed)
    check("JSON log lines carry the request id", "request_id" in parsed)

    try:
        raise ValueError("boom-with-detail")
    except ValueError:
        rec = logging.LogRecord("app.test", logging.ERROR, __file__, 1, "failed", (),
                                sys.exc_info())
    parsed = json.loads(applog._JsonFormatter().format(rec))
    check("a traceback goes into the log, as a field",
          "Traceback" in parsed["exception"] and "boom-with-detail" in parsed["exception"])
    check("the JSON line survives a message with quotes and newlines",
          json.loads(applog._JsonFormatter().format(
              logging.LogRecord("t", 20, "f", 1, 'a "b"\nc', (), None)))["msg"] == 'a "b"\nc')

    # A request path is attacker-chosen and goes straight into a log line.
    check("scrub removes CR/LF from a logged value",
          applog.scrub("/a\r\nINJECTED") == "/a??INJECTED", applog.scrub("/a\r\nINJECTED"))
    check("scrub removes NUL and other control bytes",
          "\x00" not in applog.scrub("/a\x00b") and "\x1b" not in applog.scrub("/a\x1b[31m"))
    check("scrub truncates a very long path",
          len(applog.scrub("/" + "x" * 5000)) < 250)
    check("scrub leaves an ordinary path alone",
          applog.scrub("/ai/chat?thread_id=b1f2") == "/ai/chat?thread_id=b1f2")

    check("uvicorn's own access log is silenced",
          logging.getLogger("uvicorn.access").handlers == []
          and not logging.getLogger("uvicorn.access").propagate)

    sys.exit(FAIL)


main()
