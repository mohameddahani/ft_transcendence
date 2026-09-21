"""Tasks 3.1-3.3 checks: chunking, the Chroma store, ingestion, /ai/documents, retrieval.

Runs in the ai container via scripts/verify.sh, which copies the seeded policy
documents to /tmp/corpus first. Chroma is opened in a temporary directory, never
on /data/chroma, which belongs to the running server.

Offline by default (fake vectors; the HTTP checks only exercise refusals, which all
happen before Gemini). `AI_LIVE_TESTS=1` adds real embeddings and real uploads.
"""

import asyncio
import io
import logging
import math
import os
import random
import re
import sqlite3
import subprocess
import tempfile
import time
from pathlib import Path

import httpx
import jwt
from pypdf import PdfWriter

from app.config import get_settings
from app.db.scope import Scope, ScopeViolation
from app.core.errors import ApiError
from app.rag import embed, ingest, store
from app.rag.chunk import _SENTENCE_END, chunk_text
from app.rag.retrieve import retrieve
from app.state import db as state_db
from app.state import documents

FAIL = 0
SIZE, OVERLAP = 1000, 150
URL = "http://127.0.0.1:8000/ai/documents"
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


def blank_pdf(password: str | None = None) -> bytes:
    """A page with no text on it -- what a scanned PDF looks like to pypdf."""
    writer = PdfWriter()
    writer.add_blank_page(200, 200)
    if password:
        writer.encrypt(password)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def text_pdf(line: str) -> bytes:
    """The smallest real PDF with one line of text."""
    stream = f"BT /F1 12 Tf 20 100 Td ({line}) Tj ET".encode()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R"
        b" /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out, offsets = b"%PDF-1.4\n", []
    for number, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += b"%d 0 obj\n%s\nendobj\n" % (number, body)
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    out += b"".join(b"%010d 00000 n \n" % offset for offset in offsets)
    return out + b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objects) + 1, xref)


