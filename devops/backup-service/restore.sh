#!/bin/sh
set -e

BACKUP_DIR="/backups"

if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/gymflow_*.dump 2>/dev/null | head -1)
fi

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: No backup file found in $BACKUP_DIR"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: File not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Restoring from: $BACKUP_FILE"

# Terminate active connections
PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h db \
  -U "$POSTGRES_USER" \
  -d postgres \
  --no-password \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();"

# Drop and recreate the database
PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h db \
  -U "$POSTGRES_USER" \
  -d postgres \
  --no-password \
  -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\";"

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h db \
  -U "$POSTGRES_USER" \
  -d postgres \
  --no-password \
  -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"

# Restore using pg_restore (matches pg_dump -Fc custom format)
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
  -h db \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-password \
  -F c \
  -v \
  "$BACKUP_FILE"

echo "[$(date)] Restore complete."