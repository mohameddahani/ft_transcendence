# AI Layer — Roadmap

**Companion to `AI_PLAN.md` (what and why) and `AI_SPECS.md` (exactly what it looks like).**
This file is the *order and the calendar*. Task IDs refer to the phase list in `AI_PLAN.md`.

**Start 2026-09-03 (Thu) · Demo target mid-October 2026 · 43 calendar days.**

---

## How to use this

Each morning, ask for that day's spec: *"give me the tasks for D9"*. You get the detailed spec,
you implement, you bring the code back, it gets reviewed, then the next task.

**Rules that make the schedule hold:**

1. **One task at a time.** Nothing starts until the previous is reviewed.
2. **Commit after every reviewed task**, to `origin/ai`, with a real message. Commit history is an
   explicit graded requirement, not bookkeeping.
3. **Don't jump ahead to the interesting part.** RAG is more fun than rate limiting. Rate limiting
   is worth points and RAG is a bonus.
4. **One flexible rest day a week.** Pick it. Six-day weeks for six weeks is how people burn out in
   week 4 and lose more than they gained.
5. **If a day runs long, it takes the slack — not the next day's work.** Slack is built in below.

**On learning new things:** you said the stack isn't fixed and the point is to learn by doing. Each
week names what's genuinely new. When something is new, budget a *learning block* before the task —
understand the concept first, then implement. That's slower on the day and faster across the week.

---

## Week 1 — Sep 3–6 (4 days) · Foundations

New: FastAPI app structure, Pydantic Settings, async Postgres, Docker multi-stage builds.

| Day | Date | Tasks | Learning goal |
|---|---|---|---|
| D1 | Thu 09-03 | Local Postgres container, run Dahani's Prisma migrations, seed one gym by hand to have something real | How the schema actually behaves; why you need your own DB before anything else |
| D2 | Fri 09-04 | **0.1** FastAPI skeleton, `config.py`, `/health`, `.env.example`, Dockerfile | Dependency injection, Pydantic Settings, multi-stage builds and why image size matters |
| D3 | Sat 09-05 | **0.2** Read-only engine + typed read models | Async DB access; why `Decimal` and never `float` for money |
| D4 | Sun 09-06 | **0.3** `scope.py` + **0.4** startup schema check | **The most important 40 lines you'll write.** Multi-tenancy enforced in one place, fail-fast at boot |

**Checkpoint:** `docker compose up` starts your service, `/health` reports DB reachable, and a
scoped query returns one gym's members and physically cannot return another's.

---

## Week 2 — Sep 7–13 · Auth, limits, seeder

New: HS256 verification, constant-time comparison, sliding-window rate limiting, structured logging.

| Day | Date | Tasks | Learning goal |
|---|---|---|---|
| D5 | Mon 09-07 | **0.5** JWT verification, both role secrets, tenant resolution | Why the unverified `role` claim can't choose the key |
| D6 | Tue 09-08 | **0.6** API-key auth + **0.8** logging and error handler | Timing attacks; error taxonomy that never leaks a stack trace |
| D7 | Wed 09-09 | **0.7** Rate limiter | Sliding window vs. token bucket — you will be asked to explain this |
| D8 | Thu 09-10 | **1.1–1.2** Seeder: gyms, plans, members | Realistic data generation |
| D9 | Fri 09-11 | **1.3–1.4** Membership history with lapses, matching payments | Modelling churn and return as data |
| D10 | Sat 09-12 | **1.5** Check-in events from archetypes | **Why uniform randomness teaches a model nothing** |
| D11 | Sun 09-13 | **1.6–1.7** Feedback comments, per-gym documents | Building test data you can verify answers against |

**Checkpoint:** Phase 0 complete and demonstrable — a 429 fires on demand, a bad token is rejected,
a forced error returns clean JSON. Four gyms of realistic data with findable patterns.

---

## Week 3 — Sep 14–20 · Admin agent + streaming ⭐

The most important week. Ends with your only module inside the mandatory 14.

New: function calling, LangGraph state graphs, SSE, checkpointers, consuming a stream in React.

| Day | Date | Tasks | Learning goal |
|---|---|---|---|
| D12 | Mon 09-14 | **2.1** Tool definitions (8 tools) | Tool schema design; why no tool takes a tenant id from the model |
| D13 | Tue 09-15 | **2.2** LangGraph agent + Gemini function calling | Graph state, nodes, edges, the agent loop |
| D14 | Wed 09-16 | **2.3** SSE endpoint | SSE vs. WebSockets vs. polling; backpressure |
| D15 | Thu 09-17 | **2.7** Thin admin chat UI *(assisted)* | Reading a stream with `fetch` + `ReadableStream` |
| D16 | Fri 09-18 | **2.4** Session memory + checkpointer | What actually gets persisted per thread |
| D17 | Sat 09-19 | **2.5** DB-derived profile + **2.6** language detection | Why profile is a `SELECT`, not memory |
| D18 | Sun 09-20 | Slack / harden / catch up | — |

**⭐ Milestone: LLM interface major complete.** Tokens stream progressively, a 429 shows in the UI,
a forced API error is handled, an Arabic question gets an Arabic answer.

---

## Week 4 — Sep 21–27 · RAG Collection A

New: embeddings, chunking strategy, cosine distance, metadata filtering, query rewriting.

