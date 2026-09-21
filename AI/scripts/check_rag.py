"""Task 3.1 checks: chunking, the Chroma store, ingestion.

Runs in the ai container via scripts/verify.sh, which copies the seeded policy
documents to /tmp/corpus first. Chroma is opened in a temporary directory, never
on /data/chroma, which belongs to the running server.

Offline by default (fake vectors). `AI_LIVE_TESTS=1` adds real Gemini embeddings.
"""

import asyncio
import math
import os
import random
import re
import tempfile
from pathlib import Path

from app.config import get_settings
from app.db.scope import Scope, ScopeViolation
from app.rag import ingest, store
from app.rag.chunk import _SENTENCE_END, chunk_text

FAIL = 0
SIZE, OVERLAP = 1000, 150
ATLAS, OASIS = Scope(admin_id="gym-atl"), Scope(admin_id="gym-oas")


def check(label: str, cond: bool, detail: str = "") -> None:
    global FAIL
    mark = "\033[32m✓\033[0m" if cond else "\033[31m✗\033[0m"
    print(f"  {mark} {label:<58} {detail}")
    if not cond:
        FAIL = 1


def corpus() -> dict[str, str]:
    """gym/file -> body, front matter removed (ingestion never sees it)."""
    return {f"{p.parent.name}/{p.name}": p.read_text().split("---\n", 2)[2]
            for p in sorted(Path("/tmp/corpus").glob("*/*.md"))}


def fake_vector(text: str, dims: int = 8) -> list[float]:
    rng = random.Random(text)
    v = [rng.gauss(0, 1) for _ in range(dims)]
    norm = math.sqrt(sum(x * x for x in v))
    return [x / norm for x in v]


async def fake_embed(texts: list[str]) -> list[list[float]]:
    return [fake_vector(t) for t in texts]


def open_temp_store(**override) -> None:
    settings = get_settings().model_copy(update={"CHROMA_PATH": tempfile.mkdtemp(), **override})
    store._open_store(settings)


def chunks_of(doc_id: str, admin_id: str) -> list[str]:
    got = store._require_collection().get(
        where={"$and": [{"admin_id": admin_id}, {"doc_id": doc_id}]})
    return sorted(got["documents"])


def check_chunker() -> None:
    print("\n\033[1m  chunking\033[0m")
    docs = corpus()
    check("the seeded corpus is present", len(docs) == 16, f"{len(docs)} files")
    all_chunks = {name: chunk_text(text, SIZE, OVERLAP) for name, text in docs.items()}
    flat = [c for cs in all_chunks.values() for c in cs]
    check("no chunk is over the size limit", max(map(len, flat)) <= SIZE,
          f"{len(flat)} chunks, longest {max(map(len, flat))}")
    check("every chunk starts with its section heading", all(c.startswith("#") for c in flat))
    check("no chunk ends on a heading with nothing under it",
          not any(c.splitlines()[-1].startswith("#") for c in flat))

    def words(s): return re.findall(r"\S+", s)
    lost = [n for n, text in docs.items()
            if not all(w in iter(words(" ".join(all_chunks[n]))) for w in words(text))]
    check("no word of any document is lost", not lost, ", ".join(lost))

    glued = "# Refunds\n" + "A member may cancel within thirty days. " * 60
    check("a heading glued to a long paragraph still respects the limit",
          max(map(len, chunk_text(glued, SIZE, OVERLAP))) <= SIZE)
    check("a 5000-character word is cut, not kept whole",
          max(map(len, chunk_text("x" * 5000, SIZE, OVERLAP))) <= SIZE)

    table = "\n".join(["| Plan | Price |", "|---|---|"] + [f"| Plan {i} | {i}00.00 MAD |" for i in range(80)])
    parts = chunk_text(table, SIZE, OVERLAP)
    check("a big table is split between rows, one row per line",
          len(parts) > 1 and all(line.startswith("|") for p in parts for line in p.splitlines()))
    check("a list keeps one item per line",
          chunk_text("- towel\n- padlock\n- shoes", SIZE, OVERLAP) == ["- towel\n- padlock\n- shoes"])

    prose = "## Rules\n\n" + " ".join(f"Rule number {i} applies to every member." for i in range(60))
    parts = chunk_text(prose, SIZE, OVERLAP)
    shared = [p for a, b in zip(parts, parts[1:])
              for p in [a.splitlines()[-1]] if p in b]
    check("a long section overlaps: a chunk repeats the last sentence",
          len(parts) > 1 and len(shared) == len(parts) - 1, f"{len(parts)} chunks")
    check("an Arabic question mark ends a sentence",
          _SENTENCE_END.split("هل يمكنني التجميد؟ نعم.") == ["هل يمكنني التجميد؟", "نعم."])
    check("empty text gives no chunks", chunk_text(" \n\n ", SIZE, OVERLAP) == [])
    for size, over in ((0, 0), (100, -1), (100, 100)):
        try:
            chunk_text("x", size, over)
            check(f"chunk_text({size}, {over}) is refused", False)
        except ValueError:
            check(f"chunk_text({size}, {over}) is refused", True)


