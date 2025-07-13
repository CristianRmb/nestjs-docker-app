#!/bin/sh

echo "🔥 Starting NestJS App..."

if [ "$RESET_DB" = "true" ]; then
  echo "🧨 Resetting DB..."
  npx prisma migrate reset --force --skip-seed
else
  echo "📦 Running DB migrations..."
  npx prisma migrate deploy
fi

echo "🚀 Launching app"
npm run start:prod
