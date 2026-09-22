# AI Layer — Technical Specification

**Companion to `AI_PLAN.md`.** The plan says what to build and in what order; this file says
exactly what it looks like. Anything the frontend or Dahani's backend depends on is defined here
and should not change without updating both sides.

*Last updated 2026-09-03. Owner: Oussama.*

---

## 1. Environment

`.env.example` (committed; `.env` is gitignored — both are mandatory subject requirements):

```bash
APP_ENV=development
LOG_LEVEL=info
PORT=8000
FRONTEND_URL=http://localhost:3000

# Gemini (paid tier) — confirm exact model IDs in AI Studio, don't guess them
GEMINI_API_KEY=
GEMINI_CHAT_MODEL=
GEMINI_EMBED_MODEL=
GEMINI_RERANK_MODEL=

# Dahani's Postgres — READ ONLY role, SELECT on named tables
GYM_DB_HOST=localhost
GYM_DB_PORT=5432
GYM_DB_NAME=ft_transcendence
GYM_DB_USER=ai_readonly
GYM_DB_PASSWORD=

# JWT verification — separate secret per role (getJwtConfig(role, type))
JWT_ADMIN_ACCESS_SECRET=
JWT_MEMBER_ACCESS_SECRET=

# Nest -> FastAPI internal calls
INTERNAL_API_KEY=

# Storage
SQLITE_PATH=/data/ai_state.db
CHROMA_PATH=/data/chroma

# Limits
RATE_LIMIT_CHAT_PER_MIN=20
RATE_LIMIT_DOCS_PER_MIN=10
MAX_MESSAGE_CHARS=2000
MAX_UPLOAD_MB=10
THREAD_TTL_DAYS=90
```

---

## 2. Data contracts

### 2.1 Read models — Dahani's Postgres

Read only. Columns actually used, so a startup check can verify exactly these (task 0.4).

| Table | Columns read |
|---|---|
| `users` | `id`, `first_name`, `last_name`, `company_name`, `role`, `email` |
| `members` | `id`, `admin_id`, `first_name`, `last_name`, `phone_number`, `email`, `gender`, `birth_date`, `account_status`, `created_at` |
| `memberships` | `id`, `admin_id`, `member_id`, `membership_plan_id`, `membership_plan_duration_id`, `membership_status`, `start_date`, `expires_at`, `created_at` |
| `membership_plans` | `id`, `admin_id`, `plan_name`, `description`, `weekly_visit_limit`, `is_active` |
| `membership_plan_durations` | `id`, `membership_plan_id`, `duration_days`, `price` |
| `payments` | `id`, `admin_id`, `member_id`, `amount`, `paid_at?`, `due_date?`, `payment_status` |
| `attendances` | `id`, `admin_id`, `member_id`, `membership_id`, `attendance_method`, `checked_in_at` |
| `staffs` | `id`, `admin_id`, `role`, `account_status` — read only to resolve a STAFF token's gym |
| `feedbacks` | `id`, `admin_id`, `member_id`, `content`, `rating`, `sentiment`, `sentiment_score`, `feedback_status`, `created_at` |

**`admin_id` is on only 5 of the 15 tables.** Scoping is therefore not one rule but four, and
`scope.py` must encode all of them:

| Kind | Tables | Scoped by |
|---|---|---|
| Direct | `members`, `memberships`, `membership_plans`, `payments` | `admin_id = :admin_id` |
| Transitive | `membership_plan_durations` | join `membership_plan_id` → `membership_plans.admin_id` |
| The tenant itself | `users` | `id = :admin_id` |
| Platform-level | `plans`, `plan_durations`, `subscriptions` | not gym-scoped; `subscriptions.user_id` *is* the admin |

`membership_plan_durations` is the leak risk — it looks harmless and has no `admin_id` to forget.

**Never grant access to:** `user_refresh_tokens`, `member_refresh_tokens`, `user_action_tokens`,
`member_action_tokens`, `staff_refresh_tokens`, `staff_action_tokens` (hashed credentials),
`members.password`, `staffs.password`, or **`visits.qr_token_hash`** -- that one opens a gym
door, so it belongs in the same category as a refresh token. The read-only role gets
`GRANT SELECT` on the 8 tables listed above and nothing else.

