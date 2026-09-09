"""`/ai/*` — the surface the browser talks to, authenticated with Dahani's JWT.

Two endpoints so far. `/ai/me` is the identity probe and the end-to-end proof that
the D5 chain works -- token -> signature -> tenant lookup -> `Scope` -> a scoped
query. `/ai/chat` (task 2.3) is the streaming one, and everything awkward about this
module comes from one fact: **by the time the agent can fail, the response is already
`200 text/event-stream`.** There is no status code left to send, so a failure has to
travel as an `error` event, and the frontend must read errors out of the stream
rather than only off the status line (AI_SPECS 3.2).

Everything that *can* fail before the stream opens does: authentication, the rate
limit, and request validation all run as dependencies, so a 401, a 429 or a 400 is
still an ordinary JSON envelope with the right status.

`/ai/documents` arrives in phase 3.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from typing import Final
from uuid import UUID, uuid4

from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.agents.graph import AgentEvent, stream_turn
from app.auth.dependencies import CurrentUser
from app.config import get_settings
from app.core.errors import ApiError, unauthorized
from app.core.ratelimit import ChatRateLimited, DocsRateLimited, carry_rate_headers
from app.db import scope as sc
from app.db.models import Role
from app.db.scope import Scope, ScopeViolation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

# Read once at import, like every other setting: `max_length` has to be a constant on
# the field, and a value that can drift between the schema and the check is a value
# that will.
_MAX_MESSAGE_CHARS: Final[int] = get_settings().MAX_MESSAGE_CHARS

_SSE_HEADERS: Final[dict[str, str]] = {
    # A proxy that caches an event stream serves the first user's answer to the
    # second one.
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    # nginx buffers proxied responses by default, which turns a token-by-token
    # stream into one silent pause followed by the whole answer. It is off by
    # default in this project's compose file only because there is no nginx yet.
    "X-Accel-Buffering": "no",
}


class Identity(BaseModel):
    role: Role
    gym: str
    # Present only for a member token. An admin has no member identity, and saying
    # so with `null` is clearer than omitting the field.
    member_name: str | None = None


async def _gym_name(scope: Scope) -> str:
    """The caller's own gym, read through the scope like everything else.

    The tenant rule (`id = :admin_id`) means this returns exactly one row whether the
    caller is the admin or one of its members. The account was confirmed a moment ago
    in `require_auth`, but it can be deleted between that lookup and this one; answer
    401 rather than letting an IndexError become a 500 with a stack trace in it.

    Task 2.5 replaces this with a fuller profile. Until then it is one extra round
    trip on a request that is about to spend several seconds talking to Gemini.
    """
    rows = await sc.select_models(scope, "users")
    if not rows:
        raise unauthorized("Invalid or expired token.")
    return rows[0].company_name


@router.get("/me", response_model=Identity)
async def me(ctx: CurrentUser) -> Identity:
    """Who the caller is, answered entirely through `scope.py`.

    Note what is NOT in the response: no ids. The frontend never needs `admin_id`,
    and echoing a tenant key back into a browser is how it ends up in a query string,
    a log, or a bug report.
    """
    gym_name = await _gym_name(ctx.scope)

    member_name = None
    if ctx.role is Role.MEMBER:
        # Under a member scope this table is narrowed to `id = :member_id`, so the
        # only row it can return is the caller's own.
        mine = await sc.select_models(ctx.scope, "members")
        if not mine:
            raise unauthorized("Invalid or expired token.")
        member_name = mine[0].full_name

    return Identity(role=ctx.role, gym=gym_name, member_name=member_name)


class ChatRequest(BaseModel):
    """AI_SPECS 3.2's request body, validated before a single token is paid for.

    `extra="forbid"` so `{"messsage": ...}` is a 400 the caller can see rather than a
    silently ignored field and a confusing "message must not be empty".
    """

    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=_MAX_MESSAGE_CHARS)
    # Omitted on the first message; the server makes one and returns it in `meta`.
    thread_id: str | None = None

    @field_validator("message")
    @classmethod
    def _trimmed_and_not_blank(cls, value: str) -> str:
        # `min_length` runs before this, so it accepts "   ". The spec says trimmed
        # and non-empty, and both halves have to be checked or neither is.
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("must not be blank")
        return trimmed

    @field_validator("thread_id")
    @classmethod
    def _canonical_uuid(cls, value: str | None) -> str | None:
        """A thread id is client-supplied, and it is echoed into `meta` and into a
        log line. Anything that reaches both of those places has to be a shape, not a
        string: parsing it as a UUID and re-rendering it is what stops a caller
        choosing what our logs say.
        """
        if value is None:
            return None
        try:
            return str(UUID(value))
        except ValueError as exc:
            raise ValueError("must be a UUID") from exc


def _sse(event: AgentEvent) -> bytes:
    """One event, in the wire format.

    `json.dumps` escapes newlines, so the payload can never contain a bare `\n` and
    a user's message cannot break out of its `data:` line to forge an event of its
    own. That is the whole reason the data is JSON rather than raw text.
    """
    return f"event: {event.type}\ndata: {json.dumps(event.data, ensure_ascii=False)}\n\n".encode()


_STREAM_FAILED = AgentEvent("error", {
    "code": "internal_error",
    "message": "The assistant stopped unexpectedly. Please try again.",
})


@router.post("/chat")
async def chat(body: ChatRequest, ctx: ChatRateLimited,
               sub_response: Response) -> StreamingResponse:
    """Stream one answer as `text/event-stream` (AI_SPECS 3.2).

    Note what has already happened before the first byte: the token was verified, the
    tenant resolved, the rate limit spent, and the body validated. Those are the
    failures a client can still read as a status code, so they are the ones that must
    not be deferred into the stream.

    `thread_id` is generated and returned, but nothing is remembered between turns
    yet -- the checkpointer is task 2.4. Returning it now means the frontend is
    written against the final protocol and gains memory without a change.
    """
    gym_name = await _gym_name(ctx.scope)
    thread_id = body.thread_id or str(uuid4())

    async def events() -> AsyncIterator[bytes]:
        try:
            async for event in stream_turn(scope=ctx.scope, gym_name=gym_name,
                                           question=body.message, thread_id=thread_id):
                yield _sse(event)
        except ApiError as exc:
            # Raised before the loop opens -- there is no status code left to use.
            yield _sse(AgentEvent("error", dict(exc.detail["error"])))
        except asyncio.CancelledError:
            # The browser closed the tab. Not an error, and re-raising is what lets
            # the server actually tear the request down.
            logger.info("chat stream cancelled by the client")
            raise
        except ScopeViolation:
            # A tool read outside its tenant. `stream_turn` deliberately does not
            # catch this, and neither does the tool decorator: it is a bug, and the
            # loudest signal this system has. Reporting it to the caller as a generic
            # internal error is not the same as muting it -- `logger.exception` puts
            # the traceback and the request id in the log, and the answer stops here.
            logger.exception("SCOPE VIOLATION in a chat stream")
            yield _sse(_STREAM_FAILED)
        except Exception:  # noqa: BLE001 -- the stream must close cleanly regardless
            logger.exception("chat stream failed")
            yield _sse(_STREAM_FAILED)

    stream = StreamingResponse(events(), media_type="text/event-stream", headers=_SSE_HEADERS)
    # FastAPI injects one `Response` per request and shares it with the dependencies,
    # so this is the same object the rate limiter wrote its headers onto.
    carry_rate_headers(sub_response, stream)
    return stream


# `/ai/chat` now takes the chat bucket, and these probes stay anyway. They are how
# the limiter is tested: check_ratelimit.py fires forty parallel requests and then
# restarts the container, and pointing that at /ai/chat would make the suite spend
# money, depend on the network, and take a minute. The probes share the bucket with
# /ai/chat rather than shadowing it -- check_chat.py exhausts the budget through the
# probe and then asserts that /ai/chat answers 429 without ever reaching Gemini,
# which is what proves the wiring. Development only; the docs probe goes when
# /ai/documents lands.
if get_settings().is_development:

    @router.get("/rate-probe", include_in_schema=False)
    async def rate_probe(ctx: ChatRateLimited) -> dict[str, str]:
        return {"bucket": "chat", "subject": ctx.subject}

    @router.get("/rate-probe-docs", include_in_schema=False)
    async def rate_probe_docs(ctx: DocsRateLimited) -> dict[str, str]:
        return {"bucket": "docs", "subject": ctx.subject}
