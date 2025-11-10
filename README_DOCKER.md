# 🐳 DEEDS - Docker Deployment

Docker setup untuk DEEDS project dengan Supabase sebagai database.

---

## 🎯 Quick Start

### 1. Setup Environment

DEEDS menggunakan environment variables terpisah untuk Backend dan Frontend, tapi untuk Docker **cukup 1 file `.env` di root**:

```bash
# Copy template
cp .env.example .env

# Edit dengan credentials Anda
nano .env
```

**Yang perlu diisi:**
- `DATABASE_URL` - Dari Supabase Dashboard
- `SUPABASE_URL` - Dari Supabase Dashboard  
- `SUPABASE_KEY` - Dari Supabase Dashboard
- `JWT_SECRET` - Generate dengan `openssl rand -base64 32`
- `NEXT_PUBLIC_API_URL` - URL API Anda (http://localhost:4000 untuk local, http://YOUR_VPS_IP:4000 untuk VPS)

**Lihat:** [ENV_SETUP.md](./ENV_SETUP.md) untuk panduan lengkap environment variables.

### 2. Deploy dengan Docker

```bash
docker compose up -d --build
```

### 3. Access

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

**Default Login:**
- Admin: `admin@pln.co.id` / `admin123`
- User: `user@pln.co.id` / `password123`

---

## 📂 File Structure

```
deeds/
├── .env                          # ⭐ Main config (Docker Compose)
├── .env.example                  # Template untuk .env
│
├── backend/
│   ├── .env                      # Auto-generated dari root .env
│   └── .env.example              # Template (untuk manual dev)
│
├── frontend/
│   ├── .env.local                # Auto-generated dari root .env
│   └── .env.example              # Template (untuk manual dev)
│
├── Dockerfile                    # Multi-stage build
├── docker-compose.yml            # Docker Compose config
├── docker-compose.prod.yml       # Production config
├── docker-start.sh               # Startup script
└── nginx.conf                    # Nginx reverse proxy
```

### Environment Files Explained:

| File | Usage | Auto-Generated? |
|------|-------|-----------------|
| `.env` (root) | **Docker Compose** - berisi semua variables | ❌ Manual create |
| `backend/.env` | Backend NestJS | ✅ Yes, from root `.env` |
| `frontend/.env.local` | Frontend Next.js | ✅ Yes, from root `.env` |

**💡 Untuk Docker, cukup edit `.env` di root!**

---

## 🚀 Deployment Options

### Local Development

```bash
# Setup
cp .env.example .env
nano .env  # Edit dengan Supabase credentials

# Deploy
docker compose up -d --build

# Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

### VPS Production

**Complete guide:** [VPS_DEPLOYMENT_SUPABASE.md](./VPS_DEPLOYMENT_SUPABASE.md)

```bash
# 1. Setup Supabase (via dashboard)
# 2. Connect to VPS
ssh user@your-vps-ip

# 3. Install Docker
curl -fsSL https://get.docker.com | sh

# 4. Clone project
git clone your-repo
cd deeds

# 5. Configure
cp .env.example .env
nano .env  # Set Supabase credentials & NEXT_PUBLIC_API_URL

# 6. Deploy
docker compose up -d --build

# 7. Setup Nginx + SSL (optional)
# See VPS_DEPLOYMENT_SUPABASE.md
```

---

## 🛠️ Common Commands

```bash
# Start containers
docker compose up -d

# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Rebuild
docker compose up -d --build

# Clean restart (removes data!)
docker compose down -v
docker compose up -d --build

# Access container shell
docker exec -it deeds-app sh
```

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [ENV_SETUP.md](./ENV_SETUP.md) | **Environment variables guide** ⭐ |
| [VPS_DEPLOYMENT_SUPABASE.md](./VPS_DEPLOYMENT_SUPABASE.md) | Complete VPS deployment guide |
| [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) | Quick reference |
| [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md) | Docker Desktop guide |

---

## 🔧 Architecture

```
┌─────────────────────────────────────┐
│         Docker Container             │
│                                      │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │ │
│  │   Next.js    │  │   NestJS     │ │
│  │   Port 3000  │  │   Port 4000  │ │
│  └──────────────┘  └──────────────┘ │
│         │                  │         │
│         └──────────────────┘         │
│                 │                    │
└─────────────────┼────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │    Supabase    │
         │   PostgreSQL   │
         │   + Storage    │
         └────────────────┘
```

**Benefits:**
- ✅ Single container for both Frontend & Backend
- ✅ No local PostgreSQL needed (using Supabase)
- ✅ Easy deployment to any VPS
- ✅ Production-ready with PM2 process manager
- ✅ Persistent file uploads via Docker volumes

---

## ⚠️ Troubleshooting

### Build Failed

```bash
docker system prune -a
docker compose up -d --build
```

### Frontend Can't Connect to Backend

Check `NEXT_PUBLIC_API_URL` in `.env`:
- Local: `http://localhost:4000`
- VPS: `http://YOUR_VPS_IP:4000` or `https://api.yourdomain.com`

### Backend Can't Connect to Supabase

Check `DATABASE_URL` in `.env`:
- Must be **Session mode** (pooler) connection string
- Verify password is correct

### Environment Variables Not Updating

NEXT_PUBLIC_* variables are baked at build time:
```bash
docker compose down
docker compose up -d --build
```

---

## 🔐 Security Notes

1. **Never commit .env files**
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Use strong secrets in production**
   ```bash
   openssl rand -base64 32
   ```

3. **Protect Supabase service_role key**
   - Only use in backend
   - Never expose to frontend

4. **Use HTTPS in production**
   - Setup SSL with Certbot
   - See [VPS_DEPLOYMENT_SUPABASE.md](./VPS_DEPLOYMENT_SUPABASE.md)

---

## 📊 Resources

- **Supabase Dashboard**: https://supabase.com
- **Docker Hub**: https://hub.docker.com
- **Nginx Docs**: https://nginx.org/en/docs/

---

## 🆘 Need Help?

1. Check environment setup: [ENV_SETUP.md](./ENV_SETUP.md)
2. Check deployment guide: [VPS_DEPLOYMENT_SUPABASE.md](./VPS_DEPLOYMENT_SUPABASE.md)
3. View logs: `docker compose logs -f`
4. Check container status: `docker ps`

---

**🎉 Happy Deploying!**
