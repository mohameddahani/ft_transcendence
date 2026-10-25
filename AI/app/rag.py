import io

import chromadb
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
store = chromadb.PersistentClient(path=config.VECTORS_DIR)
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
    # first cut the document into sections: each Markdown heading (#) starts a new one
    sections = [""]
    for line in text.split("\n"):
        if line.startswith("#"):
            sections.append("")
        sections[-1] += line + "\n"

    chunks = []
    for section in sections:
        section = section.strip()
        start = 0
        end = 0
        while end < len(section):
            end = start + CHUNK_SIZE
            piece = section[start:end]
            if start > 0 and section.startswith("#"):
                piece = section.splitlines()[0] + "\n" + piece
            chunks.append(piece)
            start = end - CHUNK_OVERLAP
    return chunks


def embed(texts: list[str], task: str) -> list[list[float]]:
    vectors = []
    for i in range(0, len(texts), 100):
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
    vectors = embed(pieces, "RETRIEVAL_DOCUMENT")
    remove_document(admin_id, filename)
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
    if user.role == "MEMBER":
        where = {"$and": [{"admin_id": user.admin_id}, {"visibility": "member"}]}
    else:
        where = {"admin_id": user.admin_id}

    vector = embed([query], "RETRIEVAL_QUERY")
    result = collection.query(query_embeddings=vector, n_results=k, where=where)
    texts = result["documents"][0]
    files = result["metadatas"][0]
    distances = result["distances"][0]

    matches = []
    for text, file, distance in zip(texts, files, distances):
        if distance <= MAX_DISTANCE:
            matches.append({"source": file["filename"], "text": text, "distance": round(distance, 3)})
    return matches
