"""FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.api import ai as ai_routes
from app.api import internal as internal_routes
from app.config import Settings, get_settings
from app.core import errors
from app.core.logging import RequestContextMiddleware, configure_logging
from app.db import engine as db
from app.db.schema import verify_schema

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
        yield
    finally:
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
