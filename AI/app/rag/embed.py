"""Gemini embeddings: one call for document chunks, one for questions.

Gemini embeds the two sides differently (`task_type`), and retrieval is better when
each side says which one it is.
"""

from __future__ import annotations

import asyncio
import math
from functools import lru_cache

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import get_settings

_BATCH = 100    # the most texts Gemini accepts in one embedding call


@lru_cache(maxsize=1)
def _model() -> GoogleGenerativeAIEmbeddings:
    """Holds no tenant, so one shared client is safe (same rule as get_llm)."""
    settings = get_settings()
    return GoogleGenerativeAIEmbeddings(
        model=settings.GEMINI_EMBED_MODEL,
        google_api_key=settings.GEMINI_API_KEY.get_secret_value(),
        output_dimensionality=settings.GEMINI_EMBED_DIMENSIONS,
    )


def _normalize(vector: list[float]) -> list[float]:
    """Unit length. At 768 dimensions Gemini returns |v| = 0.58, not 1."""
    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0:
        raise ValueError("embedding has zero magnitude")
    return [value / magnitude for value in vector]


async def _timed(call):
    # The client's own `request_options={"timeout": ...}` is silently ignored
    # (measured: a 0.001s timeout still returned after 0.56s), so we bound it here.
    return await asyncio.wait_for(call, get_settings().GEMINI_TIMEOUT_SECONDS)


async def embed_documents(texts: list[str]) -> list[list[float]]:
    """One vector per chunk, in the same order."""
    vectors: list[list[float]] = []
    for start in range(0, len(texts), _BATCH):
        batch = texts[start:start + _BATCH]
        vectors += await _timed(_model().aembed_documents(batch, task_type="RETRIEVAL_DOCUMENT"))
    return [_normalize(vector) for vector in vectors]


async def embed_query(text: str) -> list[float]:
    """The vector for a user's question."""
    return _normalize(await _timed(_model().aembed_query(text, task_type="RETRIEVAL_QUERY")))
