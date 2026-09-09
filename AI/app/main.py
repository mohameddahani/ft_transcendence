"""FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.api import ai as ai_routes
from app.api import internal as internal_routes
from app.config import Settings, get_settings
from app.core import errors
from app.core.logging import RequestContextMiddleware, configure_logging
from app.db import engine as db
from app.db.schema import verify_schema
from app.state import db as state_db
from app.state.limits import sweep_expired
from app.state.threads import sweep_expired_threads

# Read and validate configuration at import time. A missing or malformed setting
# now kills the process during startup with a readable pydantic error, instead of
# booting a container that reports itself healthy and 500s on its first request.
settings = get_settings()

# JSON lines in production, readable text in development. Installed before anything
# else so no module gets to log through a default handler first.
configure_logging(settings)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Connect once, here, rather than lazily on first query: if the credentials
    # are wrong or the database is unreachable, the service must fail to start.
    await db.init_engine(settings)
    # Guardrail #5. Dahani keeps migrating this database; if a column this service
    # depends on has moved, refuse to start now rather than crash inside a tool
    # call later. Running as `ai_readonly` means a missing GRANT fails here too.
    try:
        await verify_schema()
        await state_db.init_state_db(settings)
        # check_and_record only prunes the key it is asked about, so a subject that
        # never returns leaves rows behind. One sweep at boot keeps the table
        # proportional to recent traffic rather than to all traffic ever.
        await sweep_expired(settings.RATE_LIMIT_WINDOW_SECONDS)
        # A thread and its messages go together: an orphaned transcript is a whole
        # conversation nothing can reach and nothing will ever delete.
        await sweep_expired_threads(settings.THREAD_TTL_DAYS)
        yield
    finally:
        await state_db.close_state_db()
        # Also runs when verify_schema raises, so a schema mismatch does not leave
        # a pool of open connections behind on the way out.
        await db.dispose_engine()


app = FastAPI(
    title="ft_transcendence AI Microservice",
    version=settings.VERSION,
    lifespan=lifespan,
    # The schema describes every route, including the admin/member split. That is
    # a map of the attack surface, so it is a development-only convenience.
    docs_url="/docs" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    redoc_url=None,
)


# Middleware first: the request id has to exist before a handler can put it in a
# 500's message.
app.add_middleware(RequestContextMiddleware)

# CORS is added *after*, and that ordering is the point: Starlette inserts each new
# middleware at the front, so the last one added is the outermost. CORS has to wrap
# everything below it, because a 401 or a 429 without CORS headers reaches the
# browser as "CORS error" -- the frontend never sees the status it needs to act on,
# and the developer chases the wrong bug.
app.add_middleware(
    CORSMiddleware,
    # Never `*`. `allow_origins=["*"]` would let any page that can obtain a token
    # spend it against this service from a user's browser.
    allow_origins=settings.cors_origins,
    # False on purpose. This service authenticates with a bearer header and sets no
    # cookie, so it never needs the browser to attach credentials -- and leaving it
    # off means a cross-origin page cannot ride an existing session even if Dahani
    # later issues one for his own domain.
    allow_credentials=False,
    # The methods and headers that actually exist, not a wildcard. DELETE is here
    # for /ai/documents in phase 3; adding it now costs nothing and a preflight that
    # fails in week 4 costs an afternoon.
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    # Without this the browser hands JavaScript only the CORS-safelisted headers,
    # and `fetch` sees no `Retry-After` and no `X-RateLimit-*` at all. AI_SPECS 3.7
    # requires the frontend to show the retry time, and 6 requires a `rate_limited`
    # state -- neither is reachable unless these are exposed.
    expose_headers=["X-Request-ID", "Retry-After",
                    "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    max_age=600,
)
errors.install(app)
app.include_router(ai_routes.router)
app.include_router(internal_routes.router)


class Health(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    environment: str
    db: Literal["up", "down"]


@app.get("/health", response_model=Health)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> JSONResponse:
    """Readiness, not just liveness.

    This service cannot answer a single question without Postgres, so reporting
    200 while the database is unreachable would be a lie that hides the outage
    from anything watching. Returns 503 in that case -- but the process stays up
    and recovers on its own once the database returns.
    """
    db_up = await db.ping(settings.DB_HEALTH_TIMEOUT_SECONDS)
    body = Health(
        status="ok" if db_up else "degraded",
        version=settings.VERSION,
        environment=settings.APP_ENV,
        db="up" if db_up else "down",
    )
    # No exception detail in the response: a probe is unauthenticated, so it never
    # gets a hostname, a username, or a stack trace. That went to the log.
    return JSONResponse(content=body.model_dump(), status_code=200 if db_up else 503)
