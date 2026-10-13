#!/bin/sh
set -e

# Check the variable is actually set
if [ -z "$DISCORD_WEBHOOK_URL" ]; then
  echo "ERROR: DISCORD_WEBHOOK_URL is not set"
  exit 1
fi

# Replace placeholder with the real URL and write to a temp file
sed "s|DISCORD_WEBHOOK_URL_PLACEHOLDER|$DISCORD_WEBHOOK_URL|g" \
  /etc/alertmanager/alertmanager.yml \
  > /tmp/alertmanager-resolved.yml

echo "Alertmanager config ready, starting..."

# Hand off to the real alertmanager binary
exec /bin/alertmanager \
  --config.file=/tmp/alertmanager-resolved.yml \
  "$@"