**Rules that override the schema:**

- Validity is `membership_status = 'ACTIVE'` **and** `expires_at > now`, and both halves matter.
  The date, because the status column is cron-maintained and a missed run leaves it saying ACTIVE
  after expiry. The status, because a *person* can end a membership before its date: a plan change
  supersedes the old one immediately (`members.service.ts:267`) while its `expires_at` stays weeks
  away, and deriving from the date alone reported two live memberships for anyone who ever changed
  plan. Dahani's own `validateActiveMembership` requires exactly this pair.
- `amount` and `price` are Postgres `NUMERIC`. Read as `Decimal`, never `float`.
- Every query passes through `db/scope.py`, which applies the correct scoping rule above. No raw
  SQL in a tool.
- **`members.phone_number` is not unique and must not be made unique** — families share numbers.
  `search_members` returns a list and never assumes a single match.

### 2.2 AI state — SQLite

```sql
threads(id TEXT PK, subject_id TEXT, role TEXT, admin_id TEXT,
        created_at REAL, last_used_at REAL)
-- `subject_id` is the verified JWT subject and is checked on every resume: a
-- thread_id arrives from the client, so without it, replaying a conversation is
-- "send any id and read what is in it".  No `title` column yet.

thread_messages(thread_id TEXT, seq INTEGER, role TEXT, payload TEXT,
                created_at REAL, PRIMARY KEY (thread_id, seq))
-- The transcript, written by this service.  NOT a LangGraph checkpointer:
-- langgraph-checkpoint-sqlite 2.0.10 cannot run against the checkpoint 4.2 that
-- langgraph 1.2 ships (AttributeError on every super-step).  A table is also the
-- better answer to "what does the assistant remember about me?".
-- `payload` is the LangChain serialisation, so tool calls and tool-call ids survive.

documents(id TEXT PK, admin_id TEXT, filename TEXT, mime TEXT,
          visibility TEXT CHECK(visibility IN ('staff','member')),
          chunk_count INT, bytes INT, created_at REAL)
-- Written BEFORE the Chroma chunks and deleted AFTER them, so a chunk never exists
-- without a row that lists it and can delete it.  No `uploaded_by`: only the owner
-- uploads, so it would always equal admin_id.

rate_limits(key TEXT, window_start TS, count INT, PRIMARY KEY(key, window_start))
```

`threads` is pruned after `THREAD_TTL_DAYS` (90 days — history must survive to the demo).

### 2.3 Chroma collections

| Collection | Scope | Metadata |
|---|---|---|
| `gym_docs` (A) | per-tenant | `admin_id`, `visibility`, `doc_id`, `source_name`, `chunk_index`; chunk id `doc_id:chunk_index` |
| `gym_business` (B) | shared | `doc_id`, `source_name`, `topic`, `kind`, `url`, `chunk_index`; loaded by the one-shot `ai-load` service from `corpus/business/docs` (151 documents, 3,261 chunks) |

**`gym_docs` is never queried without an `admin_id` filter.** The member agent additionally filters
`visibility = "member"`. Both filters go through one retrieval function — not composed at call sites.
Built: `store._readable_by(scope)` builds the filter (owner and staff: the whole gym, staff documents
included; member: `visibility = member` only), `store.search` is the only Chroma query in `app/`
(`verify.sh` greps for it), and `retrieve.retrieve(scope, question)` embeds the question and returns
the 20 nearest as `Hit(text, source_name, doc_id, chunk_index, distance)`. Chroma filters inside the
search, not after it, so a gym always gets its own top 20.

---

## 3. HTTP API

### 3.1 Authentication

| Surface | Header | Notes |
|---|---|---|
| `/ai/*` | `Authorization: Bearer <access token>` | Dahani's JWT, HS256. Try the ADMIN secret, then the MEMBER secret. **Never read the unverified `role` claim to choose the key.** |
| `/internal/*` | `X-API-Key: <INTERNAL_API_KEY>` | Constant-time comparison. |
| `/health` | none | |

Resolving tenant from the token:

