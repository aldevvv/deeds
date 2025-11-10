#!/bin/sh
set -e

echo "🚀 Starting Docker container..."

# Check if .env files exist
cd /app/backend
if [ ! -f .env ]; then
  echo "⚠️  Warning: backend/.env not found!"
  echo "Please make sure backend/.env exists with required variables."
  exit 1
fi

cd /app/frontend
if [ ! -f .env.local ]; then
  echo "⚠️  Warning: frontend/.env.local not found!"
  echo "Please make sure frontend/.env.local exists with NEXT_PUBLIC_API_URL."
  exit 1
fi

echo "✅ Environment files found"
cd /app/backend

# Generate Prisma Client (required for Supabase connection)
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations only if RUN_MIGRATIONS=true (usually false for Supabase)
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy
else
  echo "⏭️  Skipping migrations (set RUN_MIGRATIONS=true if needed)"
fi

# Run seed if RUN_SEED=true
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
else
  echo "⏭️  Skipping database seed (set RUN_SEED=true to enable)"
fi

# Start backend dengan PM2
echo "🔧 Starting Backend service on port ${PORT:-4000}..."
cd /app/backend
pm2 start dist/main.js --name backend

# Wait for backend to initialize
sleep 5

# Start frontend dengan PM2
echo "🎨 Starting Frontend service on port ${FRONTEND_PORT:-3000}..."
cd /app/frontend
pm2 start npm --name frontend -- start

# Keep container running and show logs
echo "✅ Services started successfully!"
echo ""
echo "Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "Backend:  http://localhost:${PORT:-4000}"
echo ""

pm2 logs