| Day | Date | Tasks | Learning goal |
|---|---|---|---|
| D19 | Mon 09-21 | **3.1** Ingestion + chunking | Chunk size/overlap trade-offs; sentence-boundary splitting |
| D20 | Tue 09-22 | **3.2** Document endpoints + `pypdf` | Upload validation, MIME checks, size limits |
| D21 | Wed 09-23 | **3.3** Tenant-filtered retrieval | Embeddings and vector space; metadata filters as a security control |
| D22 | Thu 09-24 | **3.4** Similarity thresholding | **Distance vs. similarity; the "I don't know" path that stops hallucination** |
| D23 | Fri 09-25 | **3.5** Query rewriting | Follow-up resolution + translate-to-corpus-language |
| D24 | Sat 09-26 | **3.6** Knowledge branch + citations | Router branching; grounding answers in sources |
| D25 | Sun 09-27 | **3.7** Document manager UI *(assisted)* | Multipart upload from React |

**Checkpoint:** Two gyms, same question, two different correct answers. A question with no match
answered *"that isn't in your documents"* instead of invented.

---

## Week 5 — Sep 28–Oct 4 · Member agent + corpus

New: least-privilege tool design, prompt injection, corpus curation.

| Day | Date | Tasks | Learning goal |
|---|---|---|---|
| D26 | Mon 09-28 | **3b.1–3b.2** Restricted tools + visibility filter | Least privilege expressed in function signatures |
| D27 | Tue 09-29 | **3b.3** Role dispatch + **3b.4** member chat *(assisted)* | One endpoint, two agents |
| D28 | Wed 09-30 | **3b.5** Prompt-injection tests | **Try to break your own member agent. Write the tests that prove you can't.** |
| D29 | Thu 10-01 | **4.1** Gather Collection B *(together)* | Sourcing and cleaning a real corpus |
| D30 | Fri 10-02 | **4.1** continued + **4.2** ingest | Scaling ingestion beyond a few files |
| D31 | Sat 10-03 | **4.3** Advisory branch | Combining SQL results and retrieved context in one answer |
| D32 | Sun 10-04 | Slack / catch up | — |

**Checkpoint:** A member cannot reach another member's data or gym revenue, by any prompt. The
advisory answer cites both this gym's numbers and an industry source.

---

## Week 6 — Oct 5–11 · Reranking, evaluation, sentiment

New: reranking, retrieval evaluation, classification prompting.

| Day | Date | Tasks | Learning goal |
|---|---|---|---|
| D33 | Mon 10-05 | **4.4** LLM reranking | Bi-encoder vs. cross-encoder; why top-20 → top-5 |
| D34 | Tue 10-06 | **4.5** Eval set + scoring script | recall@k; **tuning the threshold with numbers, not vibes** |
| D35 | Wed 10-07 | **4.6** Source citations in the UI *(assisted)* | — |
| D36 | Thu 10-08 | **5.1** `/internal/sentiment` | Classification prompting; calibrated confidence |
| D37 | Fri 10-09 | **5.2** Batch scoring the backlog | Batching and retry/backoff |
| D38 | Sat 10-10 | **5.3** Sentiment panel *(assisted)* | Trend visualisation |
| D39 | Sun 10-11 | Slack / catch up | — |

**⭐ Milestone: all three modules functionally complete.** Everything after this is hardening.

---

## Week 7 — Oct 12–15 · Integration and rehearsal

| Day | Date | Tasks |
|---|---|---|
| D40 | Mon 10-12 | **6.1** Concurrency check — simultaneous streams, no interference *(mandatory)* |
| D41 | Tue 10-13 | **6.2** Responsive pass, zero console errors *(mandatory)* · **6.3** compose integration |
| D42 | Wed 10-14 | **6.4** README sections · full stack over HTTPS end to end |
| D43 | Thu 10-15 | **6.5** Demo rehearsal against `AI_PLAN.md` §8, twice |

---

## Milestones

| When | What must be true |
|---|---|
| **Sep 6** | Service boots, DB scoped, tenant isolation provable |
| **Sep 13** | Phase 0 demonstrable end to end; realistic data seeded |
| **Sep 20** | ⭐ **LLM interface major complete** — the mandatory point is banked |
| **Sep 27** | Tenant-isolated RAG working with a real "I don't know" path |
| **Oct 4** | Member agent secure; advisory branch answering |
| **Oct 11** | ⭐ **All three modules complete** |
| **Oct 15** | Rehearsed demo on the deployed stack |

## Sent to teammates early, even though the work is late

- **Dahani:** `CheckIn` + `Feedback` models with indexes, read-only Postgres role, both JWT secrets
  — needed by **Sep 10 (D8)** or the seeder stalls.
- **DevOps:** reverse proxy `/ai/*` with **`proxy_buffering off`** — config in week 5, but send the
  buffering requirement now.

## If you fall behind

Cut in this order, and never out of order:

1. **6.6** learned-preference memory — already optional
2. **4.4** reranking — thresholding and rewriting carry most of the quality
3. **4.5** eval set — only if reranking is also cut
4. **5.x** sentiment (1 bonus point)
5. **4.x** Collection B and the advisory branch (2 bonus points)

**Never cut:** anything in phase 0, or phase 2. Phase 0 holds two graded criteria; phase 2 is the
only mandatory point you own, and losing it voids every bonus point you earned.
