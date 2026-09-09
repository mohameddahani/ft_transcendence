"""The Gemini client -- and the one object in the agent layer it is safe to cache.

A `ChatGoogleGenerativeAI` holds a model id, a key and generation settings. It holds
no tenant, no `Scope` and no conversation, so building one per request is pure
overhead and `get_llm()` is cached.

The *bound* model is the exact opposite. `.bind_tools(...)` attaches declarations for
a registry whose callables have a `Scope` closed over them, so a cached bound model
would hand one gym's tools to the next caller -- the cleanest tenant leak in the
project, and one that `scope.py` could not catch, because the queries would be doing
exactly what they were told. That binding happens inside `run_turn` and never here.

Two objects, two lifetimes, one rule: cache what has no tenant in it.
"""

from __future__ import annotations

from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import get_settings


@lru_cache(maxsize=1)
def get_llm() -> ChatGoogleGenerativeAI:
    """The shared, tenant-free chat model. Bind tools to it, never in it."""
    settings = get_settings()

    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_CHAT_MODEL,
        google_api_key=settings.GEMINI_API_KEY.get_secret_value(),
        # Zero, not because determinism is a virtue in itself, but because every
        # answer here is a report of a number that is already in the database. Two
        # identical questions in front of an evaluator must not produce two
        # different figures.
        temperature=0.0,
        # See config.GEMINI_THINKING_BUDGET: measured, not assumed.
        thinking_budget=settings.GEMINI_THINKING_BUDGET,
        # The library default is 6. A request that has already failed twice inside
        # the timeout budget is a demo watching a dead spinner; fail fast, surface
        # `upstream_error`, and let the user retry.
        max_retries=1,
        timeout=settings.GEMINI_TIMEOUT_SECONDS,
    )
