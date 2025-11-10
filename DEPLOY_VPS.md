# 🚀 Quick VPS Deployment Guide

Panduan singkat deploy ke VPS Ubuntu (sudah punya file `.env`).

---

## ✅ Prerequisites

- VPS Ubuntu ready (IP: sesuaikan dengan VPS Anda)
- Docker sudah terinstall
- File `backend/.env` dan `frontend/.env.local` sudah siap

---

## 📋 Step-by-Step

### 1. Connect ke VPS

```bash
ssh ubuntu@your-vps-ip
```

### 2. Clone/Upload Project

**Option A: Via Git**
```bash
cd ~
git clone your-repo-url deeds
cd deeds
```

**Option B: Upload dari Local (di local machine)**
```bash
scp -r C:\Users\ASUS\deeds ubuntu@your-vps-ip:~/
```

### 3. Setup Environment Files

Pastikan kedua file ini ada dan sudah di-configure:

```bash
cd ~/deeds

# Check backend .env
ls -la backend/.env
cat backend/.env

# Check frontend .env.local
ls -la frontend/.env.local
cat frontend/.env.local
```

**Yang harus ada:**

**`backend/.env`:**
```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-xxx.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-jwt-secret"
PORT=4000
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="eyJhbGci..."
```

**`frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=https://api.deeds.id
BACKEND_API_URL=http://localhost:4000
```

⚠️ **PENTING**: `NEXT_PUBLIC_API_URL` harus sesuai dengan domain/IP VPS Anda!

### 4. (Optional) Create root .env for Docker Options

```bash
# Hanya untuk opsi deployment (RUN_SEED, port mapping, dll)
nano .env
```

Isi (optional):
```env
RUN_SEED=true
RUN_MIGRATIONS=false
FRONTEND_PORT=3000
BACKEND_PORT=4000
```

### 5. Build & Deploy

```bash
docker compose up -d --build
```

**Proses ini memakan waktu 5-10 menit.**

### 6. Monitor Logs

```bash
# Follow logs
docker compose logs -f

# Tunggu sampai:
# ✅ Environment files found
# 📦 Generating Prisma Client...
# 🔧 Starting Backend service...
# 🎨 Starting Frontend service...
# ✅ Services started successfully!
```

### 7. Verify

```bash
# Check containers
docker ps

# Test backend
curl http://localhost:4000

# Test frontend
curl http://localhost:3000
```

---

## 🌐 Setup Nginx (Optional tapi Recommended)

### Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/deeds
```

Paste config:

```nginx
# Frontend
server {
    listen 80;
    server_name deeds.id www.deeds.id;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.deeds.id;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/deeds /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d deeds.id -d www.deeds.id
sudo certbot --nginx -d api.deeds.id
```

---

## 🔄 Update Code

```bash
cd ~/deeds

# Pull latest code
git pull

# Rebuild
docker compose down
docker compose up -d --build
```

---

## 🛠️ Common Commands

```bash
# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Clean restart
docker compose down -v
docker compose up -d --build
```

---

## 🐛 Troubleshooting

### Build Fails - "backend/.env not found"

**Solution:**
```bash
# Make sure file exists
ls -la backend/.env

# If not, create it
nano backend/.env
# Paste your credentials
```

### Frontend Can't Connect to Backend

**Solution:**
Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`:
- Must be accessible from browser
- Should be: `https://api.deeds.id` or `http://YOUR_VPS_IP:4000`

**Rebuild required:**
```bash
docker compose down
docker compose up -d --build
```

### Backend Can't Connect to Supabase

**Solution:**
Check `DATABASE_URL` in `backend/.env`:
- Verify connection string is correct
- Check Supabase project is active

---

## ✅ Checklist

- [ ] VPS ready & Docker installed
- [ ] `backend/.env` configured
- [ ] `frontend/.env.local` configured
- [ ] `NEXT_PUBLIC_API_URL` set to production domain
- [ ] Run `docker compose up -d --build`
- [ ] Services running (`docker ps`)
- [ ] Nginx configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Test frontend & backend accessible

---

**🎉 Done! Your app is now live!**
