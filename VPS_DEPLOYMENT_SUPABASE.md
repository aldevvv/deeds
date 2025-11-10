# 🚀 VPS Deployment Guide - DEEDS with Supabase

Panduan lengkap untuk deploy aplikasi DEEDS ke VPS menggunakan Docker + Supabase sebagai database.

---

## 📋 Prerequisites

### VPS Requirements:
- **RAM**: 2GB minimum (4GB recommended)
- **CPU**: 2 Core
- **Storage**: 20GB
- **OS**: Ubuntu 20.04/22.04 atau Debian 11/12

### Accounts & Services:
- ✅ VPS sudah ready (DigitalOcean, AWS, Vultr, dll)
- ✅ Supabase account (free tier available)
- ✅ Domain (optional, tapi recommended untuk SSL)

---

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Login ke https://supabase.com
2. Click **"New Project"**
3. Pilih organization atau buat baru
4. Isi detail project:
   - **Name**: DEEDS Production
   - **Database Password**: (simpan password ini!)
   - **Region**: Singapore (atau terdekat dengan VPS Anda)
5. Tunggu ~2 menit sampai project ready

### 1.2 Get Database Connection String

1. Go to **Project Settings** > **Database**
2. Scroll ke **Connection String** section
3. Pilih **URI** tab
4. Copy connection string (Session mode):
   ```
   postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

### 1.3 Run Database Migrations

#### Option A: Via Prisma Studio (Recommended)

```bash
# Di local machine
cd backend
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

#### Option B: Via Supabase SQL Editor

1. Go to **SQL Editor** di Supabase Dashboard
2. Run SQL migrations manual (dari file prisma/migrations)

### 1.4 Get Supabase API Keys

1. Go to **Project Settings** > **API**
2. Copy kedua keys ini:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role key** (secret): `eyJhbGci...`

⚠️ **IMPORTANT**: Jangan share service_role key ke public!

---

## 🛠️ Step 2: Setup VPS

### 2.1 Connect to VPS

```bash
ssh root@your-vps-ip
# atau
ssh username@your-vps-ip
```

### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Logout dan login lagi
exit
```

Login kembali ke VPS, verify:

```bash
docker --version
docker compose version
```

### 2.4 Install Git

```bash
sudo apt install git -y
```

---

## 📦 Step 3: Deploy Project

### 3.1 Upload Project ke VPS

#### Option A: Via Git (Recommended)

```bash
cd ~
git clone https://github.com/your-username/deeds.git
cd deeds
```

#### Option B: Upload Manual via SCP

```bash
# Dari local Windows machine
scp -r C:\Users\ASUS\deeds username@your-vps-ip:/home/username/
```

### 3.2 Create .env File

```bash
cd ~/deeds
nano .env
```

Paste konfigurasi berikut (sesuaikan dengan data Anda):

```env
# ===================================
# DEEDS - Production Configuration
# ===================================

# -----------------------------------
# Database - Supabase
# -----------------------------------
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# -----------------------------------
# Backend
# -----------------------------------
JWT_SECRET=your-super-secure-jwt-secret-production-2025
PORT=4000
NODE_ENV=production

# -----------------------------------
# Frontend
# -----------------------------------
FRONTEND_PORT=3000

# IMPORTANT: Ganti dengan IP/Domain VPS Anda
# Option 1: Direct IP
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:4000

# Option 2: With Domain
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Option 3: Single domain with /api path
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# -----------------------------------
# Supabase
# -----------------------------------
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# -----------------------------------
# Deployment Options
# -----------------------------------
# Don't run migrations (managed via Supabase)
RUN_MIGRATIONS=false

# Set to true untuk seed default users (hanya pertama kali)
RUN_SEED=true
```

**Save**: `Ctrl+O` > `Enter` > `Ctrl+X`

### 3.3 Generate Strong Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32
```

Copy hasil dan paste ke `JWT_SECRET` di `.env`

### 3.4 Build & Deploy

```bash
# Build dan start container
docker compose up -d --build
```

**First build memakan waktu 5-10 menit.**