def token(role: str, who: str) -> str:
    return subprocess.run(["python", "/tmp/mint_token.py", role, who],
                          capture_output=True, text=True, check=True).stdout.strip()


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
    await store.delete_chunks(OASIS, "d1")
    check("another gym cannot delete it", chunks_of("d1", "gym-atl") == ["new 0", "new 1"])
    await store.delete_chunks(ATLAS, "d1")
    check("its own gym can", chunks_of("d1", "gym-atl") == [])

    for label, call in (
        ("a visibility typo is refused", store.add_chunks(ATLAS, doc_id="d2", source_name="b", visibility="Members",
                                                          chunks=["t"], embeddings=[v])),
        ("a member cannot add documents", store.add_chunks(Scope(admin_id="gym-atl", member_id="m1"), doc_id="d2",
                                                           source_name="b", visibility="member", chunks=["t"], embeddings=[v])),
        ("staff cannot delete documents", store.delete_chunks(Scope(admin_id="gym-atl", staff_id="s1"), "d2")),
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


def check_files() -> None:
    print("\n\033[1m  reading uploaded files\033[0m")

    def read(name: str, data: bytes) -> tuple[str, str]:
        try:
            text, mime = ingest.extract_text(name, data)
            return mime, text
        except ingest.UnsupportedType:
            return "415", ""
        except ingest.UnreadableDocument:
            return "422", ""

    mime, text = read("renamed.txt", text_pdf("Freezes last up to 30 days"))
    check("a PDF is read as a PDF, whatever its name", mime == "application/pdf" and "30 days" in text)
    check("a PDF with no text layer (a scan) gives no text", read("scan.pdf", blank_pdf())[1].strip() == "")
    check("a password-protected PDF is refused", read("x.pdf", blank_pdf(password="s"))[0] == "422")
    check("a damaged PDF is refused", read("x.pdf", b"%PDF-1.4 not really")[0] == "422")
    check("a .docx is refused as a type", read("terms.docx", b"PK\x03\x04 zip")[0] == "415")
    check("a PNG renamed to .md is refused", read("x.md", b"\x89PNG\r\n\x1a\n\xff\xfe")[0] == "422")
    check("text containing NUL bytes is refused", read("x.txt", b"a\x00b")[0] == "422")
    check("Markdown front matter is dropped",
          read("x.md", b"---\nvisibility: staff\n---\n# Hi\n\nBody") == ("text/markdown", "# Hi\n\nBody"))
    check("a UTF-8 BOM and Windows line ends are cleaned", read("x.txt", "\ufeffa\r\nb".encode()) == ("text/plain", "a\nb"))


async def check_ingest() -> None:
    print("\n\033[1m  ingestion: the SQLite row and the Chroma chunks\033[0m")
    open_temp_store()
    ingest.embed_documents = fake_embed
    text = corpus()["atl/membership-terms.md"]
    add = dict(filename="membership-terms.md", visibility="member", mime="text/markdown", size=len(text))

    doc_id, count = await ingest.ingest_text(ATLAS, text=text, **add)
    rows = await documents.list_documents(ATLAS)
    check("a document becomes one row and its chunks",
          [r["doc_id"] for r in rows] == [doc_id] and rows[0]["chunk_count"] == count == len(chunks_of(doc_id, "gym-atl")),
          f"{count} chunks")
    check("another gym does not see the row", await documents.list_documents(OASIS) == [])
    check("another gym cannot remove it",
          not await ingest.remove_document(OASIS, doc_id) and len(chunks_of(doc_id, "gym-atl")) == count)
    removed = await ingest.remove_document(ATLAS, doc_id)
    check("its own gym removes the row and the chunks",
          removed and chunks_of(doc_id, "gym-atl") == [] and await documents.list_documents(ATLAS) == [])

    try:
        await ingest.ingest_text(ATLAS, text="  \n ", **add)
        check("a document with no text is refused", False)
    except ingest.UnreadableDocument:
        check("a document with no text is refused", True)

    async def gemini_down(_):
        raise TimeoutError("Gemini is down")
    ingest.embed_documents = gemini_down
    try:
        await ingest.ingest_text(ATLAS, text=text, **add)
    except TimeoutError:
        pass
    check("when embedding fails, nothing is stored",
          store._require_collection().count() == 0 and await documents.list_documents(ATLAS) == [])

    async def sdk_error():
        raise RuntimeError("403 at https://generativelanguage.googleapis.com?key=AIza-secret")
    try:
        await embed._timed(sdk_error())
        check("a Gemini failure becomes a generic 502", False)
    except ApiError as exc:
        check("a Gemini failure becomes a generic 502",
              exc.status_code == 502 and "secret" not in str(exc.detail), exc.detail["error"]["message"])

    async def chroma_down(*_, **__):
        raise RuntimeError("Chroma is down")
    ingest.embed_documents, real_add, ingest.add_chunks = fake_embed, ingest.add_chunks, chroma_down
    try:
        await ingest.ingest_text(ATLAS, text=text, **add)
    except RuntimeError:
        pass
    ingest.add_chunks = real_add
    check("when Chroma fails, the row is removed too", await documents.list_documents(ATLAS) == [])


def check_http() -> None:
    print("\n\033[1m  /ai/documents over HTTP (refusals: no Gemini call)\033[0m")
    medina, titan, oasis = token("admin", "medina"), token("admin", "titan"), token("admin", "oasis")
    staff, member = token("staff", "medina"), token("member", "omar@gmail.com")
    limit = get_settings().MAX_UPLOAD_MB * 1024 * 1024

    def post(who, files=None, visibility="member", **kw) -> int:
        headers = {"Authorization": f"Bearer {who}"} if who else {}
        data = {"visibility": visibility} if visibility else None
        return httpx.post(URL, headers=headers, files=files, data=data, timeout=30, **kw).status_code

    md = {"file": ("a.md", b"# Hi\n\nBody")}
    # Split between two owners: refused uploads still count against the 10/min
    # docs budget, and this suite must pass when run twice in a row.
    for label, got, want in (
        ("no token", post(None, md), 401),
        ("a member", post(member, md), 403),
        ("staff", post(staff, md), 403),
        ("no Content-Length (chunked body)", httpx.post(
            URL, content=iter([b"--x--\r\n"]), timeout=30,
            headers={"Authorization": f"Bearer {medina}", "Content-Type": "multipart/form-data; boundary=x"}).status_code, 411),
        ("one byte over MAX_UPLOAD_MB", post(medina, {"file": ("big.txt", b"a" * (limit + 1))}), 413),
        ("no file", post(medina, None), 400),
        ("two files", post(medina, [("file", ("a.md", b"x")), ("file", ("b.md", b"y"))]), 400),
        ("a visibility typo", post(titan, md, visibility="Member"), 400),
        ("a .docx", post(titan, {"file": ("t.docx", b"PK\x03\x04 zip")}), 415),
        ("an empty file", post(titan, {"file": ("empty.md", b"")}), 422),
        ("a scanned PDF", post(titan, {"file": ("scan.pdf", blank_pdf())}), 422),
    ):
        check(f"upload: {label} -> {want}", got == want, f"got {got}")

    # A row put straight into the server's SQLite, so list and delete are tested
    # without paying for an upload.
    medina_id = jwt.decode(medina, options={"verify_signature": False})["id"]
    with sqlite3.connect(get_settings().SQLITE_PATH) as conn:
        conn.execute("INSERT INTO documents VALUES ('check-rag-doc', ?, 'probe.md', 'text/markdown',"
                     " 'member', 0, 0, ?)", (medina_id, time.time()))

    def listed(who) -> list[str]:
        r = httpx.get(URL, headers={"Authorization": f"Bearer {who}"}, timeout=10)
        return [d["doc_id"] for d in r.json()]

    def delete(who, doc_id) -> int:
        return httpx.delete(f"{URL}/{doc_id}", headers={"Authorization": f"Bearer {who}"}, timeout=10).status_code

    check("list: the owner sees the gym's document", "check-rag-doc" in listed(medina))
    check("list: another gym does not", "check-rag-doc" not in listed(oasis))
    check("list: a member is refused", httpx.get(URL, headers={"Authorization": f"Bearer {member}"}).status_code == 403)
    check("delete: another gym gets 404, not 403", delete(oasis, "check-rag-doc") == 404)
    check("delete: an unknown id gets 404", delete(medina, "no-such-doc") == 404)
    check("delete: the owner gets 204 and it is gone",
          delete(medina, "check-rag-doc") == 204 and "check-rag-doc" not in listed(medina))


async def check_retrieval() -> None:
    print("\n\033[1m  retrieval: who can read what\033[0m")
    open_temp_store()
    question = fake_vector("question")
    await store.add_chunks(ATLAS, doc_id="a-member", source_name="terms.md", visibility="member",
                           chunks=["atlas member"], embeddings=[fake_vector("m")])
    await store.add_chunks(ATLAS, doc_id="a-staff", source_name="handbook.md", visibility="staff",
                           chunks=["atlas staff"], embeddings=[fake_vector("s")])
    # Oasis holds the best possible match: the question's own vector, distance 0.
    await store.add_chunks(OASIS, doc_id="o-member", source_name="terms.md", visibility="member",
                           chunks=["oasis exact match"], embeddings=[question])

    async def texts(scope: Scope, k: int = 20) -> list[str]:
        return sorted(h.text for h in await store.search(scope, question, k))

    check("the owner gets the gym's member and staff chunks", await texts(ATLAS) == ["atlas member", "atlas staff"])
    check("another gym's exact match never comes back", "oasis exact match" not in await texts(ATLAS),
          "distance 0, filtered out anyway")
    check("staff get the same as the owner",
          await texts(Scope(admin_id="gym-atl", staff_id="s1")) == ["atlas member", "atlas staff"])
    check("a member gets member chunks only", await texts(Scope(admin_id="gym-atl", member_id="m1")) == ["atlas member"])
    check("the other gym gets only its own", await texts(OASIS) == ["oasis exact match"])
    check("a gym with no documents gets nothing", await texts(Scope(admin_id="gym-new")) == [])
    hits = await store.search(ATLAS, question, 20)
    check("closest first, with source and distance for citing",
          [h.distance for h in hits] == sorted(h.distance for h in hits)
          and all(h.source_name and h.doc_id and h.chunk_index == 0 for h in hits))
    check("k limits the number of chunks", len(await store.search(ATLAS, question, 1)) == 1)


async def check_live() -> None:
    print("\n\033[1m  live: real Gemini embeddings\033[0m")
    from app.rag.embed import embed_documents, embed_query
    open_temp_store()
    ingest.embed_documents = embed_documents
    for name, text in corpus().items():
        gym, filename = name.split("/")
        visibility = "staff" if filename in ("pricing-authority.md", "operations-manual.md") else "member"
        await ingest.ingest_text(Scope(admin_id=f"gym-{gym}"), text=text, filename=filename,
                                 visibility=visibility, mime="text/markdown", size=len(text))
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

    notice = "How many days notice do I need to give to cancel my membership?"
    atlas_top = (await retrieve(Scope(admin_id="gym-atl"), notice))[0]
    oasis_top = (await retrieve(Scope(admin_id="gym-oas"), notice))[0]
    check("two gyms, same question, two different answers",
          "30 days notice" in atlas_top.text and "45 days notice" in oasis_top.text,
          f"Atlas 30 days ({atlas_top.distance:.3f}), Oasis 45 days ({oasis_top.distance:.3f})")

    discount = "What discount can reception give without asking the manager?"
    staff_files = ("pricing-authority.md", "operations-manual.md")
    member_hits = await retrieve(Scope(admin_id="gym-atl", member_id="m1"), discount)
    check("a member never retrieves a staff document",
          member_hits and not any(h.source_name in staff_files for h in member_hits),
          f"{len(member_hits)} chunks, none from a staff file")
    for label, scope in (("the owner", ATLAS), ("staff", Scope(admin_id="gym-atl", staff_id="s1"))):
        top = (await retrieve(scope, discount))[0]
        check(f"{label} gets the staff discount rule first",
              top.source_name == "pricing-authority.md" and "15%" in top.text, f"distance {top.distance:.3f}")

    atlas_token = token("admin", "atlas")
    auth = {"Authorization": f"Bearer {atlas_token}"}
    uploads = [("membership-terms.md", Path("/tmp/corpus/atl/membership-terms.md").read_bytes(), "member"),
               ("freeze.pdf", text_pdf("Members may freeze their membership for up to 30 days."), "staff")]
    for name, data, visibility in uploads:
        r = httpx.post(URL, headers=auth, files={"file": (name, data)}, data={"visibility": visibility}, timeout=60)
        body = r.json()
        check(f"upload {name} -> 201", r.status_code == 201 and body.get("chunk_count", 0) > 0,
              f"{r.status_code} {body.get('chunk_count')} chunks, rate limit left {r.headers.get('x-ratelimit-remaining')}")
        rows = {d["doc_id"]: d for d in httpx.get(URL, headers=auth).json()}
        row = rows.get(body.get("doc_id"), {})
        check(f"  listed with its type and visibility", (row.get("mime"), row.get("visibility")) ==
              ("text/markdown" if name.endswith(".md") else "application/pdf", visibility))
        check(f"  deleted -> 204", httpx.delete(f"{URL}/{body.get('doc_id')}", headers=auth).status_code == 204)


async def main() -> int:
    logging.getLogger("pypdf").setLevel(logging.ERROR)   # "EOF marker not found" is expected
    await state_db.init_state_db(get_settings().model_copy(
        update={"SQLITE_PATH": os.path.join(tempfile.mkdtemp(), "state.db")}))
    try:
        check_chunker()
        await check_store()
        await check_retrieval()
        check_files()
        await check_ingest()
        check_http()
        if os.environ.get("AI_LIVE_TESTS") == "1":
            await check_live()
    finally:
        # aiosqlite runs a thread per connection; left open, Python never exits.
        await state_db.close_state_db()
    return FAIL


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
