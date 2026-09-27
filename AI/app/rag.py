import io
import re

import chromadb
from chromadb.config import Settings
from google import genai
from google.genai import types
from pypdf import PdfReader

from app import config
from app.auth import User

CHUNK_SIZE = 1000      # characters per chunk
CHUNK_OVERLAP = 150    # shared with the previous chunk, so a sentence cut in two is still found
MAX_DISTANCE = 0.35    # a chunk further than this from the question is not relevant enough
VISIBILITIES = ("member", "staff")

gemini = genai.Client(api_key=config.GEMINI_API_KEY, http_options=types.HttpOptions(timeout=30_000))
store = chromadb.PersistentClient(path=config.VECTORS_DIR, settings=Settings(anonymized_telemetry=False))
collection = store.get_or_create_collection("documents", metadata={"hnsw:space": "cosine"})


def extract_text(data: bytes) -> str:
    if data.startswith(b"%PDF"):
        return "\n\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages)
    text = data.decode("utf-8")
    # front matter (--- ... ---) at the top of a Markdown file is metadata, not content
    if text.startswith("---\n"):
        text = text.split("\n---\n", 1)[-1]
    return text


def chunk(text: str) -> list[str]:
    chunks = []
    # a new section starts at every Markdown heading line
    for section in re.split(r"\n(?=#)", text):
        section = section.strip()
        if not section:
            continue
        heading = section.splitlines()[0] if section.startswith("#") else ""
        for start in range(0, max(len(section) - CHUNK_OVERLAP, 1), CHUNK_SIZE - CHUNK_OVERLAP):
            piece = section[start:start + CHUNK_SIZE]
            # a piece cut from the middle of a section still says which section it came from
            chunks.append(piece if start == 0 or not heading else heading + "\n" + piece)
    return chunks


def embed(texts: list[str], task: str) -> list[list[float]]:
    vectors = []
    for i in range(0, len(texts), 100):  # the API takes at most 100 texts per call
        result = gemini.models.embed_content(
            model=config.EMBED_MODEL, contents=texts[i:i + 100],
            config=types.EmbedContentConfig(task_type=task, output_dimensionality=768))
        vectors += [e.values for e in result.embeddings]
    return vectors


def add_document(admin_id: str, filename: str, visibility: str, text: str) -> int:
    if visibility not in VISIBILITIES:
        raise ValueError("Visibility must be member or staff")
    pieces = chunk(text)
    if not pieces:
        raise ValueError("The document has no text")
    vectors = embed(pieces, "RETRIEVAL_DOCUMENT")  # first: if Gemini fails, the old version stays
    remove_document(admin_id, filename)            # uploading the same file again replaces it
    collection.add(
        ids=[f"{admin_id}:{filename}:{i}" for i in range(len(pieces))],
        documents=pieces,
        embeddings=vectors,
        metadatas=[{"admin_id": admin_id, "filename": filename, "visibility": visibility}] * len(pieces),
    )
    return len(pieces)


def remove_document(admin_id: str, filename: str) -> None:
    collection.delete(where={"$and": [{"admin_id": admin_id}, {"filename": filename}]})


def list_documents(admin_id: str) -> list[dict]:
    counts: dict[tuple, int] = {}
    for meta in collection.get(where={"admin_id": admin_id}, include=["metadatas"])["metadatas"]:
        key = (meta["filename"], meta["visibility"])
        counts[key] = counts.get(key, 0) + 1
    return [{"filename": f, "visibility": v, "chunks": n} for (f, v), n in sorted(counts.items())]


def search(user: User, query: str, k: int = 5) -> list[dict]:
    # the filter comes from the token: always this gym, and only member documents for a member
    where = {"admin_id": user.admin_id}
    if user.role == "MEMBER":
        where = {"$and": [where, {"visibility": "member"}]}
    result = collection.query(query_embeddings=embed([query], "RETRIEVAL_QUERY"), n_results=k, where=where)
    hits = zip(result["documents"][0], result["metadatas"][0], result["distances"][0])
    return [{"source": meta["filename"], "text": text, "distance": round(distance, 3)}
            for text, meta, distance in hits if distance <= MAX_DISTANCE]
