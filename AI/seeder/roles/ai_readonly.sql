-- Read-only role for the AI service: SELECT on the tables it needs, nothing else.
-- Safe to re-run: psql -U admin -d ft_transcendence -f seeder/roles/ai_readonly.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_readonly') THEN
        CREATE ROLE ai_readonly LOGIN PASSWORD 'ai_readonly_dev_pw';
    END IF;
END
$$;

-- start from zero, so re-running never leaves an old grant behind
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ai_readonly;
REVOKE ALL ON SCHEMA public FROM ai_readonly;

GRANT CONNECT ON DATABASE ft_transcendence TO ai_readonly;
GRANT USAGE ON SCHEMA public TO ai_readonly;

GRANT SELECT ON
    memberships,
    membership_plans,
    membership_plan_durations,
    payments
TO ai_readonly;

-- tables with a password column only get the listed columns
GRANT SELECT (
    id, admin_id, first_name, last_name, phone_number, email,
    gender, birth_date, account_status, created_at
) ON members TO ai_readonly;

GRANT SELECT (
    id, company_name, role
) ON users TO ai_readonly;

GRANT SELECT (
    id, admin_id, member_id, membership_id, attendance_method, checked_in_at
) ON attendances TO ai_readonly;

GRANT SELECT ON feedbacks TO ai_readonly;

GRANT SELECT (
    id, admin_id, role, account_status
) ON staffs TO ai_readonly;

-- never granted: visits (qr_token_hash opens the gym door), token tables, passwords
-- tables created later stay unreadable until they are granted here
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
    REVOKE ALL ON TABLES FROM ai_readonly;
