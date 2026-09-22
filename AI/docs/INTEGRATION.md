# How the AI service plugs into the rest of the project

*For the team. Written 2026-09-16 by Oussama. If you only read one section, read §2 and §7.*

---

## 1. The picture

```
                         ┌─────────────────────────────────────┐
   browser ──HTTPS──────▶│  reverse proxy (devops)             │
                         │   /api/*  ──────▶ NestJS   :3000    │
                         │   /ai/*   ──────▶ FastAPI  :8000    │  proxy_buffering off
                         └─────────────────────────────────────┘
                                   │                  │
                                   │ writes           │ reads only, as `ai_readonly`
                                   ▼                  ▼
                         ┌─────────────────────────────────────┐
                         │        Postgres (one database)      │
                         └─────────────────────────────────────┘
                                   ▲
              NestJS ──────────────┘  POST /internal/sentiment  (X-API-Key)
              writes the score it gets back

   FastAPI also owns, and nobody else touches, one volume (ai_state, at /data):
     SQLite  — conversations, rate-limit counters, document metadata
     Chroma  — document embeddings: each gym's documents + the shared industry corpus
```

**One sentence:** the AI service is a separate container that reads the same database
read-only, authenticates with the same JWTs Nest already issues, and streams answers straight
to the browser.

## 2. Who owns what

| Thing | Owner | Notes |
|---|---|---|
| Everything under `AI/` | Oussama | Nobody else edits it |
| `frontend/src/{app,components,lib}/assistant/` | Oussama | Only new files; no existing file is modified |
| Everything else in `frontend/` | frontend team | |
| Everything in `backend/` | Dahani | **The AI service has never written a line of it** |
| The database schema and all writes to it | Dahani | *He writes, I read* |
| Reverse proxy, compose, HTTPS | devops | §7 has the two lines that matter |

**"He writes, I read" is the rule the whole design hangs from.** The AI never inserts, updates
or deletes anything in the gym database. When something has to be written — a sentiment score —
Nest does the writing, over HTTP. That means no AI bug can corrupt gym data, which is also why
the AI can be given a large amount of read access without anyone having to trust it much.

## 3. The data: what the AI reads, and what it physically cannot

It reads **8 tables**, and only the columns it actually uses:

| Table | Columns used | What it answers |
|---|---|---|
| `users` | `id`, `first_name`, `last_name`, `company_name`, `role`, `email` | Which gym is asking; the gym's name in the answer |
| `members` | `id`, `admin_id`, names, `phone_number`, `email`, `gender`, `birth_date`, `account_status`, `created_at` | Member search, member detail, sign-up trends |
| `memberships` | `id`, `admin_id`, `member_id`, plan + duration ids, `membership_status`, `start_date`, `expires_at`, `created_at` | Who is valid, who expires this week, lapses and returns |
| `membership_plans` | `id`, `admin_id`, `plan_name`, `description`, `weekly_visit_limit`, `is_active` | The catalogue, so "the annual one" resolves to a real plan; the weekly limit answers "how many sessions do I have left?" |
| `membership_plan_durations` | `id`, `membership_plan_id`, `duration_days`, `price` | Prices |
| `payments` | `id`, `admin_id`, `member_id`, `amount`, `paid_at?`, `due_date?`, `payment_status` | Revenue |
| `attendances` | `id`, `admin_id`, `member_id`, `membership_id`, `attendance_method`, `checked_in_at` | Attendance, peak hours, who stopped coming |
| `staffs` | `id`, `admin_id`, `role`, `account_status` | Resolving a staff token to its gym, and checking the employee is still active |
| `feedbacks` | `id`, `admin_id`, `member_id`, `content`, `rating`, `sentiment`, `sentiment_score`, `feedback_status`, `created_at` | Feedback list, open complaints, sentiment trend |

**It cannot read anything else — the database itself refuses:**

- `members.password` — the grant on `members` is column-level, and that column is not in it.
- `user_refresh_tokens`, `member_refresh_tokens`, `user_action_tokens`, `member_action_tokens` — no grant at all. These hold credential material; an AI service has no business being able to read them even by accident.
- `plans`, `plan_durations`, `subscriptions`, the notification tables — not granted. They are platform-level, not gym-level.

This is not a policy in the Python code. It is `GRANT SELECT` in Postgres
(`AI/seeder/roles/ai_readonly.sql`), so it holds even if the AI code is wrong, and it holds
against anything a language model could ever be talked into asking for.

### Tenancy: how one gym never sees another's data

There is no `Gym` table. **A gym is a `User` with `role = ADMIN`, and its `id` is the `admin_id`
every other row carries.** Every query the AI makes is narrowed by that id, taken from the
verified JWT and never from anything the model or the user typed.

