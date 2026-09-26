# Backend findings #2 — from the AI layer

*Read 2026-09-23 by Oussama, on `origin/backend` at commit `21b9a1b`. Follow-up to
`BACKEND_FINDINGS_DAHANI.md` (2026-09-16), which is still worth a look — 7 of those 10 are
still open, listed at the end.*

Salam Dahani,

I read the backend again, more of it this time: auth, members, visits, plans, profiles, the
crons, the schema and the Docker setup. The structure is good — one module per domain, DTOs
everywhere, `ValidationPipe` with `whitelist`, `ParseUUIDPipe` on every id, a different JWT
secret per role, action tokens stored hashed with expiry and single use, tenant scoping in
nearly every query, and money as `Decimal(10,2)`. It compiles clean and lints clean.

Below is what I could not make work. **I checked each one in your code at the commit above**,
and where it says "I tested it", I ran it. If I have misread something, tell me — that is useful
too.

Each finding is written the same way: **what happens** → **where** → **why it matters** →
**the fix**.

| Group | What |
|---|---|
| **A. Please fix first** | 5 small ones. Each is a few lines. Two are security holes. |
| **B. What my part needs** | 4 things that block the AI assistant. |
| **C. Before we submit** | 4 that will cost us during the evaluation. |

---

## A. Please fix first — small, and the dangerous ones

### A1. One gym can write into another gym's data 🔴

**What happens.** An admin sends `POST /api/membership-plans/durations` with **another gym's**
`membershipPlanId`. The request succeeds and a duration + price is added to that other gym's plan.

**Where.** `backend/src/modules/membership-plans/membership-plans.service.ts:59`

```ts
const membershipPlan = await this.prisma.membershipPlan.findUnique({
  where: { id: data.membershipPlanId },     // ← nothing checks which admin owns this plan
});
```

Every other method in this file scopes by `adminId`. This one does not, and the `create` below it
connects straight to the id that came from the request body.

**Why it matters.** The whole product is "each gym sees only its own data". One endpoint that
writes across gyms breaks that promise, and the evaluators will look for exactly this.

**Fix.** One line:

```ts
const membershipPlan = await this.prisma.membershipPlan.findFirst({
  where: { id: data.membershipPlanId, adminId },
});
```

### A2. The API sends password hashes to clients 🔴

**What happens.** In Prisma, `admin: true` (or `include: { user: true }`) returns **every column**
of that relation — `password` included. So the hash goes out in the JSON response.

**Where** (four places):

| File | Who receives it | Whose hash |
|---|---|---|
| `profiles/profiles.service.ts:363` (`findMeStaff`) | any staff member | their admin's |
| `visits/visits.service.ts:276-277`, `318-319` | admin and staff | the admin's + every listed member's |
| `staffs/staffs.service.ts:187`, `222` | admin | the admin's own, repeated on every row |
| `platform/subscriptions/subscriptions.service.ts:185`, `204` | owner | every admin's |

You already do it right in `memberships.service.ts` (`member: { omit: { password: true } }`).

**Why it matters.** A hash is not a password, but it is the input to an offline cracking attack,
and it must never leave the server. It is also the first thing a reviewer greps for.

**Fix.** Two steps:

1. Replace every `admin: true` / `user: true` / `member: true` with an explicit `select` of the
   fields you actually need.
2. Add a safety net in `PrismaService` so it cannot happen again:

```ts
new PrismaClient({
  omit: { user: { password: true }, staff: { password: true }, member: { password: true } },
});
```

### A3. The "plan change" transaction does not protect anything 🟠

