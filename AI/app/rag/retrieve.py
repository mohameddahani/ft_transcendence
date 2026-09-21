"""Retrieval: a question in, the caller's closest document chunks out.

Which chunks a caller is *allowed* to see is decided in `store.search`, from the
Scope. This module decides which are *relevant*: today the 20 nearest; the distance
threshold (D22) and query rewriting (D23) will live here too.
"""

from __future__ import annotations

from app.db.scope import Scope
from app.rag.embed import embed_query
from app.rag.store import Hit, search

TOP_K = 20      # AI_SPECS §5: retrieve 20 now, rerank down to 5 in phase 4


async def retrieve(scope: Scope, question: str, k: int = TOP_K) -> list[Hit]:
    """This caller's k chunks closest in meaning to the question, closest first."""
    return await search(scope, await embed_query(question), k)
