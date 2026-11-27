import io

from google import genai
from google.genai import types
from pypdf import PdfReader

from app import config, db
from app.auth import User

CHUNK_SIZE = 1000      # characters per chunk
CHUNK_OVERLAP = 150    # shared with the previous chunk, so a sentence cut in two is still found
MAX_DISTANCE = 0.35    # a chunk further than this from the question is not relevant enough
VISIBILITIES = ("member", "staff")

gemini = genai.Client(api_key=config.GEMINI_API_KEY, http_options=types.HttpOptions(timeout=30_000))


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


# pgvector reads a vector written as text: '[0.1,0.2,...]'
def _vector(values: list[float]) -> str:
    return "[" + ",".join(map(str, values)) + "]"


def add_document(admin_id: str, filename: str, visibility: str, text: str) -> int:
    if visibility not in VISIBILITIES:
        raise ValueError("Visibility must be member or staff")
    pieces = chunk(text)
    if not pieces:
        raise ValueError("The document has no text")
    vectors = embed(pieces, "RETRIEVAL_DOCUMENT")
    # one transaction: the old version is replaced only if the new one is fully saved
    with db.store_pool.connection() as conn:
        conn.execute("DELETE FROM ai.documents WHERE admin_id = %s AND filename = %s", (admin_id, filename))
        doc = conn.execute("""
            INSERT INTO ai.documents (admin_id, filename, visibility) VALUES (%s, %s, %s)
            RETURNING id""", (admin_id, filename, visibility)).fetchone()
        with conn.cursor() as cur:
            cur.executemany(
                "INSERT INTO ai.chunks (document_id, position, text, embedding) VALUES (%s, %s, %s, %s::vector)",
                [(doc["id"], i, piece, _vector(v)) for i, (piece, v) in enumerate(zip(pieces, vectors))])
    return len(pieces)


# its chunks go with it (ON DELETE CASCADE)
def remove_document(admin_id: str, filename: str) -> None:
    db.store("DELETE FROM ai.documents WHERE admin_id = %s AND filename = %s", (admin_id, filename))


def list_documents(admin_id: str) -> list[dict]:
    return db.store("""
        SELECT d.filename, d.visibility, count(*) AS chunks
        FROM ai.documents d JOIN ai.chunks c ON c.document_id = d.id
        WHERE d.admin_id = %s
        GROUP BY d.id
        ORDER BY d.filename""", (admin_id,))


def search(user: User, query: str, k: int = 5) -> list[dict]:
    vector = embed([query], "RETRIEVAL_QUERY")[0]
    # <=> is cosine distance; the club filter is always there, members also only get member documents
    rows = db.store("""
        SELECT d.filename AS source, c.text, c.embedding <=> %s::vector AS distance
        FROM ai.chunks c JOIN ai.documents d ON d.id = c.document_id
        WHERE d.admin_id = %s AND (d.visibility = 'member' OR %s)
        ORDER BY distance
        LIMIT %s""", (_vector(vector), user.admin_id, user.role != "MEMBER", k))
    return [{"source": r["source"], "text": r["text"], "distance": round(r["distance"], 3)}
            for r in rows if r["distance"] <= MAX_DISTANCE]
