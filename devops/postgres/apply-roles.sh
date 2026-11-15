#!/bin/sh
set -e

: "${POSTGRES_USER:?POSTGRES_USER is not set}"
: "${POSTGRES_DB:?POSTGRES_DB is not set}"
: "${PGPASSWORD:?PGPASSWORD is not set}"
: "${AI_DB_USER:?AI_DB_USER is not set}"
: "${AI_DB_USER_PASSWORD:?AI_DB_USER_PASSWORD is not set}"
: "${REWARDS_DB_USER:?REWARDS_DB_USER is not set}"
: "${REWARDS_DB_PASSWORD:?REWARDS_DB_PASSWORD is not set}"

echo "Applying role grants..."

psql -v ON_ERROR_STOP=1 \
  -h db -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v ai_user="$AI_DB_USER" \
  -v ai_password="$AI_DB_USER_PASSWORD" \
  -f /roles/ai_readonly.sql

psql -v ON_ERROR_STOP=1 \
  -h db -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v rewards_user="$REWARDS_DB_USER" \
  -v rewards_password="$REWARDS_DB_PASSWORD" \
  -f /roles/membership_rewards_writer.sql

echo "Role grants applied."