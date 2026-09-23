#!/bin/sh

set -e

echo "running prisma migrations..."
npx prisma migrate deploy

echo "launching backend service..."
exec "$@"