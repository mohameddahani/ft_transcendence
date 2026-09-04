"""The error taxonomy from AI_SPECS 3.6, and the handlers that guarantee it.

```json
{ "error": { "code": "unauthorized", "message": "Missing bearer token." } }
```

Every error leaves this service in that shape -- including the ones nobody wrote
code for. A `KeyError` in a tool, a 404 from the router, a malformed request body:
all of them are caught here and rendered the same way. The alternative is a client
that must parse three different error formats and a 500 that ships a stack trace.

Two rules the handlers exist to enforce:

**`message` is for a person, never for an attacker.** No exception text, no file
paths, no hostname, no hint about which of several checks failed. The detail goes to
the log, tagged with the request id, and the 500's message carries that id so the
report and the log line can be matched up.

**Validation errors do not echo values.** Pydantic's own rendering includes
`input_value=`, which for a request body means copying user content -- possibly a
password someone posted to the wrong endpoint -- into the HTTP response. Only field
names and messages come out. (`app/config.py` does the same for boot errors.)
"""

from __future__ import annotations

import logging
from typing import Any, Final

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import REQUEST_ID_HEADER, get_request_id

logger = logging.getLogger(__name__)

# AI_SPECS 3.6. Anything not listed falls back by class: 4xx is the caller's
# problem (`invalid_request`), 5xx is ours (`internal_error`).
_CODE_BY_STATUS: Final[dict[int, str]] = {
    400: "invalid_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    413: "payload_too_large",
    429: "rate_limited",
    502: "upstream_error",
}


def _code_for(status: int) -> str:
    return _CODE_BY_STATUS.get(status, "invalid_request" if status < 500 else "internal_error")


def envelope(code: str, message: str) -> dict[str, Any]:
    return {"error": {"code": code, "message": message}}


class ApiError(HTTPException):
    """Raise this anywhere. `detail` is already the response body."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=envelope(code, message), headers=headers)


def unauthorized(message: str = "Authentication required.") -> ApiError:
    # RFC 6750: a 401 on a bearer-protected resource carries this header, and clients
    # use it to tell "log in" apart from "you may not".
    return ApiError(401, "unauthorized", message, headers={"WWW-Authenticate": "Bearer"})


def forbidden(message: str = "This account may not use that endpoint.") -> ApiError:
    return ApiError(403, "forbidden", message)


async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
    """FastAPI's default would wrap `detail` again as `{"detail": {"error": ...}}`."""
    return JSONResponse(status_code=exc.status_code, content=exc.detail, headers=exc.headers)


async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Everything Starlette raises on its own: 404 from the router, 405, and any
    plain `HTTPException` raised by code that has not been converted to `ApiError`."""
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail, headers=exc.headers)
    message = detail if isinstance(detail, str) and detail else "Request could not be completed."
    return JSONResponse(
        status_code=exc.status_code,
        content=envelope(_code_for(exc.status_code), message),
        headers=exc.headers,
    )


# FastAPI prefixes a validation `loc` with the part of the request it came from.
# Stripping it makes the message read "message: too long" rather than
# "body.message: too long" -- but only when the first segment really is one of these,
# never by position, or a single-segment loc would be swallowed entirely.
_REQUEST_PARTS: Final = frozenset({"body", "query", "path", "header", "cookie"})


def summarise_validation(exc: RequestValidationError) -> str:
    """Field names and messages only. Never `input`."""
    parts = []
    for error in exc.errors():
        loc = list(error["loc"])
        if loc and loc[0] in _REQUEST_PARTS:
            loc = loc[1:]
        location = ".".join(str(segment) for segment in loc) or "request"
        parts.append(f"{location}: {error['msg']}")
    return "; ".join(parts) or "Request body failed validation."


async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=400, content=envelope("invalid_request",
                                                          summarise_validation(exc)))


async def unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
    """The last line. Anything that reaches here is a bug in this service.

    The traceback goes to the log with the request id; the client gets that id and
    nothing else. A stack trace in an HTTP response names our files, our libraries
    and our versions -- a free map for anyone looking for a way in.
    """
    request_id = get_request_id()
    logger.exception(
        "unhandled error on %s %s", request.method, request.url.path,
        extra={"fields": {"path": request.url.path, "error_type": type(exc).__name__}},
    )
    return JSONResponse(
        status_code=500,
        content=envelope(
            "internal_error",
            f"Something went wrong on our side. Reference: {request_id}",
        ),
        # Set explicitly here, unlike every other response. Starlette renders an
        # unhandled 500 in ServerErrorMiddleware, which sits OUTSIDE our middleware
        # and writes straight to the transport -- so the header our middleware adds
        # never gets attached to this one response, the one where it matters most.
        headers={REQUEST_ID_HEADER: request_id},
    )


def install(app: Any) -> None:
    """Register every handler. Order does not matter; specificity does."""
    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_handler)
    app.add_exception_handler(Exception, unhandled_handler)
