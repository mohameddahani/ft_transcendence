"""Retrieval: a question in, the caller's closest document chunks out.

    rewrite (D23) -> embed -> search (store, filtered by Scope) -> threshold (D22)

Which chunks a caller is *allowed* to see is decided in `store.search`, from the
Scope. This module decides which are *relevant*. The rewrite cannot widen access:
it only changes the words searched for, never the filter.
"""

from __future__ import annotations

import logging
import re

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from pydantic import BaseModel, Field

from app.agents.language import Language, detect
from app.agents.llm import get_llm
from app.config import get_settings
from app.db.scope import Scope
from app.rag.embed import embed_query
from app.rag.store import Hit, search, search_business

logger = logging.getLogger(__name__)

TOP_K = 20      # AI_SPECS §5: retrieve 20 now, rerank down to 5 in phase 4

_REWRITE_PROMPT = """Rewrite the user's last message as ONE standalone search query in English,
for searching a gym's policy documents.
- Use the conversation to resolve what it refers to ("and on weekends?" -> "What are the
  opening hours on weekends?").
- Translate French, Arabic and Darija into English. Darija is often written in Latin
  letters with digits for Arabic sounds: 3 = ع, 7 = ح, 9 = ق.
- Keep names of people, gyms and membership plans exactly as written.
- Do not answer the question and do not add facts."""


class _Query(BaseModel):
    query: str = Field(description="the standalone English search query")


def with_conversation(question: str, history: list[BaseMessage]) -> str:
    """The question, preceded by the last few turns as text: enough to resolve
    "and on weekends?". Tool results are left out -- they can hold member-written text."""
    lines = []
    for message in history[-6:]:
        if isinstance(message, (HumanMessage, AIMessage)) and message.text:
            who = "User" if isinstance(message, HumanMessage) else "Assistant"
            lines.append(f"{who}: {message.text[:300]}")
    if not lines:
        return question
    return "Conversation so far:\n" + "\n".join(lines) + f"\n\nLast message: {question}"


async def rewrite_query(question: str, history: list[BaseMessage] | None = None) -> str:
    """The question as a standalone English search query. One model call, skipped
    when there is nothing to do: an English question with no conversation before it."""
    history = history or []
    if not history and detect(question) is Language.ENGLISH:
        return question
    try:
        result = await get_llm().with_structured_output(_Query).ainvoke(
            [("system", _REWRITE_PROMPT), ("human", with_conversation(question, history))])
        return result.query.strip() or question
    except Exception as exc:  # noqa: BLE001 -- a failed rewrite must not fail retrieval
        # Searching the original words is worse, not wrong: English still matches.
        logger.warning("query rewrite failed", extra={"fields": {"error_type": type(exc).__name__}})
        return question


async def retrieve(scope: Scope, question: str, history: list[BaseMessage] | None = None,
                   k: int = TOP_K) -> list[Hit]:
    """This caller's chunks close enough to answer the question, closest first.

    An empty list means the answer is not in this gym's documents. The caller must
    say so, not hand the model the nearest unrelated chunk to improvise from.
    """
    query = await rewrite_query(question, history)
    hits = await search(scope, await embed_query(query), k)
    return [hit for hit in hits if hit.distance <= get_settings().RAG_MAX_DISTANCE]


async def retrieve_business(query: str, k: int = 5) -> list[Hit]:
    """The industry corpus (Collection B) for an advisory answer: the nearest chunks
    within the threshold, at most two from any one document so an answer can cite
    several sources -- some questions otherwise pull 20 chunks from 5 documents.

    No rewrite call: the model writes this query itself, in English and in the
    industry's words (the tool's description asks for "churn", "dropout"...). That
    closes the vocabulary gap measured in D30 -- "cancel" ranked the dropout study 22nd.
    """
    kept, per_document = [], {}
    for hit in await search_business(await embed_query(query), TOP_K):
        if hit.distance > get_settings().RAG_MAX_DISTANCE:
            break
        if per_document.get(hit.doc_id, 0) < 2:
            per_document[hit.doc_id] = per_document.get(hit.doc_id, 0) + 1
            kept.append(hit)
        if len(kept) == k:
            break
    return kept


def cited_sources(answer: str, numbered: dict[int, Hit]) -> list[dict]:
    """The `sources` payload: only excerpts the answer cites, and only numbers that were
    really handed to the model -- a model can cite an excerpt it was never shown."""
    # "[2]" and "[1, 5]" both count: models group citations.
    cited = {int(n) for group in re.findall(r"\[([\d,\s]+)\]", answer) for n in re.findall(r"\d+", group)}
    return [{"n": n, "doc_id": hit.doc_id, "source_name": hit.source_name, "chunk_index": hit.chunk_index,
             "score": round(1 - hit.distance, 3), **({"url": hit.url} if hit.url else {})}
            for n, hit in sorted(numbered.items()) if n in cited]