async def check_store() -> None:
    print("\n\033[1m  Chroma store\033[0m")
    open_temp_store()
    col = store._require_collection()
    check("the collection uses cosine distance", col.configuration["hnsw"]["space"] == "cosine")
    check("telemetry is off", not col._client.get_settings().anonymized_telemetry)
    try:
        col.query(query_texts=["refund"], n_results=1)
        check("Chroma never embeds text with a local model", False)
    except Exception:
        check("Chroma never embeds text with a local model", True)

    v = fake_vector("same")
    await store.add_chunks(ATLAS, doc_id="d1", source_name="a.md", visibility="member",
                           chunks=["same", "opposite"], embeddings=[v, [-x for x in v]])
    hits = col.query(query_embeddings=[v], n_results=2, where={"admin_id": "gym-atl"})
    check("identical vector: distance 0, opposite: distance 2",
          [round(d, 3) for d in hits["distances"][0]] == [0.0, 2.0])

    await store.add_chunks(ATLAS, doc_id="d1", source_name="a.md", visibility="member",
                           chunks=[f"old {i}" for i in range(5)], embeddings=await fake_embed(["x"] * 5))
    await store.add_chunks(ATLAS, doc_id="d1", source_name="a.md", visibility="member",
                           chunks=["new 0", "new 1"], embeddings=await fake_embed(["y", "z"]))
    check("re-adding a shorter document leaves no old chunks", chunks_of("d1", "gym-atl") == ["new 0", "new 1"])
    meta = col.get(ids=["d1:0"])["metadatas"][0]
    check("chunk metadata is complete", set(meta) == {"admin_id", "visibility", "doc_id", "source_name", "chunk_index"},
          f"id d1:0 -> {meta['admin_id']}, {meta['visibility']}")

    await store.add_chunks(OASIS, doc_id="d1", source_name="evil.md", visibility="member",
                           chunks=["overwritten"], embeddings=await fake_embed(["w"]))
    check("another gym reusing a doc_id cannot overwrite it", chunks_of("d1", "gym-atl") == ["new 0", "new 1"])
    await store.delete_document(OASIS, "d1")
    check("another gym cannot delete it", chunks_of("d1", "gym-atl") == ["new 0", "new 1"])
    await store.delete_document(ATLAS, "d1")
    check("its own gym can", chunks_of("d1", "gym-atl") == [])

    for label, call in (
        ("a visibility typo is refused", store.add_chunks(ATLAS, doc_id="d2", source_name="b", visibility="Members",
                                                          chunks=["t"], embeddings=[v])),
        ("a member cannot add documents", store.add_chunks(Scope(admin_id="gym-atl", member_id="m1"), doc_id="d2",
                                                           source_name="b", visibility="member", chunks=["t"], embeddings=[v])),
        ("staff cannot delete documents", store.delete_document(Scope(admin_id="gym-atl", staff_id="s1"), "d2")),
    ):
        try:
            await call
            check(label, False)
        except (ValueError, ScopeViolation):
            check(label, True)

    path = tempfile.mkdtemp()
    open_temp_store(CHROMA_PATH=path)
    try:
        open_temp_store(CHROMA_PATH=path, GEMINI_EMBED_MODEL="another-model")
        check("a different embedding model refuses to open the store", False)
    except RuntimeError:
        check("a different embedding model refuses to open the store", True)


async def check_ingest() -> None:
    print("\n\033[1m  ingestion\033[0m")
    open_temp_store()
    ingest.embed_documents = fake_embed
    text = corpus()["atl/membership-terms.md"]
    doc_id, count = await ingest.ingest_text(ATLAS, text=text, source_name="membership-terms.md", visibility="member")
    check("a document becomes its chunks", len(chunks_of(doc_id, "gym-atl")) == count, f"{count} chunks")
    try:
        await ingest.ingest_text(ATLAS, text="  \n ", source_name="scan.pdf", visibility="member")
        check("a document with no text is refused", False)
    except ingest.EmptyDocument:
        check("a document with no text is refused", True)

    async def broken(_):
        raise TimeoutError("Gemini is down")
    ingest.embed_documents = broken
    before = store._require_collection().count()
    try:
        await ingest.ingest_text(ATLAS, text=text, source_name="x.md", visibility="member")
    except TimeoutError:
        pass
    check("when embedding fails, nothing is stored", store._require_collection().count() == before)


async def check_live() -> None:
    print("\n\033[1m  live: real Gemini embeddings\033[0m")
    from app.rag.embed import embed_documents, embed_query
    open_temp_store()
    ingest.embed_documents = embed_documents
    for name, text in corpus().items():
        gym, filename = name.split("/")
        visibility = "staff" if filename in ("pricing-authority.md", "operations-manual.md") else "member"
        await ingest.ingest_text(Scope(admin_id=f"gym-{gym}"), text=text, source_name=filename, visibility=visibility)
    col = store._require_collection()
    q = await embed_query("How many days notice do I need to give to cancel my membership?")
    check("vectors are unit length with the configured size",
          len(q) == get_settings().GEMINI_EMBED_DIMENSIONS and abs(math.sqrt(sum(x * x for x in q)) - 1) < 1e-6)

    anyone = col.query(query_embeddings=[q], n_results=4, include=["metadatas", "distances"])
    gyms = {m["admin_id"] for m in anyone["metadatas"][0]}
    check("without a filter, other gyms' chunks match too", len(gyms) > 1,
          f"top 4 from {len(gyms)} gyms -- the filter is the control, not similarity")

    atlas = col.query(query_embeddings=[q], n_results=1, where={"admin_id": "gym-atl"},
                      include=["documents", "distances"])
    top, distance = atlas["documents"][0][0], atlas["distances"][0][0]
    check("with the filter, the top hit is Atlas's cancelling rule", top.startswith("## Cancelling"),
          f"distance {distance:.3f}")
    off = await embed_query("Do you sell car insurance?")
    far = col.query(query_embeddings=[off], n_results=1, where={"admin_id": "gym-atl"})["distances"][0][0]
    check("an off-topic question lands further away", far > distance, f"distance {far:.3f} (D22 threshold input)")


async def main() -> int:
    check_chunker()
    await check_store()
    await check_ingest()
    if os.environ.get("AI_LIVE_TESTS") == "1":
        await check_live()
    return FAIL


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
