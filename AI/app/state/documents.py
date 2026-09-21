"""The `documents` table: one row per uploaded file, per gym.

Every query filters on the caller's `admin_id`, so another gym's document id finds
nothing -- the same answer as an id that does not exist.
"""

from __future__ import annotations

import time

from app.db.scope import Scope
from app.state.db import get_state_db

_COLUMNS = ("doc_id", "filename", "mime", "visibility", "chunk_count", "bytes", "created_at")


async def insert_document(scope: Scope, *, doc_id: str, filename: str, mime: str,
                          visibility: str, chunk_count: int, size: int) -> None:
    await get_state_db().execute(
        "INSERT INTO documents (id, admin_id, filename, mime, visibility, chunk_count, bytes, created_at)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (doc_id, scope.admin_id, filename, mime, visibility, chunk_count, size, time.time()),
    )


async def list_documents(scope: Scope) -> list[dict]:
    """This gym's documents, newest first."""
    async with get_state_db().execute(
        "SELECT id, filename, mime, visibility, chunk_count, bytes, created_at"
        " FROM documents WHERE admin_id = ? ORDER BY created_at DESC",
        (scope.admin_id,),
    ) as cursor:
        return [dict(zip(_COLUMNS, row)) for row in await cursor.fetchall()]


async def delete_document(scope: Scope, doc_id: str) -> bool:
    """True if this gym had that document."""
    cursor = await get_state_db().execute(
        "DELETE FROM documents WHERE id = ? AND admin_id = ?", (doc_id, scope.admin_id))
    return cursor.rowcount > 0
