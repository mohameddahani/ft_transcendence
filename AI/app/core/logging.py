"""Structured logging and the request context that ties log lines together.

Two problems this solves.

**Correlating a report with a log line.** "The assistant errored" is unactionable
when twenty people are using it. Every request gets an id, which goes into every log
line it produces, into the `X-Request-ID` response header, and into the message of a
500. Someone pastes that id and you have the exact request.

**Machines reading logs.** In production the format is one JSON object per line, so
`docker compose logs | jq` works and a log shipper needs no regex. In development it
is plain text, because a human is reading it.

What is deliberately never logged: the `Authorization` header, `X-API-Key`, and
request bodies. A chat body is a member asking about their own membership -- putting
that in a log file makes the log file a copy of the data we are careful about
everywhere else.
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any, Final
from uuid import uuid4

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import Settings

REQUEST_ID_HEADER: Final = "X-Request-ID"

# ContextVar, not a global: concurrent requests each see their own value, and an
# `await` in the middle of one does not hand another request's id to a log line.
_request_id: ContextVar[str] = ContextVar("request_id", default="-")

# An id arriving from nginx or from Dahani's backend is untrusted text that is about
# to be written into a log file. A newline in it would forge a whole log entry.
_SAFE_ID = re.compile(r"^[A-Za-z0-9_.-]{1,64}$")

# Same problem, different door: the request path is attacker-chosen too. A GET for
# `/a%0d%0aINJECTED` puts a real CRLF into `scope["path"]`, and in the development
# text format that is a second, fabricated log line -- one that can claim any status
# on any path. JSON escapes it, but the format a developer actually reads must not
# be the forgeable one.
_CONTROL = re.compile(r"[\x00-\x1f\x7f]")
_MAX_LOGGED_PATH = 200

access_logger = logging.getLogger("app.access")


def get_request_id() -> str:
    return _request_id.get()


def scrub(value: str, limit: int = _MAX_LOGGED_PATH) -> str:
    """Make an attacker-controlled string safe to write into a log line."""
    cleaned = _CONTROL.sub("?", value)
    return cleaned if len(cleaned) <= limit else cleaned[:limit] + "...[truncated]"


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "request_id": get_request_id(),
            "msg": record.getMessage(),
        }
        fields = getattr(record, "fields", None)
        if isinstance(fields, dict):
            payload.update(fields)
        if record.exc_info:
            # The traceback belongs here, in the log, and nowhere near a response.
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


class _TextFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        record.request_id = get_request_id()
        base = super().format(record)
        fields = getattr(record, "fields", None)
        if isinstance(fields, dict):
            base += " " + " ".join(f"{k}={v}" for k, v in fields.items())
        return base


def configure_logging(settings: Settings) -> None:
    """Install one handler on the root logger. Call once, before anything logs."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        _JsonFormatter()
        if not settings.is_development
        else _TextFormatter("%(asctime)s %(levelname)-8s [%(request_id)s] %(name)s: %(message)s")
    )

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.LOG_LEVEL.upper())

    # Uvicorn's own access log would print a second, unstructured line for every
    # request, with no request id. Ours replaces it.
    uvicorn_access = logging.getLogger("uvicorn.access")
    uvicorn_access.handlers = []
    uvicorn_access.propagate = False
    # Its error logger still carries useful startup and shutdown lines; route those
    # through our handler instead of letting uvicorn format them its own way.
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True


class RequestContextMiddleware:
    """Assigns a request id, emits the access log, sets `X-Request-ID`.

    Written as raw ASGI rather than `BaseHTTPMiddleware` on purpose: week 3 streams
    SSE, and `BaseHTTPMiddleware` sits between the app and the client in a way that
    interferes with long-lived streaming responses.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = self._incoming_id(scope) or uuid4().hex[:16]
        # Set and never reset. Uvicorn runs each request in its own asyncio task,
        # and a task copies the context at creation, so the value cannot bleed into
        # another request. Resetting it here would be worse than useless: Starlette's
        # ServerErrorMiddleware -- the thing that renders an unhandled 500 -- sits
        # OUTSIDE this middleware, so it runs after our `finally` and would find the
        # id already gone, which is exactly when the id matters most.
        _request_id.set(request_id)
        started = time.perf_counter()
        status = 500  # if the app raises before responding, that is what happened

        async def send_wrapper(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                MutableHeaders(scope=message).append(REQUEST_ID_HEADER, request_id)
            await send(message)

        # Scrubbed once, here, rather than trusted anywhere downstream.
        method = scrub(scope["method"], 16)
        path = scrub(scope["path"])

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            # In a `finally`, so a request that raises still produces an access line.
            access_logger.info(
                "%s %s -> %d",
                method, path, status,
                extra={"fields": {
                    "method": method,
                    "path": path,
                    "status": status,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                }},
            )

    @staticmethod
    def _incoming_id(scope: Scope) -> str | None:
        for key, value in scope.get("headers", ()):
            if key == b"x-request-id":
                candidate = value.decode("latin-1", "replace")
                # Reuse it only if it is safe to write into a log line; otherwise
                # generate our own rather than rejecting the request.
                return candidate if _SAFE_ID.match(candidate) else None
        return None
