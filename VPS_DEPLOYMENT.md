# 🚀 VPS Deployment Guide - DEEDS Project

Panduan lengkap untuk deploy aplikasi DEEDS ke VPS menggunakan Docker.

---

## 📋 Prerequisites VPS

### Spesifikasi Minimum VPS:
- **RAM**: 2GB (4GB recommended)
- **CPU**: 2 Core
- **Storage**: 20GB
- **OS**: Ubuntu 20.04/22.04 atau Debian 11/12

### Software yang Harus Terinstall:
- Docker Engine
- Docker Compose
- Git
- Nginx (optional, untuk SSL/reverse proxy)

---

## 🛠️ Step 1: Setup VPS

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (agar tidak perlu sudo)
sudo usermod -aG docker $USER

# Logout dan login lagi agar group changes berlaku
exit
```

Login kembali ke VPS, lalu verify:

```bash
docker --version
docker compose version
```

### 1.3 Install Git

```bash
sudo apt install git -y
```

---

## 📦 Step 2: Clone & Setup Project

### 2.1 Clone Repository

```bash
# Clone project
cd ~
git clone https://github.com/your-username/deeds.git
cd deeds
```

Atau upload project manual:

```bash
# Dari local machine, upload ke VPS
scp -r C:\Users\ASUS\deeds user@your-vps-ip:/home/user/
```

### 2.2 Setup Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit dengan nano/vim
nano .env
```

**Konfigurasi untuk VPS:**

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=super_secure_password_123
POSTGRES_DB=deeds
POSTGRES_PORT=5432

# Database URL (sesuaikan dengan POSTGRES_USER & PASSWORD)
DATABASE_URL=postgresql://postgres:super_secure_password_123@postgres:5432/deeds

# JWT Secret (WAJIB GANTI!)
JWT_SECRET=your-super-secret-jwt-production-key-2025

# Backend
PORT=4000
NODE_ENV=production

# Frontend
FRONTEND_PORT=3000

# PENTING: Ganti dengan IP/Domain VPS Anda
# Contoh: http://103.123.45.67:4000 atau https://api.yourdomain.com
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:4000

# Supabase (opsional)
SUPABASE_URL=https://ossyddagofazosudutbv.supabase.co
SUPABASE_KEY=your_supabase_key_here

# Seed database dengan user default
RUN_SEED=true
```

**⚠️ IMPORTANT:**
- Ganti `YOUR_VPS_IP` dengan IP public VPS Anda
- Ganti `JWT_SECRET` dengan string random yang kuat
- Ganti `POSTGRES_PASSWORD` dengan password yang aman

Untuk generate JWT secret:
```bash
openssl rand -base64 32
```

---

## 🚀 Step 3: Deploy dengan Docker

### 3.1 Build & Run

```bash
# Build dan start containers
docker compose up -d --build
```

**Apa yang terjadi:**
- ✅ Build Docker image (5-10 menit pertama kali)
- ✅ Create PostgreSQL container
- ✅ Create App container (Frontend + Backend)
- ✅ Run database migrations
- ✅ Seed database (jika RUN_SEED=true)
- ✅ Start services

### 3.2 Monitor Logs

```bash
# Lihat logs real-time
docker compose logs -f

# Lihat logs app saja
docker compose logs -f app

# Lihat logs postgres
docker compose logs -f postgres
```

### 3.3 Verify Deployment

```bash
# Cek containers running
docker ps

# Test backend
curl http://localhost:4000

# Test frontend
curl http://localhost:3000
```

---

## 🌐 Step 4: Expose ke Internet

### Option 1: Direct Access (Simple)

Buka firewall untuk port 3000 dan 4000:

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp
sudo ufw enable
```

Akses aplikasi:
- Frontend: `http://YOUR_VPS_IP:3000`
- Backend: `http://YOUR_VPS_IP:4000`

### Option 2: Nginx Reverse Proxy (Recommended)

#### 4.1 Install Nginx

```bash
sudo apt install nginx -y
```

#### 4.2 Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/deeds
```

Paste konfigurasi berikut:

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
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
    server_name api.your-domain.com;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:4000;
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
```

**Atau jika backend di path `/api`:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
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
        proxy_set_header X-Forwarded-Proto $scheme;
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
```

#### 4.4 Update .env

Sesuaikan `NEXT_PUBLIC_API_URL` di `.env`:

```env
# Jika menggunakan subdomain terpisah
NEXT_PUBLIC_API_URL=http://api.your-domain.com

# Jika menggunakan path /api
NEXT_PUBLIC_API_URL=http://your-domain.com/api
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
# Untuk domain utama
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Untuk API subdomain
sudo certbot --nginx -d api.your-domain.com
```

### 5.3 Update .env dengan HTTPS

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
# atau
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

Restart:

```bash
docker compose down
docker compose up -d
```

### 5.4 Auto-Renewal Test

```bash
# Test renewal
sudo certbot renew --dry-run
```

Certbot akan auto-renew setiap 90 hari.

---

## 🔄 Step 6: Update & Maintenance

### Update Code

```bash
# Pull latest code
cd ~/deeds
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

