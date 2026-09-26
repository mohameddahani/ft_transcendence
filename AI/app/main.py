from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config

app = FastAPI(title="Gym AI service")

# the frontend runs on another origin, so the browser needs permission to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
