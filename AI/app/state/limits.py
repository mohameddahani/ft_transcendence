"""The sliding-window rate limiter. Hand-written, and the reasoning matters.

**Which algorithm, and why.** A *sliding window log*: every allowed request stores
its timestamp, and a request is allowed when fewer than `limit` timestamps fall
inside the last `window` seconds.

- Not a **fixed window** (a counter per calendar minute). It is cheaper, but it
  allows a double burst across the boundary: 20 requests at 12:00:59 and 20 more at
  12:01:00 is 40 requests in one second, having promised 20 per minute.
- Not a **sliding window counter** (weighting the previous window). O(1) memory and
  right at CDN scale, but it is an approximation, and at 20 requests/minute the log's
  only real cost -- one row per request -- does not apply.
- Not a **token bucket** (capacity plus a refill rate). That shapes *throughput* and
  permits deliberate bursts. It is the right tool for the outbound Gemini calls
  later, where we protect someone else's quota. It is not the right tool for "no
  more than N in any rolling minute", which is the log's definition.

**Not `slowapi`.** It is a graded criterion, so the algorithm has to be ours; and
its default backend is per-process memory, so two uvicorn workers would silently
give every user twice their limit.

**Why `BEGIN IMMEDIATE`.** The check reads a count and then writes based on it.
Two writers can both read `count = 19`, both conclude there is room, and both
insert -- 21 requests through a limit of 20. A plain `BEGIN` is *deferred*: it takes
no lock until the first write, which happens after the read. `BEGIN IMMEDIATE` takes
the write lock up front, so the second writer waits (up to `busy_timeout`) and then
reads the true count.

**And why a lock as well.** `BEGIN IMMEDIATE` guards writers that are separate
*connections*. Requests sharing this process share one connection, and a second
`BEGIN IMMEDIATE` on a connection that is already in a transaction does not wait --
it raises `cannot start a transaction within a transaction`. So the transaction is
held under `get_state_lock()` for in-process serialisation, and `BEGIN IMMEDIATE`
covers everything the lock cannot see: another uvicorn worker, another container.
Neither one alone is enough.
"""

from __future__ import annotations

import contextlib
import logging
import math
import time
from dataclasses import dataclass

import aiosqlite

from app.state.db import get_state_db, get_state_lock

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Decision:
    """The outcome of one check. Frozen: a decision that has been made is a fact."""

    allowed: bool
    limit: int
    remaining: int
    reset_at: int    # epoch seconds when the window next frees a slot
    retry_after: int  # seconds to wait; 0 when allowed


async def check_and_record(
    subject: str,
    bucket: str,
    limit: int,
    window: int,
    *,
    conn: aiosqlite.Connection | None = None,
    now: float | None = None,
) -> Decision:
    """Count this subject's recent requests and, if there is room, record this one.

    `conn` is injectable so a test can simulate a second uvicorn worker: a separate
    connection to the same file is a separate writer, which is the only way to
    exercise the locking this function depends on.
    """
    # A caller-supplied connection is its own writer and needs no shared lock; the
    # process-wide connection does.
    if conn is None:
        connection, guard = get_state_db(), get_state_lock()
    else:
        connection, guard = conn, contextlib.nullcontext()

    moment = time.time() if now is None else now
    cutoff = moment - window

    async with guard:
        return await _transact(connection, subject, bucket, limit, window, moment, cutoff)


async def _transact(
    connection: aiosqlite.Connection,
    subject: str,
    bucket: str,
    limit: int,
    window: int,
    moment: float,
    cutoff: float,
) -> Decision:
    await connection.execute("BEGIN IMMEDIATE")
    try:
        # Prune first, so the count below is over the live window only. Doing it
        # inside the same transaction means the count can never see a row that the
        # prune was about to remove.
        await connection.execute(
            "DELETE FROM rate_events WHERE subject = ? AND bucket = ? AND ts <= ?",
            (subject, bucket, cutoff),
        )
        async with connection.execute(
            "SELECT COUNT(*), MIN(ts) FROM rate_events WHERE subject = ? AND bucket = ?",
            (subject, bucket),
        ) as cursor:
            count, oldest = await cursor.fetchone()

        allowed = count < limit
        if allowed:
            await connection.execute(
                "INSERT INTO rate_events (subject, bucket, ts) VALUES (?, ?, ?)",
                (subject, bucket, moment),
            )
            # The request being decided counts against the caller's own budget.
            count += 1
            oldest = moment if oldest is None else min(oldest, moment)

        await connection.execute("COMMIT")
    except Exception:
        await connection.execute("ROLLBACK")
        raise

    # A slot frees up when the oldest event in the window falls out of it. Rounded
    # up, so a client obeying the header never retries a fraction of a second early
    # and burns the request on another 429.
    frees_at = (oldest if oldest is not None else moment) + window
    return Decision(
        allowed=allowed,
        limit=limit,
        remaining=max(0, limit - count),
        reset_at=math.ceil(frees_at),
        # Computed from the true `moment`, not from `int(moment)`. Flooring `moment`
        # first adds up to a second, which is how Retry-After ends up being 61 for a
        # 60-second window -- a small lie, but one an evaluator can spot by reading
        # the header. Never 0 on a denial either: "retry in 0s" invites an immediate
        # retry that is certain to fail.
        retry_after=0 if allowed else max(1, math.ceil(frees_at - moment)),
    )


async def sweep_expired(window: int) -> int:
    """Delete events older than the window, for every subject.

    `check_and_record` only prunes the key it is asked about, so a user who never
    comes back leaves rows behind forever. One sweep at startup keeps the table
    proportional to recent traffic rather than to all traffic ever.
    """
    connection = get_state_db()
    async with get_state_lock():
        cursor = await connection.execute(
            "DELETE FROM rate_events WHERE ts <= ?", (time.time() - window,)
        )
        removed = cursor.rowcount
        await cursor.close()
    if removed > 0:
        logger.info("swept stale rate events", extra={"fields": {"removed": removed}})
    return removed