*(This was finding #3 on 16 September — still open.)*

**What happens.** Inside `$transaction`, two of the three writes use `this.prisma` instead of
`tx`, so they run **outside** the transaction.

**Where.** `backend/src/modules/members/members.service.ts:283-316`

```ts
await this.prisma.$transaction(async (tx) => {
  await tx.membership.update(...)                   // inside
  const newMembership = await this.prisma.membership.create(...)   // ← outside
  await this.prisma.payment.create(...)                             // ← outside
});
```

**Why it matters.** If the payment insert fails, the old membership is already expired and the new
one already exists. The member is left in a state nobody can explain, and my assistant reports it.

**Fix.** Use `tx` for every write inside the callback.

### A4. Changing a plan expires a random membership 🟠

*(Finding #4 on 16 September — still open.)*

**What happens.** Before creating the new membership, the code picks the old one like this:

**Where.** `members.service.ts:271-276`

```ts
const membership = await this.prisma.membership.findFirst({
  where: { adminId, memberId },        // no status filter, no orderBy
});
```

`findFirst` with no `orderBy` returns whatever Postgres hands back first — often an old EXPIRED
one. That one is marked EXPIRED again, and the **real active membership stays ACTIVE**. The member
now has two ACTIVE memberships.

**Why it matters.** My assistant answers "when does my membership expire?" and "how many active
members do we have?". With two active rows for one person, it can name the wrong plan and the
wrong date. I work around it today by preferring the live membership, but the data is still wrong.

**Fix.**

```ts
const membership = await this.prisma.membership.findFirst({
  where: { adminId, memberId, membershipStatus: MembershipStatus.ACTIVE },
  orderBy: { expiresAt: 'desc' },
});
```

Later, consider moving "change plan / renew" into its own endpoint
(`POST /members/:id/memberships`) instead of hiding it inside `PATCH /members/:id`.

### A5. Hashing refresh tokens with bcrypt does nothing 🟠

**What happens.** bcrypt reads **only the first 72 bytes** of its input. A JWT starts with the
header (36 characters, always the same) and then `{"id":"<uuid>"…`. So for the same user, **every
refresh token has the same first 72 bytes**, and `bcrypt.compare(otherToken, storedHash)` returns
`true`.

**Where.** `auth.provider.ts:209-210` (hash), `:261`, `:319` (compare), and the staff/member
copies.

**I tested it**: two tokens for the same user, different `jti`, identical first 72 characters.
You can see it yourself:

```js
const a = jwtA.slice(0, 72), b = jwtB.slice(0, 72);
console.log(a === b);   // true
```

**Why it matters.** What protects you today is the JWT signature check in the passport strategy,
not the database hash. The hash costs a bcrypt round on every refresh and gives nothing, and the
`@unique` on `hash` is meaningless.

**Fix.** Tokens are already random and long, so they do not need bcrypt — hash them the way you
already hash action tokens:

```ts
const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
// look up by hash directly, no compare loop
```

While you are in there: **rotate on refresh**. Today one stolen cookie is valid for 30 days.
Issue a new refresh token on every refresh, revoke the old row, and if a revoked token is ever
presented again, revoke all of that user's tokens (that is how you detect theft).

---

## B. What my part needs

### B1. Decide what `payment_status` means 🔴 (blocking)

*(Finding #1 on 16 September — still open, and the one I need most.)*

**What happens.** A payment is created as `PAID` when cash is taken. Then the cron rewrites it:

**Where.** `backend/src/jobs/payment.cron.ts`

```ts
// PAID -> OVERDUE when dueDate is tomorrow
// OVERDUE -> UNPAID once dueDate has passed
```

**Why it matters.** Every payment a member really made ends up saying **UNPAID**. The row stops
being "money we received" and becomes "the next renewal is due", but it is stored as payment
history. Because of this:

- I cannot answer "who has not paid?" — the honest answer would be wrong for everyone.
- I had to compute revenue from **memberships sold**, not from payments.
- A member asking "am I up to date?" is told their paid July period is overdue.

**Fix** (my suggestion, but it is your call):

- A `Payment` row is a historical fact: once `PAID`, it never changes.
- Give `Payment` a `membershipId` (the schema has **no relation between Payment and Membership**
  today).
- Renewal reminders come from `membership.expiresAt`, not from rewriting payments.
- A renewal creates a **new** `UNPAID` payment. There is also no endpoint to record a payment
  today — payments are read-only.

If you prefer to keep the current behaviour, tell me and I will document it as "payment_status
means renewal state" and stop treating it as money.

### B2. There is no Feedback API yet 🟠 (blocking my week 6)

**What happens.** `Feedback` and `FeedbackLike` exist in `schema.prisma`, but there is **no module,
controller or service** for them, so nothing can create feedback.

**Why it matters.** My third graded module is sentiment analysis of member feedback. I have the
endpoint ready on my side; I need yours to call it.

**What I need, when you build it:**

1. A member endpoint to leave feedback (`content`, `rating`).
2. On creation, call my service:
   `POST http://ai:8000/internal/sentiment` with header `X-API-Key: <INTERNAL_API_KEY>` and body
   `{ "feedback_id": "...", "content": "..." }`.
3. Store what comes back in the columns you already have:
   `{ "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE", "score": 0.87 }` — I return your
   `SentimentType` values exactly, and `score` has two decimals for your `Decimal(3,2)`.
4. **It must not block feedback creation.** If my service is down, save the feedback unscored.
5. For those unscored rows, a small job on your side (a cron, once an hour) that sends them to the
   same endpoint and stores the result. **My service cannot write your tables** — my database user
   is read-only, by design — so this write has to be yours.

### B3. Time zones 🟠

**What happens.** `startOfDay`, `format(..., 'HH:mm')`, `getISODay`, `startOfWeek` and the crons
all use the **server's** time zone. In Docker (`node:20-alpine`) that is UTC. Our gyms are in
Morocco (UTC+1).

**Why it matters.** A member booking 08:30 local is compared against working hours as 07:30.
"Today", "this week" and "tomorrow" are shifted by an hour in the crons too. Your commit
`0be6192 "fix the bug of utc"` fixed the `YYYY-MM-DD` parsing in special hours — that part is
right — but the booking and cron logic is still server-time.

**Fix.** Add a `timezone` column to the gym (`User`), default `Africa/Casablanca`, and do the
day/week/time maths in that zone with `date-fns-tz` (`toZonedTime`). My side already answers in
Africa/Casablanca, so today our two sides can disagree by an hour.

### B4. Banning someone does not end their session 🟡

**What happens.** The JWT strategies return the payload without checking the account:

**Where.** `auth/strategies/admin-access-token.strategy.ts:61` (and the other seven)

```ts
validate(accessTokenPayload: AccessTokenPayload) {
  return accessTokenPayload;      // no database check
}
```

`resolveAdminId` checks that the staff row *exists*, not that it is ACTIVE. Refresh tokens are not
revoked on ban either.

**Why it matters.** A banned member or a fired employee keeps full API access for the life of
their access token (15 minutes), and can refresh for 30 days. On my side I re-check the account
status on **every** request, so my assistant stops immediately — your API should match.

**Fix.** When banning/freezing: delete that user's refresh tokens. And either check
`accountStatus` inside `validate()` (one indexed query), or keep access tokens very short.

---

## C. Before we submit

### C1. Wrong status codes, and no global error handling 🟡

- Duplicates return **401 Unauthorized** (`register`, `addStaff`, `addMembershipPlan`, plan
  durations). A duplicate is **409 Conflict**.
- "No active subscription" returns **401** (`core/services/access.service.ts:34`). 401 tells the
  frontend "your token is bad, log out", so a gym whose subscription expired gets kicked into a
  logout loop. Use **403**.
- Business-rule errors ("visit must be in the future", "start time must be before end time")
  return **403**. Those are **400**. Keep 403 for "you are not allowed".
- **Empty lists return 404** in almost every `findAll` (`members.service.ts:454`,
  `staffs.service.ts:195`, `payments.service.ts:66`). An empty list is `200 []` — otherwise the
  frontend needs a try/catch just to show "no members yet".
- `POST` actions return `void`, so the frontend never gets the new id.

**Fix.** Add one `AllExceptionsFilter` that maps Prisma `P2002` → 409, `P2025` → 404, logs the
rest, and returns a consistent error shape. Write it first: it turns a lot of hidden 500s into
proper answers, and then everything else is easier to test.

### C2. The database does not enforce its own rules 🟡

Uniqueness is checked in code with "find, then create", which two simultaneous requests can both
pass. Missing in `schema.prisma`:

- `Member`: `@@unique([adminId, email])`, `@@unique([adminId, phoneNumber])` — today there are
  only `@@index`es, which do not prevent duplicates
- `MembershipPlan`: `@@unique([adminId, planName])`
- `MembershipPlanDuration`: `@@unique([membershipPlanId, durationDays])`
- Nothing stops two ACTIVE memberships for one member (see A4) — a partial unique index does:
  `CREATE UNIQUE INDEX ... ON memberships (member_id) WHERE membership_status = 'ACTIVE';`

And the opposite problem: **`Staff.email` is globally unique** in the schema, while the service
only checks for duplicates inside one gym (`staffs.service.ts:40-45`). If two gyms hire the same
person, Prisma throws `P2002` and the API returns an unhandled **500**. Decide which rule you want
and make schema and code agree.

### C3. Secrets in `.env.example` 🟠

`backend/.env.example` contains real-looking 512-bit JWT and cookie secrets, and
`devops/.env.example` has `1234` passwords. People copy the file to `.env` and never change it —
then production runs on secrets that are public on GitHub.

**Fix.** Put placeholders (`JWT_ADMIN_ACCESS_SECRET=change-me`), document
`openssl rand -hex 64`, and validate at boot (Joi/zod) so the app refuses to start with a
placeholder. Separately: **I still need the staging/production secrets** for the three ACCESS
tokens, whenever you generate them. I have the dev ones from `.env.example`.

### C4. No tests, and 55 migrations named `alpha_x_y` 🟡

There are no tests except the default `app.e2e-spec.ts`, which tests a route that no longer exists
and fails. The most valuable ones, in order:

1. **Tenant isolation**: admin A cannot read or write admin B's members, plans, durations, visits.
   This alone would have caught A1.
2. **A test asserting no response body contains the key `password`** — would have caught A2.
3. register → activate → login → refresh → logout, and the three forgot/reset flows.

Also: squash the 55 `alpha_1_0 … alpha_5_5` migrations into one `init` before merging to `main`,
and from then on give each migration a real name (`add_visits_table`).

---

## Still open from 16 September

| # | Issue | Status today |
|---|---|---|
| 1 | Payment lifecycle erases that money was collected | open (B1) |
| 3 | Plan-change transaction is not atomic | open (A3) |
| 4 | Plan change expires an arbitrary membership | open (A4) |
| 6 | Re-sent verification email carries a token that was never stored | open — `auth.provider.ts:160-167`, the `tokenHash` is generated and never saved, so the link always fails |
| 7 | A password reset does not revoke existing sessions | open |
| 9 | Account enumeration on register and forgot-password | open |
| 10 | Notification cron: ordering and repeats | open |

Two more from the same family, found this time:

- **Staff can never reset their password.** `auth.provider.ts:668` sends the *member* reset email,
  whose link hits the member endpoint, which looks in `memberActionToken` — so a staff token is
  always "invalid". `sendResetPasswordStaffEmail` exists and is never called.
- **Action token `type` is never checked.** `activateAccount`, `resetPassword`, `setPassword…`
  look the token up by hash only, so a 1-day SET_PASSWORD token works on the 15-minute
  reset-password endpoint. Add `type: ActionTokenType.X` to each `where`.

---

## Two small things for me

1. **When you next push**, tell me — I merge your branch into mine and my service checks your
   schema at boot. If a column changed, it refuses to start and names the column, so I find out in
   seconds rather than during the demo.
2. If you want the long version, I have a fuller review of the whole backend (~60 points,
   including duplication in `auth.provider.ts`, pagination, DTO validation, Docker/compose fixes).
   Say the word and I will send it.

Everything above is a bug report you can take or leave — except B1, where I need your decision
before my side can be correct.

— Oussama
