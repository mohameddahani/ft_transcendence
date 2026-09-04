"""The only place in the service that opens a connection to Dahani's Postgres.

Three rules this module exists to enforce:

1. **Read-only.** The engine connects as `ai_readonly` and opens every transaction
   `READ ONLY`. The database refuses writes; this makes the intent explicit and the
   error message readable when someone tries anyway.
2. **Bound parameters only.** `fetch_all` takes a params dict and passes it to
   SQLAlchemy's `text()`. No caller ever interpolates a value into SQL.
3. **One engine, one pool.** Created in the app lifespan, disposed on shutdown.
   Never at import time -- importing this module must not require a database.

`_fetch_all` and `_fetch_one` are private. `app/db/scope.py` is their only caller,
which is what makes tenant scoping unbypassable: there is no public function here
that runs SQL, so nothing outside `app/db/` can build a query without a `Scope`.
scripts/check_db_layer.py reaches past the underscore on purpose -- it exists to
test this layer in isolation.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Mapping
from typing import Any, Final

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.config import Settings

logger = logging.getLogger(__name__)

_engine: AsyncEngine | None = None

# A statement reaching this layer must be a read. The role already denies writes,
# but failing here gives a clear error naming the offending caller instead of an
# opaque "permission denied for table X" from Postgres.
_READ_PREFIXES: Final = ("select", "with")


class DatabaseNotReady(RuntimeError):
    """Raised when the engine is used before startup or after shutdown."""


async def init_engine(settings: Settings) -> AsyncEngine:
    """Create the pool and prove the credentials work.

    Raises on failure so the process dies at boot. A service that starts without a
    database only fails later, in front of whoever is watching the demo.
    """
    global _engine
    if _engine is not None:
        return _engine

    engine = create_async_engine(
        settings.AI_DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        # A connection idle in the pool can be dropped by Postgres or by Docker
        # restarting the container. Without pre-ping the pool hands out a dead
        # socket and a perfectly good query fails for no visible reason.
        pool_pre_ping=True,
        # Recycle before Postgres' own idle timeouts get a chance to bite.
        pool_recycle=1800,
        echo=False,
        # Every transaction is READ ONLY at the session level -- belt to the
        # database role's braces.
        execution_options={"postgresql_readonly": True},
        connect_args={
            "timeout": settings.DB_CONNECT_TIMEOUT_SECONDS,
            "server_settings": {"application_name": "gym_ai"},
        },
    )

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        await engine.dispose()
        raise

    _engine = engine
    logger.info(
        "database pool ready (size=%d, overflow=%d)",
        settings.DB_POOL_SIZE,
        settings.DB_MAX_OVERFLOW,
    )
    return _engine


async def dispose_engine() -> None:
    """Close every pooled connection. Idempotent."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        logger.info("database pool disposed")


def get_engine() -> AsyncEngine:
    if _engine is None:
        raise DatabaseNotReady(
            "engine not initialised -- init_engine() runs in the app lifespan"
        )
    return _engine


def _assert_read_only(sql: str) -> None:
    stripped = sql.lstrip().lower()
    if not stripped.startswith(_READ_PREFIXES):
        raise ValueError(
            "app.db.engine executes reads only; statement started with "
            f"{stripped.split(' ', 1)[0]!r}"
        )


async def _fetch_all(sql: str, params: Mapping[str, Any] | None = None) -> list[dict[str, Any]]:
    """Run a SELECT and return rows as plain dicts. Private: see the module docstring.

    `params` are bound by the driver (`:name` placeholders), never formatted into
    the string. Callers name their columns explicitly -- `SELECT *` is refused by
    the `ai_readonly` role anyway, since `members` and `users` carry column-level
    grants that deliberately exclude `password`.
    """
    _assert_read_only(sql)
    engine = get_engine()
    async with engine.connect() as conn:
        result = await conn.execute(text(sql), dict(params or {}))
        return [dict(row) for row in result.mappings()]


async def _fetch_one(sql: str, params: Mapping[str, Any] | None = None) -> dict[str, Any] | None:
    """Run a SELECT and return the first row, or None."""
    _assert_read_only(sql)
    engine = get_engine()
    async with engine.connect() as conn:
        result = await conn.execute(text(sql), dict(params or {}))
        row = result.mappings().first()
        return dict(row) if row is not None else None


async def ping(timeout: float) -> bool:
    """Liveness probe for /health. Never raises; never hangs past `timeout`."""
    try:
        async with asyncio.timeout(timeout):
            engine = get_engine()
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        return True
    except (SQLAlchemyError, DatabaseNotReady, TimeoutError, OSError) as exc:
        # Logged in full here; the caller reports only "down" so a probe response
        # never leaks a hostname, a username, or a stack trace.
        logger.warning("database ping failed: %s: %s", type(exc).__name__, exc)
        return False
