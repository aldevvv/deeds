# Multi-stage build untuk Frontend dan Backend dalam satu image

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code (including .env.local if exists)
COPY frontend/ ./

# Build frontend with environment variables
# Note: NEXT_PUBLIC_* vars need to be set at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build backend
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine AS production
WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy backend build dan dependencies
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/next.config.ts ./frontend/

# Copy .env files (will be created at runtime if not exist)
# Backend .env
RUN mkdir -p /app/backend
# Frontend .env.local will be created from ENV vars

# Copy startup script
COPY docker-start.sh ./
RUN chmod +x docker-start.sh

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose ports
EXPOSE 3000 4000

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV FRONTEND_PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start both services
CMD ["./docker-start.sh"]