### 3.5 Monitor Logs

```bash
# Follow logs
docker compose logs -f

# Tunggu sampai muncul:
# ✅ Services started successfully!
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```

### 3.6 Verify Deployment

```bash
# Check containers
docker ps

# Test backend
curl http://localhost:4000

# Test frontend
curl http://localhost:3000
```

---

## 🌐 Step 4: Expose ke Internet

### Option 1: Direct Port Access (Quick & Simple)

#### 4.1 Open Firewall

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 4000/tcp  # Backend
sudo ufw enable
```

#### 4.2 Access Aplikasi

- Frontend: `http://YOUR_VPS_IP:3000`
- Backend: `http://YOUR_VPS_IP:4000`

---

### Option 2: Nginx Reverse Proxy (Recommended for Production)

#### 4.1 Install Nginx

```bash
sudo apt install nginx -y
```

#### 4.2 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/deeds
```

**For Separate Subdomains:**

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**For Single Domain with /api:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    client_max_body_size 50M;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 4.3 Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/deeds /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Open firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### 4.4 Update .env with Domain

```bash
nano .env
```

Update `NEXT_PUBLIC_API_URL`:

```env
# For separate subdomains
NEXT_PUBLIC_API_URL=http://api.yourdomain.com

# For single domain with /api path
# NEXT_PUBLIC_API_URL=http://yourdomain.com/api
```

Restart container:

```bash
docker compose down
docker compose up -d
```

---

## 🔒 Step 5: Setup SSL (HTTPS)

### 5.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Get SSL Certificate

```bash
# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API subdomain (if using separate subdomain)
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts:
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS (option 2)

### 5.3 Update .env with HTTPS

```bash
nano .env
```

Update:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# or
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

Restart:

```bash
docker compose down
docker compose up -d
```

### 5.4 Test SSL

Visit: `https://yourdomain.com` - Should see padlock icon 🔒

### 5.5 Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renews every 90 days via systemd timer
sudo systemctl status certbot.timer
```

---

## 👥 Step 6: Access & Login

### Default Accounts (setelah seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pln.co.id | admin123 |
| User | user@pln.co.id | password123 |
| Administrator | administrator@pln.co.id | administrator123 |

⚠️ **PENTING: Ganti semua default passwords setelah login pertama kali!**

---

## 🔄 Step 7: Updates & Maintenance

### Update Code

```bash
cd ~/deeds

# Pull latest code
git pull

# Rebuild dan restart
docker compose down
docker compose up -d --build
```

### View Logs

```bash
# All logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Only app container
docker compose logs -f app
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

### Backup Database

Supabase automatically backs up your database daily (for paid plans).

**Manual Backup:**

```bash
# Backup via pg_dump
pg_dump "postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" > backup_$(date +%Y%m%d).sql
```

Or use Supabase Dashboard:
- Go to **Database** > **Backups**
- Download backup

---

## 📊 Step 8: Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats deeds-app
```

### Disk Usage

```bash
# Docker disk usage
docker system df

# VPS disk usage
df -h
```

### PM2 Inside Container

```bash
# Access container
docker exec -it deeds-app sh

# PM2 status
pm2 status

# PM2 logs
pm2 logs

# PM2 monitoring
pm2 monit

# Exit
exit
```

---

## 🐛 Troubleshooting

### Backend Can't Connect to Supabase

**Check 1: DATABASE_URL Correct?**

```bash
# Verify DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
docker exec -it deeds-app sh
cd backend
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<< "SELECT 1;"
```

**Check 2: Supabase Firewall**

Supabase should allow all IPs by default. Check:
- Dashboard > Project Settings > Database > Connection Pooling

**Check 3: Container Logs**

```bash
docker compose logs -f app | grep -i error
```

### Frontend Can't Connect to Backend

**Check NEXT_PUBLIC_API_URL:**

```bash
cat .env | grep NEXT_PUBLIC_API_URL
```

Must match your domain/IP setup:
- `http://YOUR_VPS_IP:4000` (if no nginx)
- `https://api.yourdomain.com` (if nginx with subdomain)
- `https://yourdomain.com/api` (if nginx with path)

