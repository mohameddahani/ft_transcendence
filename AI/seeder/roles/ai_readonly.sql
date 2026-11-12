-- psql -v ai_user=... -v ai_password=... -f ai_readonly.sql

-- create the role only if missing (\gexec runs the generated statement)
SELECT format('CREATE ROLE %I LOGIN', :'ai_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'ai_user')
\gexec

ALTER ROLE :"ai_user" PASSWORD :'ai_password';

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM :"ai_user";
REVOKE ALL ON SCHEMA public FROM :"ai_user";

GRANT CONNECT ON DATABASE :"DBNAME" TO :"ai_user";
GRANT USAGE ON SCHEMA public TO :"ai_user";

GRANT SELECT ON
    memberships, membership_plans, membership_plan_durations, payments
TO :"ai_user";

GRANT SELECT (
    id, admin_id, first_name, last_name, phone_number, email,
    gender, birth_date, account_status, created_at
) ON members TO :"ai_user";

GRANT SELECT (id, company_name, role, account_status) ON users TO :"ai_user";

GRANT SELECT (
    id, admin_id, member_id, membership_id, attendance_method, checked_in_at
) ON attendances TO :"ai_user";

GRANT SELECT ON feedbacks TO :"ai_user";

GRANT SELECT (id, admin_id, role, account_status) ON staffs TO :"ai_user";

GRANT SELECT (admin_id, day_of_week, start_time, end_time, is_closed) ON working_hours TO :"ai_user";

GRANT SELECT (admin_id, start_date, end_date, start_time, end_time) ON special_hours TO :"ai_user";

GRANT SELECT (user_id, plan_id, subscription_status, expires_at) ON subscriptions TO :"ai_user";

GRANT SELECT (id, is_active) ON plans TO :"ai_user";

ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
    REVOKE ALL ON TABLES FROM :"ai_user";
