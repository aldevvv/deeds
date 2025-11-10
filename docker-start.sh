#!/bin/sh
set -e

echo "🚀 Starting Docker container..."

# Create backend .env file from environment variables
echo "📝 Creating backend .env file..."
cd /app/backend
cat > .env << EOF
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET="${JWT_SECRET}"
PORT=${PORT:-4000}
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_KEY}"
EOF

# Create frontend .env.local file from environment variables
echo "📝 Creating frontend .env.local file..."
cd /app/frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
BACKEND_API_URL=${BACKEND_API_URL:-http://127.0.0.1:4000}
EOF

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