- `role = ADMIN` → `admin_id = payload.id`
- `role = STAFF` → `staff_id = payload.id`, then look up `staffs.admin_id`. **Only an ACTIVE
  employee is admitted** — stricter than the member rule, where FROZEN is let through.
- `role = MEMBER` → `member_id = payload.id`, then look up `members.admin_id`
- `role = OWNER` → **rejected.** Platform operators are out of scope for the assistant.

### 3.2 `POST /ai/chat` — streaming chat

```jsonc
// request
{
  "message": "who hasn't come in three weeks and expires soon?",
  "thread_id": "b1f2…"   // omit on the first message; the server creates and returns one
}
// `thread_id` must be a UUID and must be one this caller owns.  Anything else is
// 404 `not_found` — the same answer as a thread that does not exist, because a 403
// would confirm the id belongs to somebody.  It is echoed back in `meta` unchanged.
```

Response is `text/event-stream`. Event sequence:

```
event: meta
data: {"thread_id":"b1f2…","route":"structured"}

event: tool
data: {"name":"list_inactive_members","status":"running"}

event: tool
data: {"name":"list_inactive_members","status":"done"}

event: token
data: {"text":"You have 14 members"}

event: sources
data: {"sources":[{"n":1,"doc_id":"d7","source_name":"refund-policy.pdf","chunk_index":2,"score":0.81}]}

event: done
data: {"finish_reason":"stop"}
```

- `meta` is always first; `route` is `structured` | `knowledge` | `advisory`.
- `tool` events exist so the UI can show activity instead of a dead spinner.
  `status` is `running` | `done` | `error` — a tool that failed still closes its own
  event, or the UI leaves a spinner turning forever.
- `done`'s `finish_reason` is `stop` | `max_tool_rounds`. The second means the agent
  spent its `AGENT_MAX_TOOL_ROUNDS` budget and answered with what it had; the UI says
  so rather than presenting a partial answer as complete.
- `sources` is emitted only for `knowledge` and `advisory`, and lists only the excerpts the
  answer actually cites: `n` is the `[n]` in the text, `score` is `1 - distance`. A cited
  number that was never given to the model is dropped. A grouped citation (`[1, 5]`) counts
  for both. Collection B sources also carry `url`, the original to read; the panel shows
  them as links (https only).
- **The router (D24):** the endpoint makes one structured-output call (`{route}`) before the
  stream. `structured` → the tool agent (unchanged). `knowledge` → `retrieve()`; if nothing is
  within the threshold the reply is a fixed "That isn't in your gym's documents." in the
  question's language, **with no model call**; otherwise the model answers from the top 5
  excerpts only. `advisory` (D31, owner and staff; a member is always sent to `structured`)
  → the tool agent **plus one more tool**, `search_industry_knowledge`, and an advice section
  in the system prompt: this gym's numbers first, then industry excerpts, cited `[n]`. The
  router picks the branch; retrieval inside the branch is a tool, because the model is the
  one that knows which numbers it found and what to look up next. A failed routing call
  falls back to `structured`.
- Every response carries the rate-limit headers, including this one. FastAPI does not
  merge them onto a `Response` the endpoint returns itself, so the route re-attaches
  them explicitly (`carry_rate_headers`).
- On failure, an `error` event is sent and the stream closes — the HTTP status is already 200 by
  then, so **the frontend must handle errors from the event stream, not just from status codes.**

Validation: `message` is 1–`MAX_MESSAGE_CHARS`, trimmed, non-empty. Enforced in the frontend *and*
here — the subject requires both.

### 3.3 Documents (admin only)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/ai/documents` | multipart: `file`, `visibility` (`staff`\|`member`). Returns `{doc_id, filename, chunk_count}` |
| `GET` | `/ai/documents` | List for this `admin_id` |
| `DELETE` | `/ai/documents/{doc_id}` | Removes the row and all its chunks from Chroma |

Accepted types: **PDF, TXT, Markdown** (`pypdf` only — no DOCX, to avoid another parser).
The type is decided by the bytes (`%PDF-`), not the name. Markdown front matter is dropped.
Owner only: a member or staff token gets `403`. `POST` is rate-limited (`docs` bucket).

