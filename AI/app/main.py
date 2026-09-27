import json
import logging
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from app import agent, config, db, rag
from app.auth import User, current_user, rate_limited_user

app = FastAPI(title="Gym AI service")

# the frontend runs on another origin, so the browser needs permission to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Retry-After"],  # so the page can show how long to wait after a 429
)

db.init_memory()


def _gym_name(user: User) -> str:
    return db.fetch_one("SELECT company_name FROM users WHERE id = %s", (user.admin_id,))["company_name"]


def _sse(event: str, data: dict) -> str:
    # one Server-Sent Event: a name, a JSON line, and an empty line to end it
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@app.get("/health")
def health():
    try:
        db.fetch_one("SELECT 1")
    except Exception:
        return JSONResponse({"status": "database unreachable"}, status_code=503)
    return {"status": "ok"}


@app.get("/ai/me")
def me(user: User = Depends(current_user)):
    return {"role": user.role, "gym_name": _gym_name(user)}


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    thread_id: uuid.UUID | None = None


@app.post("/ai/chat")
def chat(body: ChatRequest, user: User = Depends(rate_limited_user)):
    thread_id = str(body.thread_id or uuid.uuid4())
    history = db.load_messages(thread_id, user.id)
    gym = _gym_name(user)

    def stream():
        yield _sse("start", {"thread_id": thread_id})
        answer = ""
        try:
            for event in agent.run(user, gym, body.question, history):
                if event["type"] == "token":
                    answer += event["text"]
                    yield _sse("token", {"text": event["text"]})
                else:
                    yield _sse("tool", {"name": event["name"]})
        except Exception:
            # the real error goes to the logs; the user gets a message without internal details
            logging.exception("chat failed")
            yield _sse("error", {"message": "The assistant is unavailable right now. Please try again."})
            return
        # saved only when the turn finished, so a failed answer never enters the memory
        if answer:
            db.save_message(thread_id, user.id, "user", body.question)
            db.save_message(thread_id, user.id, "model", answer)
        yield _sse("done", {})

    # no-cache and no proxy buffering, so each event reaches the browser immediately
    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/ai/threads/{thread_id}")
def thread(thread_id: uuid.UUID, user: User = Depends(current_user)):
    return db.load_messages(str(thread_id), user.id, limit=100)


MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_FILES = (".md", ".txt", ".pdf")


def _owner_only(user: User) -> None:
    if user.role != "ADMIN":
        raise HTTPException(403, "Only the gym owner can manage documents")


@app.get("/ai/documents")
def list_documents(user: User = Depends(current_user)):
    _owner_only(user)
    return rag.list_documents(user.admin_id)


@app.post("/ai/documents")
def upload_document(file: UploadFile, visibility: str = Form(), user: User = Depends(rate_limited_user)):
    _owner_only(user)
    filename = Path(file.filename or "").name[:100]  # keep the name only, never a path
    if not filename.lower().endswith(ALLOWED_FILES):
        raise HTTPException(422, "Only .md, .txt and .pdf files are accepted")
    if visibility not in rag.VISIBILITIES:
        raise HTTPException(422, "Visibility must be member or staff")
    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "The file is larger than 10 MB")
    try:
        text = rag.extract_text(data)
    except Exception:
        raise HTTPException(422, "Could not read any text from this file")
    try:
        chunks = rag.add_document(user.admin_id, filename, visibility, text)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception:
        logging.exception("upload failed")
        raise HTTPException(502, "The document could not be processed right now. Please try again.")
    return {"filename": filename, "visibility": visibility, "chunks": chunks}


@app.delete("/ai/documents/{filename}")
def delete_document(filename: str, user: User = Depends(current_user)):
    _owner_only(user)
    if filename not in [d["filename"] for d in rag.list_documents(user.admin_id)]:
        raise HTTPException(404, "No such document")
    rag.remove_document(user.admin_id, filename)
    return {"deleted": filename}
