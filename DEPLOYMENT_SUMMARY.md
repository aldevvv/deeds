# 🚀 DEEDS - Docker Deployment Summary

Quick reference untuk deployment project DEEDS dengan Docker + Supabase.

---

## 📦 Files yang Sudah Disiapkan

| File | Deskripsi |
|------|-----------|
| `Dockerfile` | Multi-stage build untuk Frontend + Backend |
| `docker-compose.yml` | Local/VPS deployment (Supabase database) |
| `docker-compose.prod.yml` | Production VPS deployment (recommended) |
| `docker-start.sh` | Startup script (Prisma generate, seed, PM2) |
| `.env.example` | Template environment variables untuk Supabase |
| `nginx.conf` | Nginx reverse proxy config |
| `deploy-vps.sh` | Quick deployment script |
| `VPS_DEPLOYMENT_SUPABASE.md` | **Panduan lengkap deployment VPS + Supabase** ⭐ |
| `DOCKER_QUICK_START.md` | Panduan Docker local development |

---

## 🎯 Quick Start

### Prerequisites

1. **Supabase Account** (free tier available)
   - Create project di https://supabase.com
   - Get `DATABASE_URL` dari Project Settings > Database
   - Get `SUPABASE_URL` & `SUPABASE_KEY` dari Project Settings > API

2. **Docker** installed (Desktop untuk local, Engine untuk VPS)

### Local Development (Docker Desktop)

```bash
# 1. Setup environment
cp .env.example .env
nano .env  # Edit sesuai Supabase credentials

# 2. Configure .env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-xxx.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_API_URL=http://localhost:4000
RUN_SEED=true  # Untuk seed default users

# 3. Build & run
docker compose up -d --build

# 4. Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

### VPS Production (with Supabase)

**Panduan lengkap: [VPS_DEPLOYMENT_SUPABASE.md](./VPS_DEPLOYMENT_SUPABASE.md)**

```bash
# 1. Setup Supabase (via dashboard)
# - Create project
# - Get connection strings & API keys

# 2. Setup VPS
ssh user@your-vps-ip
curl -fsSL https://get.docker.com | sh

# 3. Deploy
cd ~
git clone https://github.com/your-repo/deeds.git
cd deeds

# 4. Configure .env
cp .env.example .env
nano .env  # Set DATABASE_URL, SUPABASE_URL, SUPABASE_KEY, NEXT_PUBLIC_API_URL

# 5. Build & Run
docker compose up -d --build

# 6. Setup Nginx + SSL (optional)
sudo apt install nginx certbot python3-certbot-nginx -y
sudo cp nginx.conf /etc/nginx/sites-available/deeds
sudo ln -s /etc/nginx/sites-available/deeds /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ⚙️ Environment Variables Penting

```env
# Database - Supabase Connection
# Get from Supabase Dashboard > Project Settings > Database
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-xxx.pooler.supabase.com:5432/postgres

# Supabase API
# Get from Supabase Dashboard > Project Settings > API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_supabase_service_role_key

# JWT Secret (WAJIB ganti untuk production!)
JWT_SECRET=your-super-secret-jwt-key

# Frontend API URL (sesuaikan dengan domain/IP VPS)
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:4000
# atau: https://api.yourdomain.com
# atau: https://yourdomain.com/api

# Deployment options
RUN_MIGRATIONS=false  # Usually false for Supabase
RUN_SEED=true  # Set true untuk seed default users (hanya pertama kali)
```

**Cara dapat Supabase credentials:**
1. Login ke https://supabase.com
2. Pilih project Anda
3. **DATABASE_URL**: Settings > Database > Connection String (URI, Session mode)
4. **SUPABASE_URL**: Settings > API > Project URL
5. **SUPABASE_KEY**: Settings > API > service_role key (secret)

---

## 🔐 Default Login (setelah seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pln.co.id | admin123 |
| User | user@pln.co.id | password123 |
| Administrator | administrator@pln.co.id | administrator123 |

⚠️ **Ganti password setelah login pertama kali!**

---

## 📊 Common Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f

# Restart
docker compose restart

# Rebuild
docker compose up -d --build

# Clean restart
docker compose down -v
docker compose up -d --build

# Database backup
docker exec deeds-postgres pg_dump -U postgres deeds > backup.sql

# Database restore
cat backup.sql | docker exec -i deeds-postgres psql -U postgres deeds
```

---

## 🌐 Deployment Options

### Option 1: Direct Port Access (Simple)

```bash
# .env
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:4000

# Access
Frontend: http://YOUR_VPS_IP:3000
Backend:  http://YOUR_VPS_IP:4000
```

### Option 2: Nginx Reverse Proxy (Recommended)

**Separate Subdomains:**
```bash
# .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Access
Frontend: https://yourdomain.com
Backend:  https://api.yourdomain.com
```

**Single Domain with /api path:**
```bash
# .env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Access
Frontend: https://yourdomain.com
Backend:  https://yourdomain.com/api
```

---

## 🔧 Production Checklist

### Pre-Deployment
- [ ] `.env` configured dengan values production
- [ ] `POSTGRES_PASSWORD` diganti dengan password kuat
- [ ] `JWT_SECRET` diganti dengan key random & kuat
- [ ] `NEXT_PUBLIC_API_URL` sesuai dengan domain/IP VPS
- [ ] Domain sudah pointing ke VPS IP (jika pakai domain)

### Deployment
- [ ] Docker & Docker Compose terinstall di VPS
- [ ] Project uploaded/cloned ke VPS
- [ ] `docker compose up -d --build` berhasil
- [ ] Containers running (`docker ps`)
- [ ] Frontend & Backend accessible

### Post-Deployment
- [ ] Nginx reverse proxy configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Firewall configured
- [ ] Backup strategy setup
- [ ] Default passwords diganti
- [ ] Test semua fitur

---

## 🆘 Troubleshooting

### Build Failed
```bash
docker system prune -a
docker compose up -d --build
```

### Can't Connect to Backend
1. Check `NEXT_PUBLIC_API_URL` di `.env`
2. Verify: `curl http://localhost:4000`
3. Check firewall rules

### Database Connection Error
1. Check `DATABASE_URL` di `.env`
2. Check postgres running: `docker compose ps`
3. Check logs: `docker compose logs postgres`

### Port Already in Use
```bash
# Check port usage
sudo lsof -i :3000
sudo lsof -i :4000

# Kill process
sudo kill -9 PID
```

---

## 📚 Documentation

- **Local Development**: [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md)
- **VPS Deployment**: [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)
- **Environment Config**: [.env.example](./.env.example)
- **Nginx Config**: [nginx.conf](./nginx.conf)

---

## 🎯 Next Steps

1. ✅ Setup Docker (sudah selesai)
2. 📝 Configure `.env` sesuai environment Anda
3. 🚀 Deploy ke VPS dengan `docker compose up -d --build`
4. 🌐 Setup domain & SSL (optional, tapi recommended)
5. 🔐 Ganti default passwords
6. 📊 Setup monitoring & backup

---

## 💡 Tips

1. **Development**: Gunakan `docker-compose.yml`
2. **Production**: Gunakan `docker-compose.prod.yml`
3. **Quick Deploy**: Gunakan `deploy-vps.sh`
4. **Always backup**: Database sebelum update/migration
5. **Monitor logs**: `docker compose logs -f`
6. **Security**: Ganti semua default passwords & secrets

---

**🎉 Ready to Deploy!**

Semua file Docker sudah siap. Ikuti panduan di [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) untuk deployment lengkap ke VPS.
