AI assistant: guide for the frontend
This guide gives you everything you need to build the frontend of the AI assistant, for the owner and staff pages (admin-staff-platform) and the member pages you're adding. The AI service is finished and tested, so you only build pages and one small server route. Questions about the AI service: ask Oussama.

In short, you build:

The assistant page: one chat for all three roles. The same component goes in the owner/staff area (/assistant) and in the member area. What it can answer depends on who is logged in (section 3), and the AI service decides that from the token.
Owner (ADMIN) and staff (STAFF): questions about the gym (members, expiring memberships, feedback, the gym's documents; revenue for the owner only).
Member (MEMBER): questions about their own membership, payments and visits, and the gym's rules.
The documents page (/assistant/documents): the gym owner uploads and deletes the documents the assistant answers from. Owner only.
One server route (src/app/api/ai/[...path]/route.ts): it forwards the pages' calls to the AI service with the user's token. Ready below, already tested in a copy of your app. If the member pages are in a different Next.js app, that app gets the same file.
One client helper (src/lib/assistant/api.ts): the typed calls and the stream reader. Ready below, already type-checked in your app.
Small edits in your files:
protect the assistant pages in src/proxy.ts, in both areas;
the sidebar links: the assistant for everyone, the documents page for the owner only;
AI_URL in .env.example.
Your call: the layout, the look (your theme, components, toasts, modals) and the translations (en/fr/ar). The AI service doesn't care how the pages look. It only cares about the calls in section 4.

1. How it connects
browser ──(your auth_token cookie)──▶ Next.js server route /api/ai/... ──(Authorization: Bearer)──▶ AI service /ai/... ──▶ Gemini
        ◀────────── stream ──────────                                  ◀──────────── stream ────────────
Your login stores the backend's access token in the httpOnly auth_token cookie, so page JavaScript can't read it. Your app already solves this with server routes and getAuthenticatedSession. The assistant uses exactly the same pattern. The route reads the cookie (and refreshes the token if needed), then calls the AI service with Authorization: Bearer <token>.
The AI service checks the same JWT as the backend. It has a copy of the backend's three access secrets (ADMIN, STAFF, MEMBER). From the token it gets the user and the role, and from the database it gets the gym. The page never sends a gym id or a user id.
For members, the route needs the member's access token. Whatever cookie your member login uses, the session helper must return that token. Refreshing it goes through the backend's member route, POST /api/auth/members/refresh, not the admin one (staff: /api/auth/staffs/refresh). Otherwise members are sent back to the login page after 15 minutes.
The AI service stays internal. Only your server route and the backend call it, so there's no CORS and no public address. The browser never knows where it is.
Answers stream (Server-Sent Events): the text arrives piece by piece while the model writes it, so the route must pass the stream through without waiting for the end. The route below does that.
2. Set up, run and test the AI service
This section gets you from zero to seeing the AI answer questions. You don't need the backend or a browser — just Docker, the terminal, and about 10 minutes.

2.1 Configure
cd AI
cp .env.example .env
Fill in .env:

Variable	What to put
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB	the local database account (same as in backend/.env's DATABASE_URL)
AI_DB_PASSWORD	any password for the read-only user, also written in AI_DATABASE_URL
JWT_*_ACCESS_SECRET	exactly the same three values as in backend/.env — if they differ, every token is refused (401)
INTERNAL_API_KEY	a random string, shared with the backend: openssl rand -hex 32
GEMINI_API_KEY	your Gemini key (https://aistudio.google.com/apikey)
FRONTEND_URL	http://localhost:3001 (your app's address)
2.2 Start
docker compose up -d --build
curl localhost:8000/health     # → {"status":"ok"}
If it says "database unreachable", that's normal — the demo data hasn't been loaded yet. The team's devops/docker-compose.yml also uses port 5432, so don't run both at the same time.

2.3 Create the demo data
This creates 4 gyms with ~1,100 members, their history, check-ins, feedback, and 16 documents. You need Node.js 20+ (for Prisma) and Python 3.11+ (for the seeder).

docker compose down -v && docker compose up -d             # fresh database
(cd ../backend && npm install && npx prisma migrate deploy) # the tables
set -a; source .env; set +a                                 # load .env into this terminal
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ai_password="$AI_DB_PASSWORD" < seeder/roles/ai_readonly.sql
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < seeder/fixtures/atlas_gym.sql
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < seeder/fixtures/oasis_gym.sql
python3 -m venv .venv && .venv/bin/pip install asyncpg     # first time only
.venv/bin/python -m seeder.seed
docker compose restart ai
./scripts/load_docs.sh                                      # the gym documents
Check: curl localhost:8000/health → {"status":"ok"}.

2.4 The demo data
4 gyms, each completely isolated (Atlas never sees Oasis's data):

Gym	Short name
Atlas Fitness Agadir	atlas
Oasis Gym Marrakech	oasis
Titan Fitness Casablanca	titan
Medina Wellness Fes	medina
3 roles per gym:

Role	Who	What they can ask the AI
admin	The gym owner	Everything: members, revenue, feedback, all documents
staff	A receptionist	Same as owner, minus revenue
member	A gym member	Only their own data + member-visible documents
Demo accounts (password for all: Demo1234!):

Role	Login	Gym
Owner	karim@atlasfitness.ma (email)	Atlas
Owner	nadia@oasisgym.ma (email)	Oasis
Staff	reception.atl (username)	Atlas
Staff	reception.oas (username)	Oasis
Member	omar_t (username)	Atlas — membership expired, payment unpaid
Member	siham_i (username)	Atlas — membership expires in 5 days
Member	youssef_a (username)	Atlas — expires in 20 days
Member	rachid_o (username)	Oasis — active
Banned staff: ex.reception.atl, ex.reception.oas (the AI refuses them).

2.5 Test: talk to the AI from the terminal
Use the ask.sh script — it calls the API and shows just the answer (no raw events).

./scripts/ask.sh <role> <gym or email> [question]
role: admin, staff, or member
gym or email: the gym's short name for admin/staff, or the member's email for members
question: optional — skip it to enter interactive mode (type questions, follow-ups work, Ctrl-C to quit)
As the Atlas owner:

./scripts/ask.sh admin atlas "How is the gym doing today?"
./scripts/ask.sh admin atlas "How much did we make last month?"
./scripts/ask.sh admin atlas "How many days notice do members need to cancel?"
# → 30 days, from membership-terms.md (Oasis: 45 days — different gym, different rules)
Interactive mode (follow-ups continue the conversation):

./scripts/ask.sh admin atlas
> Who expires this week?
> And in the next 30 days?
> Who hasn't come for 3 weeks?
> Ctrl-C
As staff:

./scripts/ask.sh staff atlas "How much money did we make?"
# → REFUSED (staff have no access to revenue)

./scripts/ask.sh staff atlas "What discount can I give at reception?"
# → 15% (from the staff-only document)
As a member:

./scripts/ask.sh member omar@gmail.com "When does my membership end?"
# → his membership expired

./scripts/ask.sh member omar@gmail.com "Do I have any unpaid payments?"
# → yes

./scripts/ask.sh member siham@gmail.com "How many times did I come this month?"
# → her visit count

./scripts/ask.sh member siham@gmail.com "What are the opening hours on Sunday?"
# → 08:00 to 20:00 (from the member-visible document)

./scripts/ask.sh member siham@gmail.com "What discount can reception give me?"
# → "not in the gym's documents" (staff-only document, members can't see it)

./scripts/ask.sh member omar@gmail.com "What is Siham's phone number?"
# → REFUSED (members can only see their own data)
In other languages:

./scripts/ask.sh admin atlas "Combien de jours de préavis pour résilier ?"
# → answers in French

./scripts/ask.sh admin atlas "wach nqder njib m3aya chi sa7bi?"
# → answers in Darija
Two gyms give different answers:

./scripts/ask.sh admin atlas "How many days notice to cancel?"
# → 30 days
./scripts/ask.sh admin oasis "How many days notice to cancel?"
# → 45 days
2.6 Test: document upload and delete
TOKEN=$(docker compose exec -T ai python - admin atlas < scripts/mint_token.py)

# upload a test document
echo "Towels can be rented at reception for 10 MAD per session." > /tmp/towels.md
curl -s -X POST localhost:8000/ai/documents -H "Authorization: Bearer $TOKEN" \
     -F "file=@/tmp/towels.md" -F "visibility=member"

# ask about it
./scripts/ask.sh admin atlas "Can I rent a towel?"
# → 10 MAD, from towels.md

# delete it
curl -s -X DELETE localhost:8000/ai/documents/towels.md -H "Authorization: Bearer $TOKEN"

# ask again
./scripts/ask.sh admin atlas "Can I rent a towel?"
# → "not in the gym's documents"
2.7 Connect your app (when you're ready to build pages)
With the backend running:

DATABASE_URL in backend/.env must point at localhost:5432 (the AI's Postgres).
Add AI_URL=http://localhost:8000 to your .env.local, then npm run dev.
Log in as karim@atlasfitness.ma → open /assistant.
For members: log in as siham_i → open the member assistant page.
Shortcut without the backend (for assistant-only work): make a token and set it as the auth_token cookie in the browser dev tools:

docker compose exec -T ai python - admin atlas < scripts/mint_token.py     # owner
docker compose exec -T ai python - staff atlas < scripts/mint_token.py     # staff
docker compose exec -T ai python - member siham@gmail.com < scripts/mint_token.py  # member
Tokens last 15 minutes — make a new one when they expire.

3. What the assistant can answer (to design the page around it)
Who	What they can ask about
Owner (ADMIN)	members, memberships expiring, inactive members, member search, feedback (with positive/neutral/negative counts), revenue, and the gym's documents (rules, prices, hours, staff procedures)
Staff (STAFF)	the same as the owner, except revenue (the assistant refuses)
Member (MEMBER)	only their own membership, payments and visits, and the gym's documents marked for members
It answers in the language of the question: English, French, Arabic or Darija. So translate the suggested questions too, not only the buttons. A French page that suggests French questions gets French answers.
It writes plain text: no Markdown, and lists as lines starting with - . Money looks like 1,250.00 MAD.
It only knows the user's own gym. Another gym, other people's private data, or anything outside its tools gets "I can't help with that".
For a member, everything is about themselves: "When does my membership end?", "Did I pay?", "How many times did I come this month?", plus the gym's rules ("Can I bring a friend?", "What are the opening hours on Sunday?").
It refuses other people's data ("What is Youssef's phone number?") and anything about the gym's business (members, revenue, feedback).
Staff-only documents never reach a member: asked "What discount can reception give me?", a member hears that it isn't in the gym's documents.
4. The API (the contract)
All paths below are the AI service's paths. Your pages call them through your route as /api/ai/... (section 5). Every call needs a logged-in user (the route adds the token).

Method and path	Who	Body	Success
GET /ai/me	any role	—	{"role": "ADMIN" | "STAFF" | "MEMBER", "gym_name": "Atlas Fitness Agadir"}
POST /ai/chat	any role	{"question": "...", "thread_id": "<uuid>" or null}	a stream of events (below)
GET /ai/threads/{thread_id}	any role	—	[{"role": "user" | "model", "text": "..."}] (up to 100, oldest first; someone else's id → [])
GET /ai/documents	owner	—	[{"filename": "membership-terms.md", "visibility": "member" | "staff", "chunks": 3}]
POST /ai/documents	owner	multipart form: file, visibility (member or staff)	{"filename": "...", "visibility": "...", "chunks": 2}
DELETE /ai/documents/{filename}	owner	—	{"deleted": "..."}
The chat stream (Content-Type: text/event-stream). Each event is an event: line, a data: line (JSON) and an empty line:

event: start
data: {"thread_id": "5b2303d3-e58b-442b-adca-1e9b475d951c"}

event: tool
data: {"type": "tool", "name": "list_expiring_memberships"}

event: token
data: {"type": "token", "text": "There are 4"}

event: token
data: {"type": "token", "text": "1 members expiring this week."}

event: done
data: {}
Event	When	What the page does
start	always first	remember thread_id (send it with the next question)
tool	the assistant looks something up (0 to a few times)	optional: show "Looking up: expiring memberships…"
token	each piece of the answer	append text to the answer on screen
done	the answer is complete	stop the loading state
error	failed in the middle (the model is unavailable)	show message (a generic text); no done follows
Timing: the first text usually comes after 1–2 s, and a long list keeps streaming for a few seconds. If the model doesn't answer within 30 s, you get the error event.

Errors before the stream are normal HTTP errors with a JSON body {"detail": ...}:

Status	When	detail
401	no token, an expired or invalid token, or a banned staff or member account	"Invalid or expired token" → send the user to the login page
403	documents, but not the owner	"Only the gym owner can manage documents"
404	deleting a document that doesn't exist	"No such document"
413	upload over 10 MB	"The file is larger than 10 MB"
422	a rule broken (see the next two lines)	a string for our own checks, a list for format errors
our checks (string)	"Only .md, .txt and .pdf files are accepted", "Visibility must be member or staff", "Could not read any text from this file", "The document has no text"
format errors (list)	empty question, question over 2,000 characters, thread_id not a UUID, missing form field
429	more than 20 requests per minute for this user (chat and upload)	"Too many requests", and the Retry-After header = seconds to wait
502	upload: the model couldn't process the file; or your route couldn't reach the AI service	"The document could not be processed right now. Please try again." / "The assistant is unavailable right now."
Show detail to the user when it's a string. When it's a list (a format error), show your own message.

5. The server route (ready, tested in a copy of your app)
src/app/api/ai/[...path]/route.ts:

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession, attachSessionCookies } from "@/lib/server-auth";

const AI_URL = process.env.AI_URL || "http://localhost:8000";

type Context = { params: Promise<{ path: string[] }> };

// forwards /api/ai/<path> to the AI service's /ai/<path>, adding the login token from the cookie
async function forward(req: NextRequest, { params }: Context) {
  const { path } = await params;
  if (path.some((part) => part === "." || part === "..")) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const { token, newAccessToken } = await getAuthenticatedSession(req);
  const headers: Record<string, string> = { Authorization: `Bearer ${token ?? ""}` };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType; // JSON, or a file upload with its boundary

  try {
    const ai = await fetch(`${AI_URL}/ai/${path.map(encodeURIComponent).join("/")}`, {
      method: req.method,
      headers,
      body: req.method === "POST" ? await req.arrayBuffer() : undefined,
    });

    // the body is passed on as it arrives, so the chat keeps streaming
    const res = new NextResponse(ai.body, { status: ai.status });
    for (const name of ["content-type", "cache-control", "retry-after"]) {
      const value = ai.headers.get(name);
      if (value) res.headers.set(name, value);
    }
    res.headers.set("X-Accel-Buffering", "no");
    return attachSessionCookies(res, newAccessToken);
  } catch {
    return NextResponse.json({ detail: "The assistant is unavailable right now." }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
What matters in it:

One file serves everything: [...path] catches /api/ai/me, /api/ai/chat, /api/ai/threads/<id>, /api/ai/documents, and so on.
new NextResponse(ai.body, ...) passes the stream through. Don't replace it with await ai.json(): the chat would wait for the whole answer and stop streaming.
/ai/ is fixed in the code, so the route can only reach the AI service's public routes, never its internal ones.
The upload is passed byte for byte with its original Content-Type, which holds the multipart boundary.
retry-after is copied, so the page can say "try again in N seconds".
Your next.config.ts fallback rewrite (unknown /api/* → backend) doesn't interfere: this route is matched first.
What was tested in a copy of your app (branch frontend-ael-jama, commit 855ad95):

0 type errors;
the cookie login works (no cookie → 401; the owner's cookie → /ai/me answers);
16 pieces of an answer streamed over 2.5 s, the same rhythm as calling the AI service directly;
upload, list and delete of a file with a space in its name;
403/404/422 messages pass through;
the 21st request gets 429 with Retry-After: 60;
/api/ai/../internal/... never reaches the AI service.
6. The client helper (ready, type-checked in your app)
src/lib/assistant/api.ts. Use it as is, or move it to your src/lib/api/ style:

const BASE = "/api"; // the app's own server route adds the login token (app/api/ai/[...path])

export type Role = "ADMIN" | "STAFF" | "MEMBER";
export type Me = { role: Role; gym_name: string };
export type SavedMessage = { role: "user" | "model"; text: string };
export type DocumentInfo = { filename: string; visibility: "member" | "staff"; chunks: number };

export class ApiError extends Error {
  status: number;
  retryAfter: number;
  detail: string; // the server's own explanation, when it gives one

  constructor(status: number, retryAfter: number, detail: string) {
    super(`HTTP ${status}`);
    this.status = status;
    this.retryAfter = retryAfter;
    this.detail = detail;
  }
}

// after a 401 the session is really over (the route already tried a refresh)
export function toLogin() {
  window.location.href = `/login?from=${encodeURIComponent(location.pathname)}&error=session_expired`;
}

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {}; // no Authorization: the cookie goes by itself
  // a file upload (FormData) must let the browser set its own Content-Type
  if (typeof init.body === "string") headers["Content-Type"] = "application/json";
  const response = await fetch(BASE + path, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, Number(response.headers.get("Retry-After") ?? 0),
                       typeof body.detail === "string" ? body.detail : "");
  }
  return response;
}

export async function getMe(): Promise<Me> {
  return (await call("/ai/me")).json();
}

export async function getThread(threadId: string): Promise<SavedMessage[]> {
  return (await call(`/ai/threads/${threadId}`)).json();
}

export async function listDocuments(): Promise<DocumentInfo[]> {
  return (await call("/ai/documents")).json();
}

export async function uploadDocument(file: File, visibility: string): Promise<DocumentInfo> {
  const form = new FormData();
  form.append("file", file);
  form.append("visibility", visibility);
  return (await call("/ai/documents", { method: "POST", body: form })).json();
}

export async function deleteDocument(filename: string): Promise<void> {
  await call(`/ai/documents/${encodeURIComponent(filename)}`, { method: "DELETE" });
}

// reads the server-sent events of /ai/chat as they arrive and calls onEvent for each one
export async function streamChat(
  question: string,
  threadId: string | null,
  onEvent: (event: string, data: Record<string, string>) => void,
) {
  const response = await call("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ question, thread_id: threadId }),
  });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop()!; // the last piece may be cut in the middle: keep it for the next read
    for (const block of events) {
      const name = block.match(/^event: (.*)$/m)?.[1];
      const data = block.match(/^data: (.*)$/m)?.[1];
      if (name && data) onEvent(name, JSON.parse(data));
    }
  }
}
Why fetch and not EventSource: EventSource only does GET requests, and this is a POST.
Why the buffer: a network piece can end in the middle of an event, so the unfinished end waits for the next piece.
toLogin() matches what your axios client does when a session ends. ESLint warns about window.location.href, the same warning as in your axios.ts.
7. The assistant page: what it must do
One component for every role. Put the same chat component in the owner/staff area and in the member area. It reads the role from getMe() and adapts:

the suggested questions (below);
the placeholder: members "Ask about your membership…", owner and staff "Ask about your gym…";
the documents link, for the owner only.
The AI service does the rest: the same calls, but different answers per role.

On load:

getMe() gives the role and gym_name, for the header and the suggestions. A 401 → toLogin().
If this tab has a saved conversation (sessionStorage["thread_id"]), call getThread(id) and show the messages. sessionStorage is per tab, so two tabs means two conversations.
Sending a question:

Add the user's message and an empty assistant message to the list.
Call streamChat(question, threadId, onEvent):
start → save thread_id (in a ref and in sessionStorage);
tool → optional "Looking up: …" under the empty answer (labels below);
token → append text to the last message. Update the state with the function form (setMessages(all => ...)): events arrive fast, one after another;
error → show message, and remove the empty answer if no text came;
done → nothing special.
If streamChat throws (refused before the stream): remove the two messages and put the question back in the input, then:
401 → toLogin();
429 → "Too many questions. Try again in {retryAfter} seconds.";
anything else → "Can't reach the assistant right now."
While an answer streams: disable the send button (one question at a time).
Input:

a textarea; Enter sends, Shift+Enter makes a new line;
maxLength={2000};
empty or blank questions are not sent.
"New chat" button: remove thread_id from sessionStorage, forget it, clear the list. There is no list of past conversations: the AI service only reloads the tab's current one.

Logout: also remove sessionStorage["thread_id"], so the next person in that tab starts fresh. The AI service would return [] to them anyway.

Showing answers:

as plain text only, e.g. <p className="whitespace-pre-wrap">{text}</p>. No Markdown renderer, no dangerouslySetInnerHTML (see section 9);
add dir="auto" on each message, so an Arabic answer shows right-to-left even on an English page.
Suggested questions (one tap sends them). Translate them into your three languages:

Role	Suggestions
ADMIN	"How is the gym doing today?" · "Who expires this week?" · "How much did we make last month?" · "How many days notice do members need to cancel?"
STAFF	"Who expires this week?" · "Who hasn't come for 3 weeks?" · "Show me the negative feedback" · "What discount can I give at reception?"
MEMBER	"When does my membership end?" · "How many times did I come this month?" · "What are the opening hours on Sunday?" · "Can I bring a friend?"
Labels for tool events (optional; translate them too):

name	label
gym_overview	gym overview
list_expiring_memberships	expiring memberships
list_inactive_members	inactive members
search_members	member search
get_revenue	revenue
list_feedback	feedback
search_documents	the gym's documents
my_membership, my_payments, my_attendance	your membership / payments / visits
Header: "{gym_name} assistant", plus a link to the documents page for ADMIN only. Members and staff never see that link.

8. The documents page: what it must do
On load: listDocuments().

403 → show detail ("Only the gym owner can manage documents"): a staff member who typed the address;
401 → toLogin().
The list:

the file name;
its visibility: member → "Members and staff", staff → "Staff only";
a delete button.
Add one line explaining what visibility means: members only ever get "Members and staff" documents in their answers.

Upload:

a file input (accept=".md,.txt,.pdf") and a visibility choice;
check in the browser first: the extension is .md / .txt / .pdf, and the size is at most 10 MB. If not, show the message and send nothing. (The AI service checks again.)
uploadDocument(file, visibility). Don't set Content-Type yourself: the browser writes the multipart boundary.
It takes a few seconds (the text is cut into parts and indexed), so disable the button while it works.
Success → "{filename} added ({chunks} parts). The assistant can use it now.", then reload the list.
Error → show detail.
Uploading a file with the same name replaces the old one.

Delete: ask for confirmation (your modal), then deleteDocument(filename) and reload the list. The answer changes right away: the assistant no longer finds that document.

What isn't in the AI service: opening or downloading a document, editing it (re-upload instead), folders.

9. Roles and security: who decides what
Owner (ADMIN)	Staff (STAFF)	Member (MEMBER)
Assistant page	yes (owner/staff area)	yes (owner/staff area)	yes (member area)
Gym data (members, expiring, feedback)	yes	yes	refused: only their own membership, payments, visits
Revenue questions	yes	refused by the assistant	refused
Documents page	yes	403	403
Documents used in answers	all	all	"Members and staff" only
The AI service enforces all of this. Hiding a link or a suggestion is only for comfort. A user who calls the API directly gets the same refusals.

Rules for the pages:

The token stays in the httpOnly cookie. Never put it in localStorage, in a URL, or in a NEXT_PUBLIC_ variable.
Answers are plain text. They can quote members' feedback, so rendering them as HTML would let someone inject markup through a feedback comment.
AI_URL is server-only (no NEXT_PUBLIC_). The browser never needs the AI service's address.
The pages only call /api/ai/.... The AI service has an internal endpoint for the backend (/internal/sentiment) that the frontend must never call. The route can't reach it anyway.
10. Production (for whoever does Docker and nginx)
The AI service on the team's Docker network. It reads the same Postgres through its own read-only user (see AI/README.md).
Frontend container: AI_URL=http://ai:8000.
nginx: no route to the AI service. It stays internal.
nginx: client_max_body_size 10m; on the location that serves the frontend. The default is 1 MB, so without it any document over 1 MB fails with 413 before reaching Next.js.
Streaming through nginx: your location / already has proxy_buffering off, so the answer keeps streaming. proxy_read_timeout 60s is enough: events arrive every few hundred milliseconds.
One thing to settle with DevOps: nginx currently sends every /api/ request to the backend. Your app's own server routes (/api/auth/login, and this /api/ai/...) need to reach Next.js instead. Whatever you decide for your routes, the assistant's route follows.
11. Done when
Assistant page (owner karim@atlasfitness.ma):

[ ] "How is the gym doing today?" → "Looking up: gym overview", then the answer appears word by word
[ ] a follow-up ("And how many expire this week?") is understood
[ ] a reload brings the conversation back; "New chat" clears it
[ ] 21 questions in a minute → "Try again in N seconds", and the question goes back in the input
[ ] a French question gets a French answer, and an Arabic question shows right-to-left
[ ] logged out → /assistant sends you to /login
Staff (reception.atl):

[ ] "How much did we make last month?" → refused
[ ] no documents link
[ ] typing /assistant/documents shows "Only the gym owner can manage documents"
Member (siham_i, in the member area):

[ ] member suggestions and the "Ask about your membership…" placeholder; no documents link
[ ] "When does my membership end?" → her own date (5 days after the demo data was loaded; once that day has passed, it says her membership expired)
[ ] "How many times did I come this month?" → her own visits
[ ] "What is Youssef's phone number?" → refused
[ ] "What discount can reception give me?" → not in the gym's documents (that one is staff only)
[ ] typing /assistant/documents (or calling it) → "Only the gym owner can manage documents"
[ ] omar_t: "Did I pay?" → his 300.00 MAD payment is unpaid (overdue); "When does my membership end?" → it ended 30 days before the demo data was loaded
[ ] logged out → the member assistant page sends you to the member login
Documents page (owner):

[ ] 4 documents listed
[ ] a .docx is refused with no request sent
[ ] upload a small .md → "added", and the chat answers from it naming the file
[ ] delete it → the same question → "not in the gym's documents"
[ ] a file with a space in its name uploads and deletes correctly
Everywhere:

[ ] zero console errors
[ ] works at phone width
[ ] your three languages
12. Reference: the old standalone pages
Before your app existed, the assistant had a standalone version (5 files, about 440 lines), tested in Chrome. It's on GitHub, branch ai-v1, commit 5922fde. You can read it to see a working chat and documents page:

git fetch origin ai-v1
mkdir -p /tmp/ai-ui && git archive 5922fde frontend/src | tar -x -C /tmp/ai-ui
ls /tmp/ai-ui/frontend/src/components/assistant   # AssistantPanel.tsx, DocumentManager.tsx
Worth reusing: the logic of AssistantPanel.tsx (the events, the conversation id, the error handling) and of DocumentManager.tsx (the checks, the upload, the two-click delete).
Don't copy:
its api.ts (it kept the token in localStorage; use section 6 instead);
its development "paste a token" box;
its colours, which aren't your theme.
13. Questions
Anything about the AI service (an answer that looks wrong, a missing piece of data, a new endpoint you'd need): ask Oussama. When you report an answer problem, send:

the exact question;
the account you used;
the answer you got.
With those he can reproduce it and check the data.