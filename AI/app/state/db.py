"""The AI service's own SQLite database. Our state, not Dahani's.

The read-only guardrail is about *his* Postgres. This file is ours and is written
to freely: rate-limit events (task 0.7), LangGraph checkpoints (2.4) and document
metadata (3.x) all live here. Keeping them out of his schema means the two services
can be migrated, reset and backed up independently, and it keeps the AI service's
Postgres role exactly as narrow as guardrail #1 says.

It lives on the `ai_state` volume at `/data`, created in the Dockerfile and owned by
`appuser` -- a named volume is root-owned otherwise, and SQLite would fail to open.

**One shared connection, guarded by a lock.** `aiosqlite` serialises *statements* on
one dedicated thread per connection -- but not *transactions*, which span several
statements. Two concurrent requests issuing `BEGIN IMMEDIATE` on the same connection
get `cannot start a transaction within a transaction`, because the connection is
already inside one. So a multi-statement transaction takes `get_state_lock()` first.

That lock is the in-process half. `BEGIN IMMEDIATE` in `limits.py` is the other half:
it protects against writers the lock cannot see -- a second uvicorn worker, or a
second container on the same volume. Both are needed, and they solve different
problems.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Final

import aiosqlite

from app.config import Settings

logger = logging.getLogger(__name__)

_conn: aiosqlite.Connection | None = None
_lock: asyncio.Lock | None = None

_PRAGMAS: Final = (
    # Readers never block the writer and vice versa. The default rollback journal
    # takes an exclusive lock for the whole write.
    "PRAGMA journal_mode = WAL",
    # Fewer fsyncs. The trade is explicit: a power loss can lose the last few
    # seconds of writes. These are rate-limit counters and chat checkpoints, not
    # money -- losing a second of them is cheaper than an fsync per request.
    "PRAGMA synchronous = NORMAL",
    # When another writer holds the lock, wait up to 3s instead of raising
    # SQLITE_BUSY immediately. This is what makes BEGIN IMMEDIATE usable.
    "PRAGMA busy_timeout = 3000",
    # SQLite ignores foreign keys unless asked; nothing here needs them yet, but a
    # later table that does should not silently not have them.
    "PRAGMA foreign_keys = ON",
)

_SCHEMA: Final = (
    # One row per request that was allowed. A sliding window is defined over these
    # timestamps: a request is allowed when fewer than `limit` rows for this
    # (subject, bucket) fall inside the last `window` seconds.
    """
    CREATE TABLE IF NOT EXISTS rate_events (
        subject TEXT NOT NULL,
        bucket  TEXT NOT NULL,
        ts      REAL NOT NULL
    )
    """,
    # Without this, every check scans the whole table -- including every other
    # user's events. With it, a check touches only one user's slice.
    """
    CREATE INDEX IF NOT EXISTS idx_rate_events_key
        ON rate_events (subject, bucket, ts)
    """,
)


class StateNotReady(RuntimeError):
    """The state database was used before startup or after shutdown."""


async def init_state_db(settings: Settings) -> aiosqlite.Connection:
    """Open the connection, apply pragmas, create the schema. Idempotent."""
    global _conn, _lock
    if _conn is not None:
        return _conn

    # isolation_level=None turns OFF the driver's implicit transaction handling, so
    # `BEGIN IMMEDIATE` in limits.py means what it says. Left at the default, the
    # driver would open its own deferred transaction first and the IMMEDIATE would
    # be a no-op inside it -- the lock would not be taken until the first write,
    # which is exactly the race it exists to prevent.
    conn = await aiosqlite.connect(settings.SQLITE_PATH, isolation_level=None)
    try:
        for pragma in _PRAGMAS:
            await conn.execute(pragma)
        for statement in _SCHEMA:
            await conn.execute(statement)
        async with conn.execute("PRAGMA journal_mode") as cursor:
            journal = (await cursor.fetchone())[0]
    except Exception:
        await conn.close()
        raise

    _conn = conn
    # Created here, not at import: an asyncio.Lock must be built inside the running
    # loop it will be used in.
    _lock = asyncio.Lock()
    logger.info("state database ready", extra={"fields": {
        "path": settings.SQLITE_PATH, "journal_mode": journal}})
    return _conn


async def close_state_db() -> None:
    """Close the connection. Idempotent."""
    global _conn, _lock
    if _conn is not None:
        await _conn.close()
        _conn = None
        _lock = None
        logger.info("state database closed")


def get_state_db() -> aiosqlite.Connection:
    if _conn is None:
        raise StateNotReady("state database not initialised -- init_state_db() runs in the lifespan")
    return _conn


def get_state_lock() -> asyncio.Lock:
    """Hold this around any multi-statement transaction on the shared connection."""
    if _lock is None:
        raise StateNotReady("state database not initialised -- init_state_db() runs in the lifespan")
    return _lock
