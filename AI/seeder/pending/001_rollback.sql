-- Removes the shadow schema. Run this BEFORE applying Dahani's real migration,
-- so `prisma migrate deploy` finds a clean slate and creates the tables itself.
--
--   psql -U admin -d ft_transcendence -f seeder/pending/001_rollback.sql
--   cd ../backend && npx prisma migrate deploy
--
-- The AI service will then refuse to boot if his shape differs from what
-- app/db/schema.py expects, naming the column. That is the intended behaviour.

DROP TABLE IF EXISTS "check_ins";
DROP TABLE IF EXISTS "feedbacks";
DROP TYPE  IF EXISTS "Sentiment";