### Migrations Not Applied

**Run manually:**

```bash
# Access container
docker exec -it deeds-app sh

# Run migrations
cd /app/backend
npx prisma migrate deploy

exit
```

### Seed Not Working

**Run manually:**

```bash
docker exec -it deeds-app sh
cd /app/backend
npx prisma db seed
exit
```

### Port Already in Use

```bash
# Check what's using port
sudo lsof -i :3000
sudo lsof -i :4000

# Kill process
sudo kill -9 PID
```

### Out of Memory

```bash
# Check memory
free -h

# If low, add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 🔐 Security Best Practices

### 1. Secure Environment Variables

```bash
# Protect .env file
chmod 600 .env

# Never commit .env to git
echo ".env" >> .gitignore
```

### 2. Strong Secrets

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Use strong Supabase database password
```

### 3. Firewall Configuration

```bash
# Minimal open ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Don't expose 3000/4000 if using nginx reverse proxy
```

### 4. Regular Updates

```bash
# Update system monthly
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

### 5. Supabase Security

- Enable **Row Level Security (RLS)** policies
- Use **service_role key** only on backend (never expose to frontend)
- Enable **2FA** on Supabase account
- Review **Database Logs** regularly

---

## 📝 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start services |
| `docker compose down` | Stop services |
| `docker compose logs -f` | View logs |
| `docker compose restart` | Restart services |
| `docker compose up -d --build` | Rebuild & restart |
| `docker ps` | List containers |
| `docker exec -it deeds-app sh` | Access container |
| `sudo nginx -t` | Test nginx config |
| `sudo systemctl restart nginx` | Restart nginx |
| `sudo certbot renew` | Renew SSL certificate |

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Supabase project created
- [ ] Database connection string obtained
- [ ] Supabase API keys obtained
- [ ] Migrations run on Supabase
- [ ] VPS ready (2GB RAM minimum)
- [ ] Docker installed on VPS
- [ ] Domain DNS pointed to VPS (if using domain)

### Deployment
- [ ] Project uploaded to VPS
- [ ] `.env` file configured correctly
- [ ] `DATABASE_URL` correct (Supabase connection string)
- [ ] `NEXT_PUBLIC_API_URL` set to domain/IP
- [ ] `JWT_SECRET` generated & set
- [ ] `SUPABASE_URL` & `SUPABASE_KEY` set
- [ ] `docker compose up -d --build` successful
- [ ] Container running (`docker ps`)
- [ ] Backend accessible
- [ ] Frontend accessible

### Post-Deployment
- [ ] Nginx configured (if using)
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Default passwords changed
- [ ] Test all features working
- [ ] Monitoring setup

---

## 🆘 Need Help?

### Common Issues:

1. **"Can't connect to Supabase"**
   - Verify `DATABASE_URL` correct
   - Check Supabase project is active
   - Test connection manually

2. **"Frontend can't connect to backend"**
   - Check `NEXT_PUBLIC_API_URL` correct
   - Verify backend running: `curl http://localhost:4000`
   - Check nginx config if using reverse proxy

3. **"Migrations failed"**
   - Run manually: `docker exec -it deeds-app npx prisma migrate deploy`
   - Or manage migrations via Supabase Dashboard

4. **"Port already in use"**
   - Check: `sudo lsof -i :PORT`
   - Kill process or change port in `.env`

---

## 🎉 Done!

Aplikasi DEEDS Anda sekarang sudah berjalan di VPS dengan Supabase sebagai database!

**Access URLs:**
- Frontend: `https://yourdomain.com` or `http://YOUR_VPS_IP:3000`
- Backend: `https://api.yourdomain.com` or `http://YOUR_VPS_IP:4000`

**Next Steps:**
1. Login dengan akun default
2. Ganti semua default passwords
3. Setup monitoring & alerts
4. Configure automated backups
5. Test all features thoroughly

**Happy Deploying! 🚀**
