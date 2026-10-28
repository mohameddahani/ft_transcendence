# AI assistant: run it and test it

The AI service adds a chat assistant to the gym app. It covers three kinds of users:

- **Owner:** members, memberships, check-ins, feedback, revenue, and the gym's documents.
- **Staff:** the same as the owner, without revenue.
- **Member:** their own membership, payments and visits, and the gym's member documents.

It also classifies member feedback (positive / neutral / negative) for the backend.

It is a Python (FastAPI) service that reads the backend's Postgres database with a **read-only**
user, uses Gemini for answers and embeddings, and streams answers to the page as they are written.

---

## What you need

- **Docker** with Docker Compose (on macOS with colima: `colima start` first)
- **Node.js 20+**, for the backend migrations
- **Python 3.11 or newer**, only to create the demo data
- a **Gemini API key** (https://aistudio.google.com/apikey)

## 1. Configure (once)

```bash
cd AI
cp .env.example .env
```

Fill in `.env`:

| Variable | What to put |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | the local database account (the same as in `backend/.env`'s `DATABASE_URL`) |
| `AI_DB_PASSWORD` | any password for the read-only user, **also** written in `AI_DATABASE_URL` |
| `JWT_*_ACCESS_SECRET` | **exactly** the same three values as in `backend/.env` |
| `INTERNAL_API_KEY` | a random string, shared with the backend: `openssl rand -hex 32` |
| `GEMINI_API_KEY` | your Gemini key |
| `FRONTEND_URL` | the address of the chat page, `http://localhost:3000` by default |

## 2. Start the database and the service

```bash
cd AI
docker compose up -d --build
curl localhost:8000/health          # {"status":"ok"}, or "database unreachable" until step 3 has run once
```

The team's `devops/docker-compose.yml` also uses port 5432, so run one of the two at a time.

## 3. Create the demo data (first time, or to start over)

This creates 4 gyms with about 1,100 members, their history, check-ins, feedback, and 4 documents
per gym.

```bash
cd AI
docker compose down -v && docker compose up -d             # empty database (also clears the AI's memory and documents)
(cd ../backend && npm install && npx prisma migrate deploy) # the backend's tables
set -a; source .env; set +a                                 # load .env into this terminal
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ai_password="$AI_DB_PASSWORD" < seeder/roles/ai_readonly.sql
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < seeder/fixtures/atlas_gym.sql
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < seeder/fixtures/oasis_gym.sql
python3 -m venv .venv && .venv/bin/pip install asyncpg     # first time only
.venv/bin/python -m seeder.seed
docker compose restart ai
./scripts/load_docs.sh                                      # the 16 gym documents
```

**The demo gyms:** `atlas` (Atlas Fitness Agadir), `oasis` (Oasis Gym Marrakech), `titan` (Titan
Fitness Casablanca), `medina` (Medina Wellness Fes).

**Members with a known state** (dates are relative to the day the data was loaded):

| Email | Username | Gym | State |
|---|---|---|---|
| `omar@gmail.com` | `omar_t` | Atlas | membership expired 30 days ago, payment unpaid |
| `siham@gmail.com` | `siham_i` | Atlas | expires in 5 days |
| `youssef@gmail.com` | `youssef_a` | Atlas | expires in 20 days |
| `rachid@gmail.com`, `latifa@gmail.com` | `rachid_o`, `latifa_s` | Oasis | active |

**Demo logins** (for the app's login pages; demo data only). The password for all of them is
**`Demo1234!`**: owners log in with their email, staff and members with their username.
Every demo member has the same password, so the members above are good ones to try.

| Gym | Owner (email) | Staff (username) |
|---|---|---|
| Atlas | `karim@atlasfitness.ma` | `reception.atl` (`ex.reception.atl` is banned) |
| Oasis | `nadia@oasisgym.ma` | `reception.oas` (`ex.reception.oas` is banned) |
| Titan | `mehdi@titanfitness.ma` | `reception.tit` (`ex.reception.tit` is banned) |
| Medina | `salma@medinawellness.ma` | `reception.med` (`ex.reception.med` is banned) |

Demo data created before these logins existed has no working password: run
`.venv/bin/python -m seeder.seed` again (no reset needed).

## 4. Get a login token

Until the chat page is connected to the app's login, you can create a token for any demo user.
The tokens are signed exactly like the backend's and last **15 minutes**.

```bash
cd AI
docker compose exec -T ai python - admin atlas < scripts/mint_token.py            # an owner
docker compose exec -T ai python - staff atlas < scripts/mint_token.py            # a staff member
docker compose exec -T ai python - staff atlas BANNED < scripts/mint_token.py     # a banned one (refused)
docker compose exec -T ai python - member omar@gmail.com < scripts/mint_token.py  # a member
```

## 5. Test the AI service (curl)

The chat page is built by the frontend teammate. Until then, test everything with curl.
Tokens last **15 minutes** — make a new one when they expire.

```bash
cd AI
```

**As the Atlas owner:**

```bash
TOKEN=$(docker compose exec -T ai python - admin atlas < scripts/mint_token.py)

# who am I?
curl localhost:8000/ai/me -H "Authorization: Bearer $TOKEN"

# ask a question (streamed: events appear as they arrive)
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"question": "How is the gym doing today?"}'
# → events: start {thread_id}, tool gym_overview, token ..., done

# follow-up in the same conversation (copy the thread_id from the start event above)
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "And who expires in the next 30 days?", "thread_id": "<paste thread_id>"}'

# revenue (owner only)
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"question": "How much did we make last month?"}'

# document question (RAG) → answer cites the source file
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "How many days notice do members need to cancel?"}'
# → 30 days, from membership-terms.md (Oasis: 45, Titan: 30, Medina: 15)

# documents: list, upload, ask about it, delete
curl localhost:8000/ai/documents -H "Authorization: Bearer $TOKEN"
echo "Towels can be rented at reception for 10 MAD per session." > /tmp/towels.md
curl -X POST localhost:8000/ai/documents -H "Authorization: Bearer $TOKEN" \
     -F "file=@/tmp/towels.md" -F "visibility=member"
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"question": "Can I rent a towel?"}'
# → 10 MAD, from towels.md
curl -X DELETE localhost:8000/ai/documents/towels.md -H "Authorization: Bearer $TOKEN"
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"question": "Can I rent a towel?"}'
# → "not in the gym's documents"
```

**As Atlas staff:**

```bash
TOKEN=$(docker compose exec -T ai python - staff atlas < scripts/mint_token.py)

# staff cannot see revenue
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"question": "How much money did we make?"}'
# → refused: no access to revenue

# staff can see staff documents
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "What discount can I give at reception?"}'
# → 15% at Atlas (Oasis 10%, Titan 20%, Medina 5%)
```

**As a member:**

```bash
TOKEN=$(docker compose exec -T ai python - member omar@gmail.com < scripts/mint_token.py)

curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"question": "When does my membership end?"}'

curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" -d '{"question": "Do I have any unpaid payments?"}'

# member can see member documents
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "What are the opening hours on Sunday?"}'
# → 08:00 to 20:00 at Atlas

# member CANNOT see staff documents
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "What discount can reception give me?"}'
# → "not in the gym's documents"

# member CANNOT see other members
curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "What is Siham phone number?"}'
# → refused: can only see your own data
```

**In other languages:**

```bash
TOKEN=$(docker compose exec -T ai python - admin atlas < scripts/mint_token.py)

curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "Combien de jours de préavis pour résilier ?"}'

curl -N -X POST localhost:8000/ai/chat -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"question": "wach nqder njib m3aya chi sa7bi?"}'
```

**Sentiment (called by the backend, not by users):**

```bash
set -a; source .env; set +a
curl -X POST localhost:8000/internal/sentiment -H "X-API-Key: $INTERNAL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"text": "Great coaches, but far too crowded after work."}'
# → {"sentiment": "NEGATIVE", "score": 0.65}

# without the key → 401
curl -X POST localhost:8000/internal/sentiment \
     -H "Content-Type: application/json" -d '{"text": "hello"}'
```

**Rate limit:** send more than 20 questions in a minute → `429` with a `Retry-After` header.

## 6. Check an answer against the database

The demo data is generated relative to today, so the numbers change from day to day. To check one:

```bash
cd AI
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

```sql
-- memberships of Atlas that end in the next 7 days
SELECT count(*) FROM memberships ms JOIN users u ON u.id = ms.admin_id
WHERE u.company_name = 'Atlas Fitness Agadir'
  AND ms.membership_status = 'ACTIVE' AND ms.expires_at > now() AND ms.expires_at <= now() + interval '7 days';

-- Atlas revenue this month (memberships sold)
SELECT sum(d.price) FROM memberships ms
JOIN membership_plan_durations d ON d.id = ms.membership_plan_duration_id
JOIN users u ON u.id = ms.admin_id
WHERE u.company_name = 'Atlas Fitness Agadir' AND ms.start_date >= date_trunc('month', now());
```

## 7. When something doesn't work

| Symptom | Fix |
|---|---|
| "Invalid or expired token" | tokens last 15 minutes: make a new one |
| every login fails | the `JWT_*_ACCESS_SECRET` values differ from `backend/.env` |
| "CORS" error in the browser console | `FRONTEND_URL` in `AI/.env` must be the page's exact address; then `docker compose up -d` |
| a change to `.env` has no effect | use `docker compose up -d` (a `restart` keeps the old values) |
| `/health` says "database unreachable" | Postgres is not running: `docker compose up -d` |
| every document question is "not in the documents" | run `./scripts/load_docs.sh` (needed after every database reset) |
| "The assistant is unavailable right now" | Gemini failed (key or quota): `docker compose logs ai` |
| port 5432 already in use | the team's other stack is running: stop one of them |
| a code change has no effect | `app/` reloads by itself in development; after changing `requirements.txt`, run `docker compose up -d --build` |

## The service's addresses

| Method + URL | Who | What |
|---|---|---|
| `GET /health` | anyone | is the service and its database up |
| `GET /ai/me` | logged in | role and gym name |
| `POST /ai/chat` | logged in | ask a question, answer streamed as server-sent events |
| `GET /ai/threads/{id}` | logged in | your own messages in a conversation |
| `GET`, `POST /ai/documents`, `DELETE /ai/documents/{name}` | owner | the gym's documents |
| `POST /internal/sentiment` | backend (`X-API-Key`) | classify a feedback text |
