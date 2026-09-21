"""`/ai/documents`: the owner uploads, lists and deletes the gym's documents (task 3.2).

Owner only. `CurrentAdmin` answers 403 to staff and members, mirroring Dahani's API,
which has no document routes for them.
"""

from __future__ import annotations

import asyncio
from pathlib import PurePath

from fastapi import APIRouter, Request, Response
from starlette.datastructures import UploadFile

from app.auth.dependencies import CurrentAdmin
from app.config import get_settings
from app.core.errors import ApiError
from app.core.ratelimit import DocsRateLimited
from app.rag.ingest import (
    UnreadableDocument,
    UnsupportedType,
    extract_text,
    ingest_text,
    remove_document,
)
from app.rag.store import VISIBILITIES
from app.state.documents import list_documents

router = APIRouter(prefix="/ai/documents", tags=["documents"])


def _display_name(raw: str | None) -> str:
    """The uploaded name is only ever shown, never used as a path."""
    name = PurePath((raw or "").replace("\\", "/")).name
    return "".join(ch for ch in name if ch.isprintable())[:120] or "document"


@router.post("", status_code=201)
async def upload(request: Request, ctx: CurrentAdmin, _: DocsRateLimited) -> dict:
    """multipart form: `file` (PDF, TXT, Markdown) and `visibility` (staff | member)."""
    max_mb = get_settings().MAX_UPLOAD_MB
    # The body is not a declared parameter, so FastAPI has not read it: the token and
    # the rate limit are checked first, and the size before a single byte is read.
    # uvicorn never reads past the declared Content-Length, so this is a real limit.
    length = request.headers.get("content-length", "")
    if not length.isdigit():
        raise ApiError(411, "length_required", "The upload must declare a Content-Length.")
    if int(length) > max_mb * 1024 * 1024:
        raise ApiError(413, "too_large", f"Files are limited to {max_mb} MB.")

    async with request.form(max_files=1, max_fields=1) as form:
        file, visibility = form.get("file"), form.get("visibility")
        if not isinstance(file, UploadFile):
            raise ApiError(400, "invalid_request", "Attach the document as the `file` field.")
        if visibility not in VISIBILITIES:
            raise ApiError(400, "invalid_request", "visibility must be 'staff' or 'member'.")
        filename, data = _display_name(file.filename), await file.read()

    try:
        text, mime = await asyncio.to_thread(extract_text, filename, data)   # pypdf blocks
        doc_id, chunk_count = await ingest_text(ctx.scope, text=text, filename=filename,
                                                visibility=visibility, mime=mime, size=len(data))
    except UnsupportedType as exc:
        raise ApiError(415, "unsupported_type", str(exc)) from exc
    except UnreadableDocument as exc:
        raise ApiError(422, "unreadable_document", str(exc)) from exc
    return {"doc_id": doc_id, "filename": filename, "chunk_count": chunk_count}


@router.get("")
async def index(ctx: CurrentAdmin) -> list[dict]:
    """This gym's documents, newest first."""
    return await list_documents(ctx.scope)


@router.delete("/{doc_id}", status_code=204)
async def remove(doc_id: str, ctx: CurrentAdmin) -> Response:
    if not await remove_document(ctx.scope, doc_id):
        # 404, not 403, for another gym's id: a 403 would confirm that it exists.
        raise ApiError(404, "not_found", "No such document.")
    return Response(status_code=204)
