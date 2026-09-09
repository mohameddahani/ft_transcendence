"""Conversations: who they belong to, and what they remember (task 2.4).

The LangGraph checkpointer stores a conversation under a `thread_id` and has no
concept of an owner: hand it an id and it hands back whatever is in it. The id
arrives from the client. Those two facts together are a cross-user read -- somebody
else's chat about their own gym, their own members, their own revenue -- and the only
thing standing between them is this module.

**Ownership is checked on every resume, against the verified JWT subject.** A thread
that is not the caller's answers exactly the same way as one that does not exist:
`404 not_found`. Not 403 -- a 403 would confirm that the id belongs to *somebody*,
which is the one bit an attacker enumerating ids actually wants.

Threads expire (`THREAD_TTL_DAYS`). A conversation is a cache of context, not a
record: the gym's data lives in Dahani's Postgres, and nothing here is the only copy
of anything.

**Memory is a table this service writes itself, not a LangGraph checkpointer.** The
official `langgraph-checkpoint-sqlite 2.0.10` does not work against the
`langgraph-checkpoint 4.2` that `langgraph 1.2` ships: every super-step ends in
`AttributeError: 'JsonPlusSerializer' object has no attribute 'dumps'`
(`langgraph/checkpoint/sqlite/aio.py:505`), so `writes` rows accumulate and a
checkpoint is never written. Reproduced on an empty temporary database, so it is the
library pairing and not this schema. Writing the transcript
directly costs one table and removes a dependency that does not work; it also answers
"what does the assistant remember about me?" with a `SELECT` instead of with msgpack,
which is the whole point of the day. Nothing here needs step-level resumability: the
graph has no interrupts and no human-in-the-loop.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
import warnings

from langchain_core.load import dumpd, load
from langchain_core.messages import BaseMessage

from app.state.db import get_state_db, get_state_lock

logger = logging.getLogger(__name__)


class ThreadNotFound(LookupError):
    """No such thread, or not this caller's. Deliberately the same exception."""


def new_thread_id() -> str:
    return str(uuid.uuid4())


async def open_thread(
    *,
    thread_id: str | None,
    subject_id: str,
    role: str,
    admin_id: str,
) -> tuple[str, bool]:
    """Resolve the thread for this turn. Returns `(thread_id, is_new)`.

    With no `thread_id` a new conversation is created and owned by `subject_id`.
    With one, ownership is verified before the caller is allowed anywhere near the
    checkpoint -- and `ThreadNotFound` is raised for a thread that is missing, that
    belongs to someone else, or that was created under a different role.

    The role check is not redundant with ownership. A subject is a row id, and the
    admin and member tables are different tables: nothing guarantees the two id
    spaces never collide, and a thread carrying an owner's tool history must not be
    resumable by a member even in the case where they somehow do.
    """
    now = time.time()
    connection, guard = get_state_db(), get_state_lock()

    async with guard:
        if thread_id is None:
            fresh = new_thread_id()
            await connection.execute(
                "INSERT INTO threads (id, subject_id, role, admin_id, created_at,"
                " last_used_at) VALUES (?, ?, ?, ?, ?, ?)",
                (fresh, subject_id, role, admin_id, now, now),
            )
            return fresh, True

        async with connection.execute(
            "SELECT subject_id, role FROM threads WHERE id = ?", (thread_id,)
        ) as cursor:
            row = await cursor.fetchone()

        if row is None or row[0] != subject_id or row[1] != role:
            # Logged, because a mismatch is either a bug in a client or somebody
            # trying ids. The id is not logged: it is the thing being guessed.
            logger.info("thread resume refused", extra={"fields": {
                "reason": "unknown" if row is None else "not the caller's"}})
            raise ThreadNotFound("no such conversation")

        await connection.execute(
            "UPDATE threads SET last_used_at = ? WHERE id = ?", (now, thread_id)
        )
        return thread_id, False


async def sweep_expired_threads(ttl_days: int) -> int:
    """Delete threads untouched for `ttl_days`, and their messages with them.

    Run at boot, like the rate limiter's sweep.
    """
    cutoff = time.time() - ttl_days * 86400
    connection, guard = get_state_db(), get_state_lock()

    async with guard:
        async with connection.execute(
            "SELECT id FROM threads WHERE last_used_at < ?", (cutoff,)
        ) as cursor:
            stale = [row[0] for row in await cursor.fetchall()]

        if not stale:
            return 0

        marks = ",".join("?" for _ in stale)
        await connection.execute(f"DELETE FROM threads WHERE id IN ({marks})", stale)
        # The transcript goes with the thread. Leaving it would keep whole
        # conversations on disk that nothing can reach and nothing will delete.
        await connection.execute(
            f"DELETE FROM thread_messages WHERE thread_id IN ({marks})", stale)

    logger.info("expired threads swept", extra={"fields": {"threads": len(stale)}})
    return len(stale)


# LangChain's own serialisation: `content` alone would lose the tool calls and the
# tool-call ids, and a history missing those cannot be replayed to Gemini at all.
def _dump(message: BaseMessage) -> str:
    return json.dumps(dumpd(message))


# `load` is marked beta and warns on every call. It is the counterpart of `dumpd`,
# which wrote these rows, so the warning is noise on a path that runs per turn --
# silenced here rather than globally, so a *different* beta warning still shows up.
warnings.filterwarnings(
    "ignore", message="The function `load` is in beta", module="langchain_core")


def _load(payload: str) -> BaseMessage:
    # `allowed_objects="messages"` is not a formality. This string comes back out of
    # a database and is handed to a deserialiser; restricting it to message classes
    # means a row that has been tampered with can reconstruct a `ToolMessage` and
    # nothing else.
    return load(json.loads(payload), allowed_objects="messages")


async def load_history(thread_id: str, limit: int) -> list[BaseMessage]:
    """The last `limit` messages of a conversation, oldest first.

    Ordered by `seq` and taken from the end, so a long thread costs a bounded read
    rather than growing without limit -- the trim in `graph.py` bounds what is *sent*
    to the model, and this bounds what is loaded to decide that.
    """
    connection = get_state_db()
    async with connection.execute(
        "SELECT payload FROM (SELECT payload, seq FROM thread_messages"
        " WHERE thread_id = ? ORDER BY seq DESC LIMIT ?) ORDER BY seq ASC",
        (thread_id, limit),
    ) as cursor:
        rows = await cursor.fetchall()

    restored: list[BaseMessage] = []
    for (payload,) in rows:
        try:
            restored.append(_load(payload))
        except Exception:
            # One unreadable row must not cost the whole conversation. Logged loudly
            # because it means a serialisation format changed under us.
            logger.exception("dropping an unreadable message from a thread")
    return restored


async def append_messages(thread_id: str, messages: list[BaseMessage]) -> int:
    """Append this turn's new messages. Returns how many were written."""
    if not messages:
        return 0

    now = time.time()
    connection, guard = get_state_db(), get_state_lock()

    async with guard:
        async with connection.execute(
            "SELECT COALESCE(MAX(seq), 0) FROM thread_messages WHERE thread_id = ?",
            (thread_id,),
        ) as cursor:
            seq = (await cursor.fetchone())[0]

        await connection.executemany(
            "INSERT OR REPLACE INTO thread_messages (thread_id, seq, role, payload,"
            " created_at) VALUES (?, ?, ?, ?, ?)",
            [
                (thread_id, seq + offset, message.type, _dump(message), now)
                for offset, message in enumerate(messages, start=1)
            ],
        )
    return len(messages)
