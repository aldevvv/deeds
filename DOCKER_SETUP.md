# Docker Setup Guide - DEEDS Project

Setup Docker untuk menjalankan Frontend (Next.js) dan Backend (NestJS) dalam satu deployment.

## Prerequisites

- Docker Desktop terinstall (https://www.docker.com/products/docker-desktop/)
- Docker Compose terinstall (sudah include di Docker Desktop)

## Struktur Docker

Project ini menggunakan:
- **1 Container App**: Berisi Frontend (Next.js) dan Backend (NestJS)
- **1 Container Database**: PostgreSQL
- **PM2**: Process manager untuk menjalankan frontend & backend secara bersamaan

## File Docker yang Dibuat

```
deeds/
├── Dockerfile              # Multi-stage build untuk frontend & backend
├── docker-compose.yml      # Orchestration untuk semua services
├── docker-start.sh         # Script untuk start frontend & backend
├── .dockerignore          # Files yang diabaikan saat build
└── .env.docker            # Template environment variables
```

## Quick Start

### 1. Setup Environment Variables (Opsional)

Jika ingin custom environment variables:

```bash
# Copy template
cp .env.docker .env

# Edit .env sesuai kebutuhan (optional)
```

### 2. Build dan Run

```bash
# Build dan start semua services
docker-compose up --build

# Atau run di background
docker-compose up -d --build
```

### 3. Akses Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Database**: localhost:5432 (credentials: postgres/postgres)

## Commands

### Start Services

```bash
# Start dengan logs
docker-compose up

# Start di background
docker-compose up -d

# Rebuild dan start
docker-compose up --build
```

### Stop Services

```bash
# Stop services
docker-compose down

# Stop dan hapus volumes (HATI-HATI: data database akan hilang)
docker-compose down -v
```

### View Logs

```bash
# Semua logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Logs untuk service tertentu
docker-compose logs -f app
docker-compose logs -f postgres
```

### Access Container

```bash
# Access app container
docker exec -it deeds-app sh

# Access postgres container
docker exec -it deeds-postgres psql -U postgres -d deeds
```

### Database Management

```bash
# Run migrations
docker exec -it deeds-app sh -c "cd /app/backend && npx prisma migrate deploy"

# Run seed
docker exec -it deeds-app sh -c "cd /app/backend && npx prisma db seed"

# Prisma studio (untuk inspect database)
docker exec -it deeds-app sh -c "cd /app/backend && npx prisma studio"
```

## Environment Variables

### Database
- `DATABASE_URL`: Auto-configured to use PostgreSQL container

### Backend
- `JWT_SECRET`: Secret key untuk JWT authentication
- `PORT`: Backend port (default: 4000)
- `NODE_ENV`: Environment mode (default: production)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `FRONTEND_PORT`: Frontend port (default: 3000)

### Supabase (Opsional)
- `SUPABASE_URL`: Supabase project URL (untuk file storage)
- `SUPABASE_KEY`: Supabase service role key

## Production Deployment

### Docker Hub

```bash
# Login
docker login

# Tag image
docker tag deeds-app:latest yourusername/deeds-app:latest

# Push
docker push yourusername/deeds-app:latest
```

### Deploy ke Server

```bash
# Di server, pull image
docker pull yourusername/deeds-app:latest

# Run dengan docker-compose
docker-compose up -d
```

### Deploy ke Cloud Platform

#### 1. Render.com / Railway
- Upload repository ke GitHub
- Connect GitHub repository
- Set environment variables
- Deploy otomatis dari Dockerfile

#### 2. Digital Ocean App Platform
```bash
doctl apps create --spec .do/app.yaml
```

#### 3. AWS ECS / GCP Cloud Run
```bash
# Build untuk platform
docker buildx build --platform linux/amd64 -t deeds-app .

# Push ke registry
docker tag deeds-app:latest gcr.io/your-project/deeds-app
docker push gcr.io/your-project/deeds-app
```

## Troubleshooting

### Port Already in Use

```bash
# Cek port yang digunakan
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Stop process atau ubah port di docker-compose.yml
```

### Database Connection Failed

```bash
# Restart postgres container
docker-compose restart postgres

# Check postgres logs
docker-compose logs postgres
```

### Build Failed

```bash
# Clean build
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Frontend/Backend Not Starting

```bash
# Check logs
docker-compose logs -f app

# Access container untuk debug
docker exec -it deeds-app sh
pm2 logs
```

## Performance Tips

1. **Multi-stage Build**: Menggunakan multi-stage untuk ukuran image lebih kecil
2. **Layer Caching**: Dependencies di-copy terlebih dahulu untuk optimize cache
3. **PM2**: Menggunakan PM2 untuk manage process dengan auto-restart
4. **Health Check**: Container health check untuk ensure aplikasi ready

## Security Notes

1. **Environment Variables**: Jangan commit `.env` file ke Git
2. **Database Credentials**: Ganti default postgres credentials di production
3. **JWT Secret**: Gunakan secret key yang kuat di production
4. **Supabase Keys**: Protect service role key, jangan expose di client

## Backup & Restore

### Backup Database

```bash
docker exec deeds-postgres pg_dump -U postgres deeds > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i deeds-postgres psql -U postgres deeds
```

## Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats deeds-app
```

### PM2 Monitoring (inside container)

```bash
docker exec -it deeds-app pm2 monit
docker exec -it deeds-app pm2 status
```

## Support

Jika ada masalah:
1. Check logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Rebuild: `docker-compose up --build`
4. Clean start: `docker-compose down -v && docker-compose up --build`
