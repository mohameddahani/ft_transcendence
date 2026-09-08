# Schema ask — Dahani

Everything here is additive. Nothing renames or drops an existing column, and no
existing row is rewritten. Roughly **15 minutes**, plus one migration command.

The AI service reads your Postgres directly, read-only, through a `SELECT`-only role.
It never writes to your tables — the seeder that fills these for development connects
as `admin` and is a separate tool.

## Status while you're away

I could not wait for the tables, so `AI/seeder/pending/001_check_ins_feedbacks.sql`
creates local copies of them. **I have not touched `backend/` at all** — no schema
edit, no Prisma migration, nothing to merge. That SQL is written to match what
`prisma migrate dev` generates, so when yours lands I drop mine and run yours:

```bash
psql -U admin -d ft_transcendence -f AI/seeder/pending/001_rollback.sql
cd backend && npx prisma migrate deploy
```

If your shape differs from mine in any column or type, the AI service refuses to
start and names the column. That is deliberate — better than a wrong answer mid-demo.

## 1. `CheckIn`

```prisma
model CheckIn {
  id String @id @default(uuid())

  memberId String @map("member_id")
  member   Member @relation(fields: [memberId], references: [id])

  adminId String @map("admin_id")
  admin   User   @relation(fields: [adminId], references: [id])

  checkedInAt DateTime @default(now()) @map("checked_in_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([adminId, checkedInAt])
  @@index([memberId, checkedInAt])
  @@map("check_ins")
}
```

**The two indexes are the ask, not decoration.** `get_attendance_stats` and
`list_inactive_members` both filter by gym over a date range, and the agent runs
several of those per answer while a person watches it stream. Without the composite
index each one sequential-scans a table that will hold ~100k rows in the demo corpus.

## 2. `Feedback`

```prisma
enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}

model Feedback {
  id String @id @default(uuid())

  memberId String @map("member_id")
  member   Member @relation(fields: [memberId], references: [id])

  adminId String @map("admin_id")
  admin   User   @relation(fields: [adminId], references: [id])

  content        String
  rating         Int?
  sentiment      Sentiment?
  sentimentScore Decimal?   @map("sentiment_score") @db.Decimal(4, 3)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([adminId, createdAt])
  @@index([memberId])
  @@map("feedbacks")
}
```

`sentiment` and `sentimentScore` are nullable on purpose: you write the row when the
member submits, then fill these in from the scoring call. A feedback that has not
been scored yet is a normal state, not an error.

## 3. Back-relations

Four lines, next to the lists you already have:

```prisma
model Member {
  checkIns  CheckIn[]
  feedbacks Feedback[]
}

model User {
  checkIns  CheckIn[]
  feedbacks Feedback[]
}
```

## 4. Two one-line fixes that can ride the same migration

```prisma
// Payment — currently NOT NULL, so an UNPAID row has to assert it was paid on a
// day nobody paid. Any revenue query that sums by paid_at silently counts money
// that never arrived.
paidAt DateTime? @map("paid_at")

// Payment — without this, "revenue by plan type" is unanswerable: there is no way
// to tell which membership a payment settled.
membershipId String?     @map("membership_id")
membership   Membership? @relation(fields: [membershipId], references: [id])
```

plus `payments Payment[]` on `Membership`.

`paidAt` becomes nullable through `ALTER COLUMN ... DROP NOT NULL`; `membershipId`
is a nullable `ADD COLUMN`. Neither rewrites a row.

Then: `npx prisma migrate dev --name add_checkin_feedback`

## 5. Not urgent — the sentiment call (week 5)

On feedback creation, `POST /internal/sentiment` with `{feedback_id, content}`,
store the returned `sentiment` and `score` on the row. Header `X-API-Key`, value
shared separately. This is a feature, not schema, and it blocks nothing right now —
the development corpus writes sentiment values directly.

## 6. Already handled, no action

The read-only role (`AI/seeder/roles/ai_readonly.sql`) is applied locally and grants
`SELECT` on exactly the eight read-model tables, with **column-level** grants on
`members` and `users` that exclude `password`. It needs applying on staging when
there is one. It already picks up `check_ins` and `feedbacks` automatically.
