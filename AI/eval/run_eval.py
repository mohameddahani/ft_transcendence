"""Measure retrieval on eval/retrieval_set.csv: where the right chunk ranks, and how far
away it is. The distance threshold is chosen from these numbers, not by feel.

Each question goes through the same path as `retrieve()` -- rewritten (D23), embedded,
searched. `raw` is the distance without the rewrite, to show what the rewrite buys.

    docker compose exec -T -u root ai rm -rf /tmp/corpus /tmp/eval
    docker compose cp seeder/documents ai:/tmp/corpus
    docker compose cp eval ai:/tmp/eval
    docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/eval/run_eval.py

Loads the 16 seeded documents into a temporary Chroma (16 Gemini calls), never the
server's. Each gym's key (`atl`, `oas`...) stands in for its admin_id.
"""

import asyncio
import csv
import tempfile
from pathlib import Path

from app.config import get_settings
from app.db.scope import Scope
from app.rag import store
from app.rag.chunk import chunk_text
from app.rag.embed import embed_documents, embed_query
from app.rag.retrieve import rewrite_query

HERE = Path(__file__).parent


async def load_corpus() -> None:
    settings = get_settings()
    store._open_store(settings.model_copy(update={"CHROMA_PATH": tempfile.mkdtemp()}))
    for path in sorted(Path("/tmp/corpus").glob("*/*.md")):
        _, header, body = path.read_text().split("---\n", 2)
        visibility = "staff" if "visibility: staff" in header else "member"
        chunks = chunk_text(body, settings.RAG_CHUNK_CHARS, settings.RAG_CHUNK_OVERLAP)
        await store.add_chunks(Scope(admin_id=path.parent.name), doc_id=f"{path.parent.name}/{path.name}",
                               source_name=path.name, visibility=visibility,
                               chunks=chunks, embeddings=await embed_documents(chunks))


def right_chunk(row: dict, hits: list) -> tuple[int | None, float]:
    """(rank, distance) of the expected chunk; for a no-answer row, the nearest chunk."""
    if not row["expected_source"]:
        return None, hits[0].distance
    for rank, hit in enumerate(hits, 1):
        if hit.source_name == row["expected_source"] and row["expected_section"] in hit.text.splitlines()[:2]:
            return rank, hit.distance
    return None, float("nan")


async def main() -> None:
    await load_corpus()
    rows = list(csv.DictReader(open(HERE / "retrieval_set.csv", encoding="utf-8")))
    right, wrong, found = [], [], 0
    answerable = [r for r in rows if r["expected_source"]]
    limit = get_settings().RAG_MAX_DISTANCE
    answered = refused = 0

    print(f"\n  {'lang':<7}{'rank':>5}{'raw':>7}{'dist':>7}  kept  question")
    for row in rows:
        scope = Scope(admin_id=row["gym"], member_id="eval" if row["role"] == "member" else None)
        _, raw = right_chunk(row, await store.search(scope, await embed_query(row["question"]), 20))
        hits = await store.search(scope, await embed_query(await rewrite_query(row["question"])), 20)
        rank, distance = right_chunk(row, hits)
        if not row["expected_source"]:
            wrong.append(hits[0].distance)
            refused += hits[0].distance > limit
            print(f"  {'none':<7}{'-':>5}{raw:>7.3f}{hits[0].distance:>7.3f}  {'no' if hits[0].distance > limit else 'YES':<4}  {row['question'][:52]}"
                  f"   (nearest: {hits[0].text.splitlines()[0][:30]})")
            continue
        found += rank is not None and rank <= 5
        right.append((row["language"], distance))
        kept = distance <= limit
        answered += kept
        print(f"  {row['language']:<7}{rank or 'miss':>5}{raw:>7.3f}{distance:>7.3f}  {'yes' if kept else 'NO':<4}  {row['question'][:52]}")

    print(f"\n  recall@5: {found}/{len(answerable)} answerable questions have the right chunk in the top 5")
    for language in ("en", "fr", "darija", "ar"):
        distances = [d for lang, d in right if lang == language]
        print(f"  right chunk, {language:<7} {min(distances):.3f} - {max(distances):.3f}")
    print(f"  no answer: nearest chunk is {min(wrong):.3f} - {max(wrong):.3f}")
    print(f"\n  with RAG_MAX_DISTANCE={limit}: {answered}/{len(answerable)} answered, "
          f"{refused}/{len(rows) - len(answerable)} no-answer questions refused")


if __name__ == "__main__":
    asyncio.run(main())
