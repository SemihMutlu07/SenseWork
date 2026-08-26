#!/bin/sh
set -e

echo "Running database migrations..."
pnpm exec prisma migrate deploy

echo "Seeding database..."
pnpm exec prisma db seed || true

echo "Starting application..."
exec "$@"