# Specific service
docker compose logs -f app
docker compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart app only
docker compose restart app
```

### Database Backup

```bash
# Backup
docker exec deeds-postgres pg_dump -U postgres deeds > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250115.sql | docker exec -i deeds-postgres psql -U postgres deeds
```

### Clean Up

```bash
# Stop containers
docker compose down

# Remove unused images/volumes
docker system prune -a

# Remove specific volume (WARNING: data loss!)
docker volume rm deeds_postgres_data
```

---

## 📊 Step 7: Monitoring

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

# Exit container
exit
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :4000

# Kill process
sudo kill -9 PID
```

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check docker status
docker ps -a

# Rebuild from scratch
docker compose down -v
docker system prune -a
docker compose up -d --build
```

### Database Connection Failed

```bash
# Check postgres logs
docker compose logs postgres

# Restart postgres
docker compose restart postgres

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Frontend Can't Connect to Backend

1. Check `NEXT_PUBLIC_API_URL` di `.env`
2. Make sure backend is running: `curl http://localhost:4000`
3. Check firewall rules
4. Check nginx config if using reverse proxy

### Out of Memory

```bash
# Check memory
free -h

# Restart containers
docker compose restart

# Upgrade VPS if needed
```

---

## 🔐 Security Best Practices

### 1. Change Default Passwords

```env
# Strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
```

### 2. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Hide Internal Ports

Jika menggunakan Nginx, tutup port 3000 dan 4000:

```bash
# docker-compose.yml - comment out port mapping
# ports:
#   - "3000:3000"
#   - "4000:4000"
```

### 4. Regular Updates

```bash
# Update system monthly
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

### 5. Backup Strategy

```bash
# Automated daily backup
crontab -e

# Add this line (backup at 2 AM daily)
0 2 * * * cd ~/deeds && docker exec deeds-postgres pg_dump -U postgres deeds > ~/backups/deeds_$(date +\%Y\%m\%d).sql
```

---

## 📝 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start services in background |
| `docker compose down` | Stop services |
| `docker compose logs -f` | View logs real-time |
| `docker compose restart` | Restart all services |
| `docker compose ps` | List running containers |
| `docker compose exec app sh` | Access app container |
| `docker system prune -a` | Clean unused Docker data |
| `sudo nginx -t` | Test nginx config |
| `sudo systemctl restart nginx` | Restart nginx |
| `sudo certbot renew` | Renew SSL certificate |

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [ ] VPS ready (2GB RAM minimum)
- [ ] Docker & Docker Compose installed
- [ ] Domain pointed to VPS IP (for SSL)
- [ ] `.env` file configured
- [ ] `NEXT_PUBLIC_API_URL` set correctly
- [ ] Strong JWT_SECRET generated
- [ ] Strong database password set

### Deployment
- [ ] Project cloned/uploaded to VPS
- [ ] `docker compose up -d --build` executed
- [ ] Containers running (`docker ps`)
- [ ] Database migrated successfully
- [ ] Database seeded (if RUN_SEED=true)
- [ ] Frontend accessible
- [ ] Backend API responding

### Post-Deployment
- [ ] Nginx configured (if used)
- [ ] SSL certificate installed (if used)
- [ ] Firewall configured
- [ ] Backup strategy set up
- [ ] Monitoring in place
- [ ] Test all features working

---

## 🆘 Need Help?

### Common Issues:

1. **"Cannot connect to backend"**
   - Check `NEXT_PUBLIC_API_URL` in `.env`
   - Verify backend is running: `curl http://localhost:4000`

2. **"Database connection failed"**
   - Check `DATABASE_URL` in `.env`
   - Verify postgres is running: `docker compose ps`

3. **"Port already in use"**
   - Check what's using the port: `sudo lsof -i :PORT`
   - Kill the process or change port in `.env`

4. **"Out of memory"**
   - Upgrade VPS to minimum 2GB RAM
   - Check memory usage: `free -h`

5. **"Build failed"**
   - Check internet connection
   - Clean Docker cache: `docker system prune -a`
   - Retry build

---

## 🎉 Done!

Aplikasi DEEDS Anda sekarang sudah berjalan di VPS dan accessible dari internet!

**Access URLs:**
- Frontend: `http://your-vps-ip:3000` or `https://your-domain.com`
- Backend: `http://your-vps-ip:4000` or `https://api.your-domain.com`

**Default Login:**
- Admin: `admin@pln.co.id` / `admin123`
- User: `user@pln.co.id` / `password123`

**⚠️ IMPORTANT: Change default passwords after first login!**
