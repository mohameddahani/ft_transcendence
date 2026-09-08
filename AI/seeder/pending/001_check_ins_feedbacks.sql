-- SHADOW SCHEMA — local only. Not a Prisma migration, and nothing in backend/.
--
-- Dahani owns `prisma/schema.prisma` and has not shipped `CheckIn` or `Feedback`
-- yet (AI_PLAN §7 asks 1 and 2, due 2026-09-10). Tasks 1.5 and 1.6 need both, and
-- so do three of the eight admin tools. Rather than edit his schema on a branch he
-- is not working from -- two Prisma migrations creating the same tables with
-- different checksums is a genuinely unpleasant merge -- this creates them directly.
--
-- Written to match what `prisma migrate dev` will generate, exactly: table and
-- column names, TIMESTAMP(3), index names `<table>_<cols>_idx`, foreign key names
-- `<table>_<col>_fkey`, ON DELETE RESTRICT, and no DB default on `id` (Prisma's
-- `@default(uuid())` is client-side). If his version differs, the startup schema
-- check in app/db/schema.py fails loudly on the next boot -- which is the whole
-- point of having it.
--
-- Apply:    psql -U admin -d ft_transcendence -f seeder/pending/001_check_ins_feedbacks.sql
-- Remove:   psql -U admin -d ft_transcendence -f seeder/pending/001_rollback.sql
--           ...then `npx prisma migrate deploy` to take his real version.
--
-- Idempotent: safe to re-run.

-- Prisma emits enum types PascalCase and quoted, like "Gender" and "PaymentStatus".
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Sentiment') THEN
        CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');
    END IF;
END
$$;

-- ---------------------------------------------------------------- check_ins
CREATE TABLE IF NOT EXISTS "check_ins" (
    "id"            TEXT         NOT NULL,
    "member_id"     TEXT         NOT NULL,
    "admin_id"      TEXT         NOT NULL,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- @updatedAt is maintained by Prisma, not by the database: no default.
    "updated_at"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- These two are the ask, not decoration. `get_attendance_stats` and
-- `list_inactive_members` both filter by gym over a date range, and the agent runs
-- several of those per answer while somebody watches it stream. Without the
-- composite index each one seq-scans a table that will hold ~100k rows.
CREATE INDEX IF NOT EXISTS "check_ins_admin_id_checked_in_at_idx"
    ON "check_ins" ("admin_id", "checked_in_at");
CREATE INDEX IF NOT EXISTS "check_ins_member_id_checked_in_at_idx"
    ON "check_ins" ("member_id", "checked_in_at");

-- ---------------------------------------------------------------- feedbacks
CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id"              TEXT         NOT NULL,
    "member_id"       TEXT         NOT NULL,
    "admin_id"        TEXT         NOT NULL,
    "content"         TEXT         NOT NULL,
    "rating"          INTEGER,
    -- Both nullable: Dahani writes the row when the member submits, then fills
    -- these in from POST /internal/sentiment. A feedback that has not been scored
    -- yet is a normal state, not an error.
    "sentiment"       "Sentiment",
    "sentiment_score" DECIMAL(4,3),
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "feedbacks_admin_id_created_at_idx"
    ON "feedbacks" ("admin_id", "created_at");
CREATE INDEX IF NOT EXISTS "feedbacks_member_id_idx"
    ON "feedbacks" ("member_id");

-- ---------------------------------------------------------------- foreign keys
-- RESTRICT, matching every other table in this schema. ADD CONSTRAINT has no
-- IF NOT EXISTS, hence the guards.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_ins_member_id_fkey') THEN
        ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_member_id_fkey"
            FOREIGN KEY ("member_id") REFERENCES "members"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_ins_admin_id_fkey') THEN
        ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_admin_id_fkey"
            FOREIGN KEY ("admin_id") REFERENCES "users"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_member_id_fkey') THEN
        ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_member_id_fkey"
            FOREIGN KEY ("member_id") REFERENCES "members"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_admin_id_fkey') THEN
        ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_admin_id_fkey"
            FOREIGN KEY ("admin_id") REFERENCES "users"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