| Status | When |
|---|---|
| `201` | `{doc_id, filename, chunk_count}` |
| `400` | no `file`, more than one file, or `visibility` not `staff`/`member` |
| `411` / `413` | no `Content-Length` / over `MAX_UPLOAD_MB` -- checked before the body is read |
| `415` | not PDF, TXT or Markdown |
| `422` | no text to index: scanned or encrypted PDF, damaged file, not UTF-8, empty |
| `502` | Gemini failed; nothing was stored |
| `204` / `404` | `DELETE` done / no such document **in this gym** (another gym's id is 404, not 403) |

Every refusal happens before the Gemini call.

### 3.4 `POST /internal/sentiment`

```jsonc
// request                                  // response
{ "feedback_id": "f_123",                   { "feedback_id": "f_123",
  "content": "The new coach is great…" }      "sentiment": "POSITIVE",
                                              "score": 0.87 }
```

`sentiment` is exactly his `SentimentType` enum: `POSITIVE` | `NEUTRAL` | `NEGATIVE` (uppercase, so
he stores it as returned; mixed feedback is `NEUTRAL`, as the seeded rows are). `score` is 0–1
confidence with **two decimals** -- his column is `DECIMAL(3,2)`. Dahani calls this on feedback
creation and stores the result — the AI service never writes to his tables.

**Open, to agree with Dahani before 5.2 (D37):** the backlog (feedback left unscored while this
service was down, 50 rows in the seeded data) cannot be written by a batch job *here* -- the role is
read-only. Proposed: a periodic job on his side sends unscored rows to this endpoint and stores
what comes back, so the write stays his. The AI side of 5.2 is then batching and backoff towards
Gemini.

### 3.5 `GET /health`

`{"status":"ok","db":"ok","chroma":"ok","version":"…"}` — 200 if all dependencies respond, 503 otherwise.

### 3.6 Errors

Every non-stream error returns:

```jsonc
{ "error": { "code": "rate_limited", "message": "Too many requests. Try again in 12s." } }
```

| Code | HTTP | When |
|---|---|---|
| `invalid_request` | 400 | Validation failure |
| `unauthorized` | 401 | Missing/invalid/expired token |
| `forbidden` | 403 | Valid token, wrong role |
| `not_found` | 404 | Unknown `doc_id` or `thread_id` |
| `payload_too_large` | 413 | Upload over the limit |
| `rate_limited` | 429 | Includes `Retry-After` |
| `upstream_error` | 502 | Gemini failed or timed out |
| `internal_error` | 500 | Everything else — never leaks a stack trace |

### 3.7 Rate limiting

Hand-written sliding window, keyed by JWT subject (`sub`/`id`), stored in SQLite. Not a library —
it is a graded criterion and has to be explainable.

- `/ai/chat`: `RATE_LIMIT_CHAT_PER_MIN` per user
- `/ai/documents`: `RATE_LIMIT_DOCS_PER_MIN` per user
- `/internal/*`: exempt

Every response carries `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
**A 429 must be demonstrable on demand** — it is on the evaluator's checklist.

### 3.8 Endpoints not in the tables above

Written down in D18, after existing undocumented since week 1.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/ai/me` | member/admin | Identity probe: `{role, gym, member_name}`. **No ids** — a tenant key echoed to a browser ends up in a query string or a bug report. Not rate limited. |
| `GET` | `/internal/ping` | API key | Dahani's key check. |
| `GET` | `/internal/boom` | API key | Raises on purpose, to exercise the 500 path. **Development only.** |
| `GET` | `/ai/rate-probe` | member/admin | Spends the `chat` bucket without calling Gemini. **Development only.** |
| `GET` | `/ai/rate-probe-docs` | member/admin | Same, for the `docs` bucket. **Development only.** |

The two probes are how the rate limiter is tested: `check_ratelimit.py` fires forty
parallel requests and restarts the container, and pointing that at `/ai/chat` would
make the limiter's own suite paid, networked and slow. They share the bucket with
`/ai/chat` rather than shadowing it, and `check_chat.py` exhausts the budget through
the probe and then asserts `/ai/chat` answers 429 without ever reaching Gemini.

### 3.9 Conversations

| Method | Path | Notes |
|---|---|---|
| `GET` | `/ai/threads` | This caller's recent conversations, newest first: `{thread_id, last_used_at, messages, opening}`. `opening` is the first question asked, so a list reads as subjects rather than UUIDs. Threads with no stored messages are omitted. |
| `GET` | `/ai/threads/{thread_id}` | One transcript, **already flattened into the shape the panel renders**: `[{author: "user"\|"assistant", text, tools: [name], sources: [...]}]`. `tool` rows are dropped — their content is raw JSON, useful to neither a person nor an API — and the tools that ran are attached to the answer they produced. `sources` is what the `sources` event sent for that answer (saved in its `response_metadata`, which Gemini never reads back), so a reload redraws the chips. |

Both filter on the verified JWT subject **in the query**, and both answer `404` for a
thread that is not the caller's — the same answer as one that does not exist. Reading
a transcript deliberately does **not** renew `last_used_at`: a read is not a use, and
a tab left open must not keep a dead conversation alive past its TTL.

They exist because without them a page reload loses the conversation while the server
still holds it — the assistant remembers and the screen does not, which reads as a bug
in the memory rather than in the UI.

---

## 4. Agent tools

Every tool receives `admin_id` from the verified token via `scope.py`. **No tool accepts a tenant
or member identifier as a model-supplied argument.** This is what makes prompt injection
unexpressible rather than merely discouraged.

### 4.1 Admin tools

Also the **staff** registry, minus `get_revenue` and `list_plans`; and `get_gym_overview` arrives without its
revenue figure, because `reports.gym_overview` omits the subquery for a staff scope. The rule is
*mirror Dahani's API*: his staff controllers cover members, memberships, payments, attendance and
visits, and nothing covers pricing, staff management or the gym's own subscription. Pricing
(`membership_plan_durations`) is refused to a staff scope by the schema contract itself.


| Tool | Parameters | Returns |
|---|---|---|
| `get_gym_overview` | — | active members, expiring in 7/30d, revenue MTD, check-ins today |
| `search_members` | `query`, `limit=10` | matches on name or phone |
| `get_member_detail` | `member_id` | membership, payment history, attendance summary |
| `list_expiring_memberships` | `within_days=7`, `limit=25` | `total` + the first `limit`, with name and phone |
| `list_inactive_members` | `days_since_last_checkin=21`, `limit=25` | `total` + the first `limit` -- the churn question |
| `get_revenue` | `period` (`month`\|`last_month`\|`year`\|`all_time`), `group_by` (`month`\|`plan`) | totals in MAD (owner only) |
| `get_attendance_stats` | `period` (`week`\|`month`\|`last_month`\|`year`), `group_by` (`weekday`\|`hour`\|`month`) | totals over the period; by weekday also day names and the average per day |
| `list_recent_feedback` | `limit=20` (over 50 is lowered to 50), `sentiment?` | `total` + the newest `limit`: comment (fenced), sentiment, author's name (one line) |
| `get_member_stats` | — | members registered, joined this/last month, women/men, average age |
| `list_plans` | — | plans, lengths and prices in MAD (owner only) |
| `search_industry_knowledge` | `query` (English, industry words) | up to 5 Collection B excerpts, at most 2 per document, within `RAG_MAX_DISTANCE`, fenced and numbered `[n]` (advisory route only, never a member) |

A list tool always returns the real `total` next to the rows it shows: the 2026-09-21 chat
evaluation caught the model reporting a page of 25 as "there are 25" when 38 had stopped coming.

### 4.2 Member tools

`member_id` comes from the token in all three.

| Tool | Parameters | Returns |
|---|---|---|
| `get_my_membership` | — | plan, start, expiry, days remaining (the live membership, not a superseded one) |
| `get_my_payments` | `limit=10` | own payments only |
| `get_my_attendance` | `period` (`week`\|`month`\|`last_month`\|`year`) | own check-in count, visits per named weekday, last visit |

Every tool's arguments refuse fields they do not declare, and a tool with none refuses any
(D28): a forged `member_id` or `admin_id` is an error the model sees, never silently dropped --
dropping it would return the caller's own rows, which the model could present as someone else's.

These mirror Dahani's member API (`/api/members/memberships`, `/api/members/payments`, visits).
His API has **no member route to plans or prices**, so the price table is `DENIED` to a member
scope in the schema contract. A member's price question is routed to the documents instead: the
gym publishes its price list to members there (`choose_route(..., member=True)`).

---

## 5. RAG parameters

| Parameter | Value | Note |
|---|---|---|
| Chunk size | at most 1000 chars | One chunk per Markdown section when it fits; longer sections split on sentences (table/list rows). Every chunk starts with its heading |
| Overlap | 150 chars | Whole sentences, inside a long section only |
| Retrieve | top 20 | Before reranking |
| Rerank to | top 5 | LLM-based, phase 4 |
| Distance threshold | **0.33** (`RAG_MAX_DISTANCE`), measured in D22, re-measured on 31 questions | Above it → "that isn't in your documents". 23/25 answerable answered, 6/6 no-answer refused; right and wrong overlap at ~0.33, so reranking (phase 4) is the next lever |
| Embeddings | Gemini | No PyTorch anywhere in the image |

Query rewriting runs before embedding and does two jobs: resolve follow-ups against thread history,
and translate the question into the corpus language so Arabic and French questions retrieve from an
English corpus. Built (D23): `retrieve.rewrite_query(question, history)`, one structured-output call
to the chat model (`{query: str}`), given the last 6 user/assistant turns as text -- never tool
results, which can hold member-written text. Skipped for an English question with no history. On
failure it searches the original words. It cannot widen access: the filter comes from the Scope.

Eval set: `eval/retrieval_set.csv` — `gym, role, question, expected_source, expected_section, language`.
A file and section instead of a `doc_id`, because a `doc_id` is a new UUID on every upload; an empty
`expected_source` means the answer is not in the corpus. 15 rows today (D22), 30–50 by D34.
`eval/run_eval.py` prints each question's rank and distance, recall@5, and what the threshold keeps.

---

## 6. Frontend

Assisted mode. Components live in the team's Next.js app and use their layout, auth context and
design system.

| Component | Responsibility |
|---|---|
| `AssistantPanel` | Root. Owns thread state and the SSE connection. **One panel for all three roles** (D27): the role comes from `GET /ai/me`, never a prop, and sets the suggestions (tappable), the input's placeholder, the header label and the Documents link (owner only). The server decides what each role may do; the screen only stops suggesting what it cannot. |
| `ChatMessageList` | History; auto-scroll unless the user has scrolled up |
| `StreamingMessage` | Renders `token` events progressively; markdown |
| `ToolActivity` | Renders `tool` events — "checking memberships…" |
| `SourceList` | Renders `sources` as `[n] file` chips under the answer (inline in `StreamingMessage`); an industry source with a `url` is a link |
| `ChatInput` | Validation, Enter to send, disabled while streaming |
| `DocumentManager` | Upload, list, delete, visibility toggle (admin only) |
| `SentimentPanel` | Feedback list + trend over time (admin only) |

Required states: `idle`, `streaming`, `error`, `rate_limited` (show `Retry-After`), `empty`.

Non-negotiable, because they are mandatory subject requirements:

- **Zero console errors or warnings.**
- **Responsive** — the chat has to work on a phone.
- Inputs validated here *and* server-side.

---

## 7. Decisions made — change these if you disagree

1. **PDF, TXT and Markdown only** for uploads. DOCX would add another parser for little gain.
2. **Rate limits: 20 chat / 10 upload per minute per user.** Generous enough not to annoy, low
   enough to demo a 429 on demand.
3. **The server creates `thread_id`** on the first message and returns it in `meta`; the client
   sends it back thereafter.
4. **`OWNER` role is rejected** by the assistant — platform operators aren't a gym audience.
5. **Thread history is pruned after 90 days** — long enough that seeded and demo conversations survive to evaluation.
6. **`sources` is not emitted for structured questions**, since SQL answers have no documents to cite.
