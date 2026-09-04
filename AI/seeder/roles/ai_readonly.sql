-- Read-only Postgres role for the AI service.
--
-- Guardrail #1: the AI service can SELECT the 8 read-model tables in AI_SPECS §2.1
-- and NOTHING else. Not the token tables, not members.password, no INSERT/UPDATE/DELETE
-- anywhere. This is enforced by the database, not by our code -- so a bug in a tool
-- cannot become a data-loss or credential-leak incident.
--
-- Idempotent: safe to re-run. Dahani must apply the equivalent on staging (ask #3).
-- Usage: psql -U admin -d ft_transcendence -f seeder/roles/ai_readonly.sql

-- 1. The role. DO block because CREATE ROLE has no IF NOT EXISTS.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_readonly') THEN
        CREATE ROLE ai_readonly LOGIN PASSWORD 'ai_readonly_dev_pw';
    END IF;
END
$$;

-- 2. Start from zero. Re-running after a table is dropped/renamed must not leave
--    a stale grant behind.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ai_readonly;  -- clears column grants too
REVOKE ALL ON SCHEMA public FROM ai_readonly;

-- 3. May connect and may *look at* the schema, but may not create objects in it.
GRANT CONNECT ON DATABASE ft_transcendence TO ai_readonly;
GRANT USAGE ON SCHEMA public TO ai_readonly;

-- 4. SELECT on exactly the read models. Listed one per line on purpose: this list is
--    the security boundary, so it should be reviewable at a glance and produce a loud
--    error if a table is missing rather than silently granting too much.
GRANT SELECT ON
    memberships,
    membership_plans,
    membership_plan_durations,
    payments
TO ai_readonly;

-- 5. `members` and `users` carry a password hash, so they get COLUMN-level grants only.
--
--    A table-level GRANT cannot be narrowed afterwards: `REVOKE SELECT (password)` only
--    drops a column-level grant, and the table-level one still implies every column. The
--    only way to exclude a column is to never grant the table at all. Consequence, and a
--    useful one: `SELECT *` now fails for this role, forcing every query to name its
--    columns -- which is exactly what the read models in AI_SPECS 2.1 already do.
GRANT SELECT (
    id, admin_id, first_name, last_name, phone_number, email,
    gender, birth_date, account_status, created_at
) ON members TO ai_readonly;

GRANT SELECT (
    id, first_name, last_name, company_name, role, email
) ON users TO ai_readonly;

-- check_ins and feedbacks do not exist yet (Dahani, ask #1). Grant them the moment
-- the migration lands; until then this block is a no-op instead of an error.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'check_ins') THEN
        GRANT SELECT ON check_ins TO ai_readonly;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'feedbacks') THEN
        GRANT SELECT ON feedbacks TO ai_readonly;
    END IF;
END
$$;

-- 6. Future tables must not be auto-granted. Prisma migrations create tables as `admin`;
--    without this, a later ALTER DEFAULT PRIVILEGES elsewhere could widen access silently.
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
    REVOKE ALL ON TABLES FROM ai_readonly;
