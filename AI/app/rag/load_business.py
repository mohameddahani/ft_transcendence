"""Load Collection B -- the shared gym-business corpus -- into Chroma (task 4.2).

    python -m app.rag.load_business

Run like a database migration: docker compose runs it as the one-shot `ai-load` service
and starts the server only once it has exited, because Chroma must never be written
by two processes at once.

Chroma is made to mirror corpus/business/docs: documents that are missing are embedded
and added, documents that are no longer there are removed, the rest are skipped -- so
every run after the first costs no Gemini call at all.

Two rules for calling Gemini a few hundred times:
- a **token bucket** sets the pace: a steady rate with a small burst, so a big load
  never trips the provider's quota in the first place;
- **retry only what retrying can fix** -- 429, 5xx, timeouts -- with exponential backoff
  and jitter. A 400 fails the same way every time.

It always exits 0: if Gemini is down on a first boot, the server must still start. The
documents it could not embed are simply missing, and the next start tries them again.
"""

from __future__ import annotations

import asyncio
import random
import sys
import time
from pathlib import Path

from app.config import get_settings
from app.rag import store
from app.rag.chunk import chunk_text
from app.rag.embed import embed_documents

CORPUS = Path(__file__).resolve().parents[2] / "corpus" / "business" / "docs"
KEPT = ("title", "topic", "kind", "url")        # front-matter fields stored on every chunk


class TokenBucket:
    """At most `rate` calls a second on average, and `burst` in a row."""

    def __init__(self, rate: float, burst: int) -> None:
        self.rate, self.capacity = rate, burst
        self.tokens, self.updated = float(burst), time.monotonic()

    async def take(self) -> None:
        while True:
            now = time.monotonic()
            self.tokens = min(self.capacity, self.tokens + (now - self.updated) * self.rate)
            self.updated = now
            if self.tokens >= 1:
                self.tokens -= 1
                return
            await asyncio.sleep((1 - self.tokens) / self.rate)


def retryable(exc: BaseException) -> bool:
    """A 429, a 5xx or a timeout anywhere in the cause chain. Our own 502 wraps every
    Gemini failure but carries no `code`, so the real error underneath decides."""
    cause: BaseException | None = exc
    while cause is not None:
        if isinstance(cause, TimeoutError):
            return True
        code = getattr(cause, "code", None)
        if isinstance(code, int) and (code == 429 or code >= 500):
            return True
        cause = cause.__cause__
    return False


async def embed_with_retry(chunks: list[str], bucket: TokenBucket, attempts: int = 5) -> list[list[float]]:
    for attempt in range(attempts):
        await bucket.take()
        try:
            return await embed_documents(chunks)
        except Exception as exc:
            if attempt == attempts - 1 or not retryable(exc):
                raise
            print(f"    retrying after {type(exc.__cause__ or exc).__name__} (attempt {attempt + 2})", flush=True)
            await asyncio.sleep(2 ** attempt + random.random())    # 1, 2, 4, 8 s, plus jitter
    raise AssertionError("unreachable")


def read(path: Path) -> tuple[dict, str]:
    """(front matter, body) of one corpus document."""
    _, header, body = path.read_text().split("---\n", 2)
    meta = dict(line.split(": ", 1) for line in header.splitlines() if ": " in line)
    return meta, body.strip()


async def load(corpus: Path = CORPUS, bucket: TokenBucket | None = None) -> dict:
    """Make Chroma mirror `corpus`. Returns what it did."""
    settings = get_settings()
    bucket = bucket or TokenBucket(rate=2, burst=5)
    documents = {meta["id"]: (meta, body) for meta, body in map(read, sorted(corpus.glob("*.md")))}
    loaded = await store.business_doc_ids()

    for doc_id in loaded - documents.keys():
        await store.delete_business_document(doc_id)
    todo = [doc_id for doc_id in documents if doc_id not in loaded]
    added, failed = 0, []
    for number, doc_id in enumerate(todo, 1):
        meta, body = documents[doc_id]
        chunks = chunk_text(body, settings.RAG_CHUNK_CHARS, settings.RAG_CHUNK_OVERLAP)
        try:
            vectors = await embed_with_retry(chunks, bucket)
        except Exception as exc:  # noqa: BLE001 -- one document must not stop the rest
            failed.append(doc_id)
            print(f"  ✗ {doc_id}: {type(exc).__name__}", flush=True)
            continue
        extra = {key: meta[key] for key in KEPT if key in meta}
        await store.add_business_document(doc_id, {"source_name": extra.pop("title"), **extra},
                                          chunks, vectors)
        added += 1
        print(f"  [{number}/{len(todo)}] {doc_id}: {len(chunks)} chunks", flush=True)
    return {"documents": len(documents), "added": added, "failed": failed,
            "removed": len(loaded - documents.keys()), "skipped": len(documents) - len(todo)}


async def main() -> int:
    await store.init_store(get_settings())
    result = await load()
    print(f"Collection B: {result['documents']} documents -- added {result['added']}, "
          f"skipped {result['skipped']}, removed {result['removed']}, failed {len(result['failed'])}"
          + (" (they will be retried at the next start)" if result["failed"] else ""), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
