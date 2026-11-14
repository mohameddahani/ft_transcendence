#!/bin/sh
set -e

# Write the crontab from env var (default: every day at 2am)
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"

echo "$BACKUP_SCHEDULE /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

echo "Backup scheduled: $BACKUP_SCHEDULE"
echo "Next run: $(date -d "tomorrow 02:00" 2>/dev/null || echo 'check container logs')"

# Run one immediate backup on startup so we can verify it works right away
echo "Running initial backup..."
/usr/local/bin/backup.sh

# Start cron in foreground
exec crond -f -l 2