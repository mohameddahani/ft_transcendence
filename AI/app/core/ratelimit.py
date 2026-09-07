"""The FastAPI side of the rate limiter: one dependency per bucket.

The algorithm and its justification live in `app/state/limits.py`. This module is
about wiring: which limit applies where, and getting the headers onto the response.

**Keyed on the JWT subject.** Not the IP -- behind nginx every member of a gym
shares one address, so an IP key would throttle a whole gym as if it were one
person. Not the thread id either: opening a new conversation would hand the caller a
fresh budget, which is the opposite of a limit.

**Unauthenticated requests are not limited here, and that is deliberate.** The
dependency resolves `CurrentUser` first, so a request without a valid token is
already a 401 before this code runs. There is nothing to key on, and writing a row
per anonymous request would turn the limiter into its own denial-of-service target.
Flooding with bad tokens is a job for nginx, at the IP level, one layer out.

**`/internal/*` is exempt** (AI_SPECS 3.7): Dahani's backend calls it once per
feedback submission, and throttling it would drop his data on the floor.
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from typing import Annotated, Final

from fastapi import Depends, Response

from app.auth.dependencies import AuthContext, CurrentUser
from app.config import Settings, get_settings
from app.core.errors import ApiError
from app.state.limits import Decision, check_and_record

logger = logging.getLogger(__name__)

# Bucket -> the setting that limits it. A bucket not listed here is a typo, and the
# factory raises at import time rather than silently applying some default.
_LIMIT_SETTING: Final[dict[str, str]] = {
    "chat": "RATE_LIMIT_CHAT_PER_MIN",
    "docs": "RATE_LIMIT_DOCS_PER_MIN",
}


def _headers(decision: Decision) -> dict[str, str]:
    return {
        "X-RateLimit-Limit": str(decision.limit),
        "X-RateLimit-Remaining": str(decision.remaining),
        "X-RateLimit-Reset": str(decision.reset_at),
    }


def rate_limit(bucket: str) -> Callable[..., Awaitable[AuthContext]]:
    """Build the dependency for one bucket.

    Returns the `AuthContext` so a route can use this as its only auth dependency:
    `ctx: Annotated[AuthContext, Depends(rate_limit("chat"))]`. A route that also
    declares `CurrentUser` still verifies the token once -- FastAPI caches a
    dependency's result within a request.
    """
    if bucket not in _LIMIT_SETTING:
        raise ValueError(f"unknown rate-limit bucket {bucket!r}; known: {sorted(_LIMIT_SETTING)}")

    async def dependency(
        response: Response,
        ctx: CurrentUser,
        settings: Annotated[Settings, Depends(get_settings)],
    ) -> AuthContext:
        limit = getattr(settings, _LIMIT_SETTING[bucket])
        decision = await check_and_record(
            ctx.subject, bucket, limit, settings.RATE_LIMIT_WINDOW_SECONDS
        )

        if not decision.allowed:
            logger.info(
                "rate limit hit", extra={"fields": {"bucket": bucket, "limit": limit}}
            )
            # The headers go on the error too: a client that is being throttled needs
            # the reset time more than one that is not.
            raise ApiError(
                429,
                "rate_limited",
                f"Too many requests. Try again in {decision.retry_after}s.",
                headers={**_headers(decision), "Retry-After": str(decision.retry_after)},
            )

        # FastAPI merges headers set on the injected Response onto whatever the
        # endpoint returns -- including a Response the endpoint builds itself.
        response.headers.update(_headers(decision))
        return ctx

    return dependency


ChatRateLimited = Annotated[AuthContext, Depends(rate_limit("chat"))]
DocsRateLimited = Annotated[AuthContext, Depends(rate_limit("docs"))]
