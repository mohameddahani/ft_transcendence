import json
import logging
import uuid

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from app import agent, config, db
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
