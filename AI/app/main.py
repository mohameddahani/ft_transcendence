from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import config, db

app = FastAPI(title="Gym AI service")

# the frontend runs on another origin, so the browser needs permission to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

db.init_memory()


@app.get("/health")
def health():
    try:
        db.fetch_one("SELECT 1")
    except Exception:
        return JSONResponse({"status": "database unreachable"}, status_code=503)
    return {"status": "ok"}