`admin_id` is on only 5 of the 15 tables, so there are three different narrowing rules, all
declared in one file (`AI/app/db/schema.py`) and applied in one place (`AI/app/db/scope.py`):

| Rule | Tables | Narrowed by |
|---|---|---|
| direct | `members`, `memberships`, `membership_plans`, `payments`, `attendances`, `feedbacks` | `admin_id = <from the token>` |
| through a parent | `membership_plan_durations` (it has no `admin_id`) | its plan's `admin_id` |
| the tenant itself | `users` | `id = <from the token>` |

For a member's own chat, a second narrowing is applied on top: their own rows only.

### Three audiences, and what separates them

| | Owner | Staff | Member |
|---|---|---|---|
| The gym's members, memberships, attendance, feedback | ✅ | ✅ | own rows only |
| A member's payment history | ✅ | ✅ | own rows only |
| **Revenue and totals** | ✅ | ❌ | ❌ |
| **Plan prices** | ✅ | ❌ | ✅ (their gym's price list) |

The staff column is not a judgement call: it is read from Dahani's own controllers. He gives
staff the admin's routes for members, memberships, payments, attendance and visits, and gives
them no route at all for `/api/membership-plans`, `/api/admins/staffs` or the gym's subscription.
The assistant mirrors that, so a divergence is a bug rather than an opinion.

**If that boundary should move, it moves in the API first** — otherwise the assistant is stricter
than the app, and someone will notice they can see a number in the UI that the assistant refuses.

## 4. Auth: the AI service adds no new login

There is no separate account, no separate password, no second session. The browser sends the
**same access token Nest issued at login**, as `Authorization: Bearer <token>`.

- The AI service holds Dahani's three ACCESS secrets (ADMIN, STAFF, MEMBER) and verifies the signature itself. It refuses to boot if any two of them are equal.
- It does **not** hold the OWNER secret or any refresh secret. Platform-owner tokens therefore fail, by construction rather than by an `if`.
- After the signature verifies, it re-reads the account from the database to resolve the gym and to check the account is still allowed in — so a ban takes effect on the assistant immediately, not when the token expires.

**Two constraints this puts on the rest of the team:**

1. **The access token must stay in the JSON login response.** If it moves into an httpOnly
   cookie, the browser can no longer send it to a different service and streaming breaks.
2. **The three ACCESS secrets must be identical** in `backend/.env` and `AI/.env`, byte for byte,
   in every environment. If they drift, every request is a 401 with no other symptom.

## 5. The HTTP surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/ai/chat` | Bearer | The assistant. Streams the answer as Server-Sent Events |
| `GET` | `/ai/me` | Bearer | Identity probe: role, gym name, member name. Returns no ids |
| `GET` | `/ai/threads` | Bearer | The caller's past conversations |
| `GET` | `/ai/threads/{id}` | Bearer | One transcript, for redrawing after a page reload |
| `POST` | `/internal/sentiment` | `X-API-Key` | **Dahani calls this**, on feedback creation |
| `GET` | `/health` | none | 200 when it can serve, 503 when the database is unreachable |

Documents (`POST/GET/DELETE /ai/documents`) arrive in phase 3.

Errors are always the same shape, on every endpoint:

```json
{ "error": { "code": "rate_limited", "message": "Too many requests. Try again in 12s." } }
```

`/ai/chat` is the exception worth knowing about: because it streams, the HTTP status is already
`200` by the time the model can fail, so **failures arrive as an `error` event inside the
stream**. The frontend has to handle both.

Rate limits: 20 chat requests per minute per user, and every response carries
`X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`, plus `Retry-After` on a 429.

## 6. Running it locally

From `AI/`:

```bash
colima start                       # if docker is not running
docker compose up -d               # Postgres + the AI service
./scripts/verify.sh                # 624 checks; run after any change
```

`docker-compose.yml` here owns the Postgres container for development, so Dahani's
`npx prisma migrate deploy` and this service talk to the same database. `AI/.env` must match
`backend/.env` on the database name, user and password — `AI/.env.example` says so at the top.

To see anything interesting you also need data: `AI/README` aside, the seeder builds 4 gyms,
~1,100 members, 2,480 memberships and payments, 37,000 check-ins and 282 feedback comments in
about two seconds. The commands are in `CLAUDE.md` under "reset the database completely".

**To see the read-only boundary for yourself**, connect as the AI's own role and try to misbehave:

```bash
PGPASSWORD=<AI_DB_PASSWORD from AI/.env> psql -h 127.0.0.1 -U ai_readonly -d ft_transcendence
```

```sql
SELECT count(*) FROM members;                  -- works
SELECT * FROM members LIMIT 1;                 -- ERROR: permission denied (no grant on `password`)
SELECT password FROM members LIMIT 1;          -- ERROR: permission denied
SELECT * FROM user_refresh_tokens LIMIT 1;     -- ERROR: permission denied
UPDATE members SET first_name = 'x';           -- ERROR: permission denied
INSERT INTO attendances (id) VALUES ('x');     -- ERROR: permission denied
SELECT qr_token_hash FROM visits LIMIT 1;      -- ERROR: permission denied (opens a door)
```

That `SELECT *` failing is not a bug; it is the column grant working. A table-level `GRANT`
cannot be narrowed afterwards, so `members` and `users` are granted column by column.

## 7. What I need from each of you

### Dahani

1. ~~The `CheckIn` and `Feedback` models~~ -- delivered 2026-09-20 (as `attendances` and `feedbacks`).
2. `Payment.membershipId` (nullable), so "revenue by plan" is a join rather than a guess.
3. On feedback creation, call `POST /internal/sentiment` and store what comes back: `sentiment` is already your `SentimentType` value (`POSITIVE`/`NEUTRAL`/`NEGATIVE`) and `score` has two decimals for `DECIMAL(3,2)`. It must not block or fail feedback creation if my service is down: store the feedback unscored. **To agree:** my service cannot write your tables, so the unscored ones need a periodic job on your side that sends them to the same endpoint and stores the result (proposed in `AI_SPECS.md` §3.4).
4. The three ACCESS secrets (admin, member, staff) for staging and production (not the dev ones — I have those).
5. Answers to the two questions in `BACKEND_FINDINGS_DAHANI.md`, which decide what `payment_status` and a superseded membership actually mean.
6. Keep the access token in the JSON login response.

### Frontend

1. A mount point for `<AssistantPanel />` inside your layout and auth context. Today it lives at the route `/assistant` with a dev token box; when your auth context lands, that route goes away and one file changes (`src/lib/assistant/session.ts`).
2. How the access token is held client-side, so that file can read it.
3. Your design-system components, so the chat stops looking foreign.

I add only new files under `src/app/assistant/`, `src/components/assistant/` and
`src/lib/assistant/`. I have not modified `layout.tsx`, `page.tsx` or `globals.css`, so this
merges as a fast-forward rather than a conflict in your shell.

### DevOps

1. Route `/ai/*` to the AI container over HTTPS.
2. **`proxy_buffering off;` on that route** (or the Caddy equivalent). nginx buffers proxied
   responses by default, which silently collapses a token-by-token stream into one block at the
   end — and streaming is a graded criterion. Also raise `proxy_read_timeout` above the longest
   answer.
3. Two services from `AI/docker-compose.yml` in the single `docker compose up`, both with its
   `.env` and the one named volume `ai_state` at `/data`:
   - `ai-load` -- one-shot: loads the industry corpus (shipped in the image) into Chroma, then
     exits. ~2 min on a fresh volume, ~2 s after that. It always exits 0.
   - `ai` -- the server, with `depends_on: ai-load: condition: service_completed_successfully`.
     Keep that condition: Chroma must never be written by two processes at once.
4. Postgres reachable from the AI container, and the `ai_readonly` role created there —
   `AI/seeder/roles/ai_readonly.sql`, run once as a superuser.

## 8. How the branches come together

- `ai-work` was branched from `origin/backend`, so Dahani's history is already underneath mine. Merging back is a normal merge, not a rebase war.
- `AI/` is a directory nobody else touches, so it cannot conflict.
- `backend/` is untouched by me — `git status` is clean there. `attendances` and `feedbacks` ran locally as a shadow SQL file until Dahani shipped his own migrations on 2026-09-20; that file is now deleted and his migrations are the only source. I deliberately never added a second Prisma migration for the same tables, which is why the handover was a delete rather than a merge conflict.
- In `frontend/`, only new files.

The one file that will need a real conversation is the **root `docker-compose.yml`** when the
whole stack becomes one command: it needs the two AI services (`ai-load`, then `ai`), their
volume, and their env file alongside everyone else's. That is a devops task, and everything it needs is already in
`AI/docker-compose.yml`.

## 9. If you have five minutes to explain it

1. It is a **separate Python service**, so it can go down without taking the app with it.
2. It **reads the same database read-only**, as a Postgres role that can only `SELECT` 8 tables and cannot see passwords or token tables. Writes go back through Nest over HTTP. *He writes, I read.*
3. It uses the **same login**. The browser sends the token Nest already issued, and the service verifies the signature and re-checks the account on every request.
4. **Every query is narrowed to one gym**, using the id inside the verified token — never anything the user or the model typed. That is why a prompt like "show me the other gym's revenue" has no query it could even turn into.
5. The browser **streams the answer** straight from the AI service, token by token, which is why the proxy must not buffer.
