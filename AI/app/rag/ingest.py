"""Ingestion: an uploaded file in, searchable chunks out -- and back out again.

The only module that touches both stores: the SQLite `documents` row (the list the
owner sees) and the Chroma chunks (what retrieval searches).

    extract_text -> chunk -> embed -> row -> chunks

Every refusal happens before the Gemini call, and the row is written before the
chunks, so a chunk never exists without a row that lists it and can delete it.
"""

from __future__ import annotations

import io
import re
from uuid import uuid4

from pypdf import PdfReader

from app.config import get_settings
from app.db.scope import Scope
from app.rag.chunk import chunk_text
from app.rag.embed import embed_documents
from app.rag.store import add_chunks, delete_chunks
from app.state import documents


class UnsupportedType(ValueError):
    """Not a PDF, TXT or Markdown file."""


class UnreadableDocument(ValueError):
    """A supported file with no text to index: scanned, encrypted, damaged or empty."""


def extract_text(filename: str, data: bytes) -> tuple[str, str]:
    """(text, mime type) of an upload. Synchronous: run it in a thread.

    The type comes from the bytes, not the name: a PDF starts with `%PDF-` whatever
    it is called, and a renamed binary fails the UTF-8 check.
    """
    if data.startswith(b"%PDF-"):
        return _pdf_text(data), "application/pdf"
    if not filename.lower().endswith((".txt", ".md")):
        raise UnsupportedType("Only PDF, TXT and Markdown files are accepted.")
    try:
        text = data.decode("utf-8-sig").replace("\r\n", "\n")
    except UnicodeDecodeError:
        raise UnreadableDocument("Text files must be UTF-8.") from None
    if "\x00" in text:
        raise UnreadableDocument("This file is not text.")
    if filename.lower().endswith(".md"):
        # YAML front matter is metadata about the file, not content to search.
        return re.sub(r"\A---\n.*?\n---\n", "", text, flags=re.S), "text/markdown"
    return text, "text/plain"


def _pdf_text(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        encrypted = reader.is_encrypted
        text = "" if encrypted else "\n\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:  # pypdf raises many different types on a damaged file
        raise UnreadableDocument("This PDF could not be read.") from exc
    if encrypted:
        raise UnreadableDocument("Password-protected PDFs cannot be read.")
    return text


async def ingest_text(scope: Scope, *, text: str, filename: str, visibility: str,
                      mime: str, size: int) -> tuple[str, int]:
    """Index one document for this gym. Returns (doc_id, chunk_count)."""
    settings = get_settings()
    chunks = chunk_text(text, settings.RAG_CHUNK_CHARS, settings.RAG_CHUNK_OVERLAP)
    if not chunks:
        raise UnreadableDocument("No text found in this file. A scanned PDF has none.")

    embeddings = await embed_documents(chunks)
    doc_id = str(uuid4())
    await documents.insert_document(scope, doc_id=doc_id, filename=filename, mime=mime,
                                    visibility=visibility, chunk_count=len(chunks), size=size)
    try:
        await add_chunks(scope, doc_id=doc_id, source_name=filename, visibility=visibility,
                         chunks=chunks, embeddings=embeddings)
    except Exception:
        await remove_document(scope, doc_id)
        raise
    return doc_id, len(chunks)


async def remove_document(scope: Scope, doc_id: str) -> bool:
    """Chunks first, row last: if this stops halfway, the row is still listed and
    the owner can simply delete again. False if this gym has no such document."""
    await delete_chunks(scope, doc_id)
    return await documents.delete_document(scope, doc_id)
