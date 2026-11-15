-- Role that can create and update rows in membership_rewards. It cannot delete anything.
-- psql -v rewards_user=... -v rewards_password=... -f membership_rewards_writer.sql

SELECT format('CREATE ROLE %I LOGIN', :'rewards_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'rewards_user')
\gexec

ALTER ROLE :"rewards_user" PASSWORD :'rewards_password';

-- start from zero, so re-running never leaves an old grant behind
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM :"rewards_user";
REVOKE ALL ON SCHEMA public FROM :"rewards_user";

GRANT CONNECT ON DATABASE :"DBNAME" TO :"rewards_user";
GRANT USAGE ON SCHEMA public TO :"rewards_user";

GRANT SELECT, INSERT, UPDATE ON membership_rewards TO :"rewards_user";

-- tables created later stay unreadable until they are granted here
ALTER DEFAULT PRIVILEGES FOR ROLE :"USER" IN SCHEMA public
    REVOKE ALL ON TABLES FROM :"rewards_user";