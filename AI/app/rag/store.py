"""Chroma storage for gym document chunks (collection A, `gym_docs`).

Every gym shares one collection. The `admin_id` in each chunk's metadata keeps them
apart, so every write, delete and search here filters on the caller's `Scope`, never
on an id passed in by hand. This is the only module that queries Chroma. Chroma's client is synchronous: every call runs in a thread so
it does not block other users' streams.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import Settings
from app.db.scope import Scope, ScopeViolation

VISIBILITIES = ("staff", "member")


@dataclass(frozen=True)
class Hit:
    """One retrieved chunk and where it came from (for citations)."""
    text: str
    source_name: str
    doc_id: str
    chunk_index: int
    distance: float     # cosine distance: 0 = same meaning, 2 = opposite; lower is closer
    url: str = ""       # Collection B only: where the source can be read

_collection: Any | None = None      # gym_docs: each gym's own documents (Collection A)
_business: Any | None = None        # gym_business: the shared industry corpus (Collection B)


def _open(client: Any, name: str, embedder: str, path: str) -> Any:
    collection = client.get_or_create_collection(
        name=name,
        embedding_function=None,        # we always pass Gemini vectors ourselves
        metadata={"hnsw:space": "cosine", "embedder": embedder},
    )
    # Vectors from two different models are not comparable, and nothing would raise:
    # search would just return nonsense. An existing collection keeps the metadata it
    # was created with, so this catches a changed model at boot.
    if collection.metadata.get("embedder") != embedder:
        raise RuntimeError(
            f"{name} holds {collection.metadata.get('embedder')} vectors but the config "
            f"says {embedder}; delete {path} and re-ingest the documents")
    return collection


def _open_store(settings: Settings) -> None:
    global _collection, _business
    client = chromadb.PersistentClient(
        path=settings.CHROMA_PATH,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    embedder = f"{settings.GEMINI_EMBED_MODEL}@{settings.GEMINI_EMBED_DIMENSIONS}"
    _collection = _open(client, "gym_docs", embedder, settings.CHROMA_PATH)
    _business = _open(client, "gym_business", embedder, settings.CHROMA_PATH)


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


async def delete_chunks(scope: Scope, doc_id: str) -> None:
    """Remove every chunk of one of this gym's documents."""
    _require_owner(scope)
    await asyncio.to_thread(_require_collection().delete, where=_this_document(scope, doc_id))


def _readable_by(scope: Scope) -> dict:
    """What this caller may retrieve -- the security control. Similarity never is:
    another gym's chunk can be the closest match to a question, and must not come back.

    Owner and staff: the whole gym, staff documents included. Member: only documents
    marked `member`.
    """
    gym = {"admin_id": scope.admin_id}
    if scope.is_member:
        return {"$and": [gym, {"visibility": "member"}]}
    return gym


async def search(scope: Scope, embedding: list[float], k: int) -> list[Hit]:
    """The k chunks closest to `embedding` that this caller may read, closest first.

    Chroma applies the filter inside the search, not after it, so a gym always gets
    its own k best chunks however many closer ones other gyms have.
    """
    result = await asyncio.to_thread(
        _require_collection().query,
        query_embeddings=[embedding],
        n_results=k,
        where=_readable_by(scope),
        include=["documents", "metadatas", "distances"],
    )
    return [
        Hit(text, meta["source_name"], meta["doc_id"], meta["chunk_index"], distance)
        for text, meta, distance in zip(
            result["documents"][0], result["metadatas"][0], result["distances"][0])
    ]


# --------------------------------------------------- Collection B, shared by every gym
# No Scope here: this corpus belongs to no gym. It is written only by the one-shot
# loader (load_business.py) and read by the advisory branch.

def _require_business() -> Any:
    if _business is None:
        raise RuntimeError("Chroma store has not been initialized")
    return _business


async def business_doc_ids() -> set[str]:
    """Which corpus documents are already embedded (chunk ids are `doc_id:index`)."""
    ids = (await asyncio.to_thread(_require_business().get, include=[]))["ids"]
    return {chunk_id.rsplit(":", 1)[0] for chunk_id in ids}


async def add_business_document(doc_id: str, meta: dict, chunks: list[str],
                                embeddings: list[list[float]]) -> None:
    """Store one corpus document, replacing any earlier version of it."""
    collection = _require_business()
    await asyncio.to_thread(collection.delete, where={"doc_id": doc_id})
    await asyncio.to_thread(
        collection.add,
        ids=[f"{doc_id}:{index}" for index in range(len(chunks))],
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{**meta, "doc_id": doc_id, "chunk_index": index} for index in range(len(chunks))],
    )


async def delete_business_document(doc_id: str) -> None:
    await asyncio.to_thread(_require_business().delete, where={"doc_id": doc_id})


async def search_business(embedding: list[float], k: int) -> list[Hit]:
    """The k corpus chunks closest to `embedding`, closest first."""
    result = await asyncio.to_thread(
        _require_business().query,
        query_embeddings=[embedding], n_results=k,
        include=["documents", "metadatas", "distances"],
    )
    return [
        Hit(text, meta["source_name"], meta["doc_id"], meta["chunk_index"], distance, meta.get("url", ""))
        for text, meta, distance in zip(
            result["documents"][0], result["metadatas"][0], result["distances"][0])
    ]
