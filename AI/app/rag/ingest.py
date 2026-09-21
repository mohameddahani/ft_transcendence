"""Ingestion: a document's text in, searchable chunks out.

chunk -> embed -> store. Embedding happens before anything is written, so when
Gemini fails, nothing is left half-stored.
"""

from __future__ import annotations

from uuid import uuid4

from app.config import get_settings
from app.db.scope import Scope
from app.rag.chunk import chunk_text
from app.rag.embed import embed_documents
from app.rag.store import add_chunks


class EmptyDocument(ValueError):
    """No text to index -- a scanned PDF, for example."""


async def ingest_text(scope: Scope, *, text: str, source_name: str, visibility: str) -> tuple[str, int]:
    """Index one document for this gym. Returns (doc_id, chunk_count)."""
    settings = get_settings()
    chunks = chunk_text(text, settings.RAG_CHUNK_CHARS, settings.RAG_CHUNK_OVERLAP)
    if not chunks:
        raise EmptyDocument("this document contains no text that can be indexed")

    embeddings = await embed_documents(chunks)
    doc_id = str(uuid4())
    await add_chunks(scope, doc_id=doc_id, source_name=source_name,
                     visibility=visibility, chunks=chunks, embeddings=embeddings)
    return doc_id, len(chunks)
