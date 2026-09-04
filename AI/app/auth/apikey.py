"""API-key auth for `/internal/*` — Dahani's backend calling this service.

Server to server, so no JWT: there is no user here, only a trusted caller. The key
lives in both `.env` files and never reaches a browser.

**Why the comparison is not `==`.** Python's string equality returns as soon as two
characters differ, so a wrong key that shares a longer prefix with the real one takes
measurably longer to reject. Repeat that a few thousand times per position and the
key can be recovered one character at a time, without ever guessing it whole. That is
a real attack, not a theoretical one, and the fix is one function.

`compare_digest` alone would still leak the key's *length*, because it compares
different-length inputs quickly. Hashing both sides first makes every comparison
exactly 32 bytes wide, so length tells an attacker nothing either.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Annotated, Final

from fastapi import Depends, Request
from fastapi.security import APIKeyHeader

from app.config import Settings, get_settings
from app.core.errors import unauthorized

logger = logging.getLogger(__name__)

API_KEY_HEADER: Final = "X-API-Key"

# auto_error=False so a missing header lands in our handler and gets the documented
# envelope, rather than FastAPI's `{"detail": "Not authenticated"}`.
_header = APIKeyHeader(name=API_KEY_HEADER, auto_error=False)


def keys_match(presented: str, expected: str) -> bool:
    """Constant-time, and constant-width regardless of the inputs' lengths."""
    return hmac.compare_digest(
        hashlib.sha256(presented.encode()).digest(),
        hashlib.sha256(expected.encode()).digest(),
    )


async def require_internal_key(
    request: Request,
    presented: Annotated[str | None, Depends(_header)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    """Guard for every `/internal/*` route. Returns nothing: there is no caller
    identity to hand downstream, only permission to proceed."""
    if not presented or not keys_match(presented, settings.INTERNAL_API_KEY.get_secret_value()):
        # Never log the presented value: a near-miss key in a log file is most of a
        # working key, and log files travel further than secrets stores do.
        logger.warning(
            "rejected internal call to %s", request.url.path,
            extra={"fields": {"key_present": bool(presented)}},
        )
        # 401, not 403: the caller failed to authenticate. And the same answer for
        # "no header" as for "wrong key", so probing tells them nothing.
        raise unauthorized("Invalid or missing API key.")


InternalCaller = Annotated[None, Depends(require_internal_key)]
