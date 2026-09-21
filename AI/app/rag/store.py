"""Chroma storage for gym document chunks (collection A, `gym_docs`).

Every gym shares one collection. The `admin_id` in each chunk's metadata keeps them
apart, so every write and delete here filters on the caller's `Scope`, never on an
id passed in by hand. Chroma's client is synchronous: every call runs in a thread so
it does not block other users' streams.
"""

from __future__ import annotations

import asyncio
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import Settings
from app.db.scope import Scope, ScopeViolation

VISIBILITIES = ("staff", "member")

_collection: Any | None = None


def _open_store(settings: Settings) -> None:
    global _collection
    client = chromadb.PersistentClient(
        path=settings.CHROMA_PATH,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    embedder = f"{settings.GEMINI_EMBED_MODEL}@{settings.GEMINI_EMBED_DIMENSIONS}"
    collection = client.get_or_create_collection(
        name="gym_docs",
        embedding_function=None,        # we always pass Gemini vectors ourselves
        metadata={"hnsw:space": "cosine", "embedder": embedder},
    )
    # Vectors from two different models are not comparable, and nothing would raise:
    # search would just return nonsense. An existing collection keeps the metadata it
    # was created with, so this catches a changed model at boot.
    if collection.metadata.get("embedder") != embedder:
        raise RuntimeError(
            f"gym_docs holds {collection.metadata.get('embedder')} vectors but the config "
            f"says {embedder}; delete {settings.CHROMA_PATH} and re-ingest the documents")
    _collection = collection


async def init_store(settings: Settings) -> None:
    """Open persistent Chroma. Called once from the FastAPI lifespan."""
    await asyncio.to_thread(_open_store, settings)


def _require_collection() -> Any:
    if _collection is None:
        raise RuntimeError("Chroma store has not been initialized")
    return _collection


def _require_owner(scope: Scope) -> None:
    if not scope.is_owner:
        raise ScopeViolation("only the gym owner manages documents")


def _this_document(scope: Scope, doc_id: str) -> dict:
    # Chroma needs an explicit $and to combine two conditions.
    return {"$and": [{"admin_id": scope.admin_id}, {"doc_id": doc_id}]}


async def add_chunks(
    scope: Scope,
    *,
    doc_id: str,
    source_name: str,
    visibility: str,
    chunks: list[str],
    embeddings: list[list[float]],
) -> None:
    """Store every chunk of one document, replacing any it had before."""
    _require_owner(scope)
    if visibility not in VISIBILITIES:
        raise ValueError(f"visibility must be one of {VISIBILITIES}")
    if len(chunks) != len(embeddings):
        raise ValueError("chunks and embeddings must have the same length")

    collection = _require_collection()
    # Delete first: an upsert of a shorter version would leave the old tail chunks
    # behind, still searchable (measured). `add`, not `upsert`, so an id that
    # already exists is never overwritten.
    await asyncio.to_thread(collection.delete, where=_this_document(scope, doc_id))
    await asyncio.to_thread(
        collection.add,
        ids=[f"{doc_id}:{index}" for index in range(len(chunks))],
        documents=chunks,
        embeddings=embeddings,
        metadatas=[
            {
                "admin_id": scope.admin_id,
                "visibility": visibility,
                "doc_id": doc_id,
                "source_name": source_name,
                "chunk_index": index,
            }
            for index in range(len(chunks))
        ],
    )


async def delete_document(scope: Scope, doc_id: str) -> None:
    """Remove every chunk of one of this gym's documents."""
    _require_owner(scope)
    await asyncio.to_thread(_require_collection().delete, where=_this_document(scope, doc_id))
