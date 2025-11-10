# 🚀 Manual VPS Deployment (Tanpa Docker)

Panduan lengkap deploy DEEDS ke VPS Ubuntu tanpa Docker menggunakan PM2.

---

## 📋 Prerequisites

- VPS Ubuntu 20.04/22.04 (Min: 2GB RAM, 2 CPU cores)
- Domain/Subdomain (optional tapi recommended)
- Akun Supabase (untuk database)

---

## 🛠️ Step 1: Setup VPS

### 1.1 Connect ke VPS

```bash
ssh ubuntu@your-vps-ip
# atau
ssh root@your-vps-ip
```

### 1.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Node.js 20.x

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version
```

### 1.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Verify
pm2 --version
```

### 1.5 Install Git

```bash
sudo apt install git -y
```

---

## 📦 Step 2: Clone & Setup Project

### 2.1 Clone Project

```bash
cd ~
git clone https://github.com/your-username/deeds.git
cd deeds
```

**Atau upload manual:**
```bash
# Di local machine (Windows)
scp -r C:\Users\ASUS\deeds ubuntu@your-vps-ip:~/
```

### 2.2 Setup Backend

```bash
cd ~/deeds/backend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Paste konfigurasi backend:**
```env
DATABASE_URL="postgresql://postgres.ossyddagofazosudutbv:plnuipmksproduction2025@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="pln-deeds-jwt-secret-key-2025-production"
PORT=4000
SUPABASE_URL="https://ossyddagofazosudutbv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zc3lkZGFnb2Zhem9zdWR1dGJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQxMjQ5NSwiZXhwIjoyMDc3OTg4NDk1fQ.pw2EC53MjgyAa4gDpCHngqqHvvyzrsze7J9pKkX7NM0"
```

**Save:** `Ctrl+O` > `Enter` > `Ctrl+X`

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (optional, jika pakai Supabase biasanya skip)
# npx prisma migrate deploy

# Seed database (first time only)
npx prisma db seed

# Build backend
npm run build
```

### 2.3 Setup Frontend

```bash
cd ~/deeds/frontend

# Install dependencies
npm install

# Create .env.local file
nano .env.local
```

**Paste konfigurasi frontend:**
```env
NEXT_PUBLIC_API_URL=https://api.deeds.id
BACKEND_API_URL=http://localhost:4000
```

⚠️ **IMPORTANT**: Ganti `https://api.deeds.id` dengan domain/IP VPS Anda:
- Jika pakai domain: `https://api.yourdomain.com`
- Jika tanpa domain: `http://YOUR_VPS_IP:4000`

**Save:** `Ctrl+O` > `Enter` > `Ctrl+X`

```bash
# Build frontend
npm run build
```

---

## 🚀 Step 3: Start Services dengan PM2

### 3.1 Start Backend

```bash
cd ~/deeds/backend

# Start with PM2
pm2 start npm --name "deeds-backend" -- run start:prod

# Atau langsung jalankan built file
pm2 start dist/main.js --name "deeds-backend"
```

### 3.2 Start Frontend

```bash
cd ~/deeds/frontend

# Start with PM2
pm2 start npm --name "deeds-frontend" -- start
```

### 3.3 Verify Services Running

```bash
# Check PM2 status
pm2 status

# Should see:
# ┌─────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┬
# │ id  │ name               │ mode        │ ↺       │ status  │ cpu      │
# ├─────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┤
# │ 0   │ deeds-backend      │ fork        │ 0       │ online  │ 0%       │
# │ 1   │ deeds-frontend     │ fork        │ 0       │ online  │ 0%       │
# └─────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┘

# View logs
pm2 logs

# View specific service logs
pm2 logs deeds-backend
pm2 logs deeds-frontend
```

### 3.4 Save PM2 Configuration

```bash
# Save current PM2 processes
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy & run the command that appears (sudo ...)
```

---

## 🌐 Step 4: Setup Nginx Reverse Proxy

### 4.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 4.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/deeds
```

**Paste konfigurasi:**

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

⚠️ **Ganti `deeds.id` dengan domain Anda!**

**Save:** `Ctrl+O` > `Enter` > `Ctrl+X`

### 4.3 Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/deeds /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### 4.4 Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
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
sudo certbot --nginx -d deeds.id -d www.deeds.id

# For API subdomain
sudo certbot --nginx -d api.deeds.id
```

Follow prompts:
- Enter email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 5.3 Test SSL Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Certbot will auto-renew certificates before expiry.

### 5.4 Update Frontend .env.local

```bash
cd ~/deeds/frontend
nano .env.local
```

**Update to HTTPS:**
```env
NEXT_PUBLIC_API_URL=https://api.deeds.id
BACKEND_API_URL=http://localhost:4000
```

**Rebuild frontend:**
```bash
npm run build

# Restart frontend
pm2 restart deeds-frontend
```

---

## ✅ Step 6: Verify Deployment

### 6.1 Check Services

```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# Check ports
sudo netstat -tlnp | grep -E ':(3000|4000|80|443)'
```

### 6.2 Test URLs

```bash
# Test backend (local)
curl http://localhost:4000

# Test frontend (local)
curl http://localhost:3000

# Test via domain (if using Nginx)
curl http://deeds.id
curl http://api.deeds.id

# Test via HTTPS (if SSL setup)
curl https://deeds.id
curl https://api.deeds.id
```

### 6.3 Access from Browser

- **Frontend**: https://deeds.id
- **Backend API**: https://api.deeds.id

**Login dengan:**
- Admin: `admin@pln.co.id` / `admin123`
- User: `user@pln.co.id` / `password123`

---

## 🔄 Step 7: Update & Maintenance

### 7.1 Update Code

```bash
cd ~/deeds

# Pull latest code
git pull

# Update backend
cd backend
npm install
npx prisma generate
npm run build
pm2 restart deeds-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart deeds-frontend
```

### 7.2 View Logs

```bash
# PM2 logs (all)
pm2 logs

# Specific service
pm2 logs deeds-backend
pm2 logs deeds-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 7.3 Restart Services

```bash
# Restart specific service
pm2 restart deeds-backend
pm2 restart deeds-frontend

# Restart all
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx
```

### 7.4 Stop Services

```bash
# Stop specific service
pm2 stop deeds-backend
pm2 stop deeds-frontend

# Stop all
pm2 stop all

# Delete from PM2
pm2 delete deeds-backend
pm2 delete deeds-frontend
```

---

## 🗄️ Step 8: Database Management

### 8.1 Run Migrations

```bash
cd ~/deeds/backend
npx prisma migrate deploy
```

### 8.2 Seed Database

```bash
cd ~/deeds/backend
npx prisma db seed
```

### 8.3 Prisma Studio (Database GUI)

```bash
cd ~/deeds/backend
npx prisma studio
```

Then access via SSH tunnel:
```bash
# On local machine
ssh -L 5555:localhost:5555 ubuntu@your-vps-ip
```

Open browser: http://localhost:5555

---

## 📊 Step 9: Monitoring

### 9.1 PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Status
pm2 status

# Memory/CPU usage
pm2 list
```

### 9.2 System Resources

```bash
# CPU & Memory
htop

# Disk usage
df -h

# Memory usage
free -h
```

### 9.3 Setup PM2 Monitoring Dashboard (Optional)

```bash
# Link to PM2.io (free)
pm2 link <secret_key> <public_key>
```

Get keys from: https://app.pm2.io/

---

## 🐛 Troubleshooting

### Issue 1: Backend Won't Start

**Check logs:**
```bash
pm2 logs deeds-backend
```

**Common issues:**
- Port 4000 already in use
- Missing environment variables
- Prisma Client not generated

**Solution:**
```bash
cd ~/deeds/backend
npx prisma generate
pm2 restart deeds-backend
```

### Issue 2: Frontend Shows "Cannot connect to backend"

**Check:**
1. `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
2. Backend is running: `pm2 status`
3. Nginx proxy is working: `sudo nginx -t`

**Solution:**
```bash
cd ~/deeds/frontend
nano .env.local
# Fix NEXT_PUBLIC_API_URL
npm run build
pm2 restart deeds-frontend
```

### Issue 3: "npm install" Fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue 4: Port Already in Use

**Check what's using the port:**
```bash
sudo lsof -i :4000
sudo lsof -i :3000
```

**Kill process:**
```bash
sudo kill -9 <PID>
```

### Issue 5: Out of Memory

**Check memory:**
```bash
free -h
```

**Add swap space:**
```bash
# Create 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Issue 6: SSL Certificate Failed

**Check DNS:**
```bash
nslookup deeds.id
nslookup api.deeds.id
```

Make sure domain points to VPS IP.

**Retry:**
```bash
sudo certbot --nginx -d deeds.id -d www.deeds.id --force-renewal
```

---

## 🔐 Security Best Practices

### 1. Setup Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
```

Change:
```
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 3. Keep System Updated

```bash
# Weekly updates
sudo apt update && sudo apt upgrade -y
```

### 4. Setup Fail2Ban (Optional)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5. Backup Strategy

```bash
# Automated daily backup script
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/backups

mkdir -p $BACKUP_DIR

# Backup database (via Supabase - use pg_dump with connection string)
# pg_dump "your_connection_string" > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files (if any)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ~/deeds/uploads/

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add:
# 0 2 * * * /home/ubuntu/backup.sh >> /home/ubuntu/backup.log 2>&1
```

---

## 📝 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | Check all services status |
| `pm2 logs` | View all logs |
| `pm2 restart all` | Restart all services |
| `pm2 save` | Save PM2 configuration |
| `sudo nginx -t` | Test Nginx config |
| `sudo systemctl restart nginx` | Restart Nginx |
| `sudo certbot renew` | Renew SSL certificates |
| `htop` | System resource monitor |
| `df -h` | Check disk space |

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] VPS ready (2GB+ RAM)
- [ ] Domain DNS pointing to VPS IP
- [ ] Node.js 20.x installed
- [ ] PM2 installed
- [ ] Nginx installed

### Deployment
- [ ] Project cloned/uploaded
- [ ] `backend/.env` configured
- [ ] `frontend/.env.local` configured
- [ ] Backend dependencies installed & built
- [ ] Frontend dependencies installed & built
- [ ] Backend started with PM2
- [ ] Frontend started with PM2
- [ ] PM2 saved & startup configured

### Post-Deployment
- [ ] Nginx configured
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Services accessible via domain
- [ ] Test login with default accounts
- [ ] Change default passwords
- [ ] Setup monitoring
- [ ] Setup backup strategy

---

## 🎉 Done!

Aplikasi DEEDS Anda sekarang sudah running di VPS tanpa Docker!

**Access:**
- Frontend: https://deeds.id
- Backend API: https://api.deeds.id

**Default Login:**
- Admin: `admin@pln.co.id` / `admin123`
- User: `user@pln.co.id` / `password123`

**⚠️ IMPORTANT: Ganti semua default passwords setelah login!**

---

## 🆘 Need Help?

- Check PM2 logs: `pm2 logs`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check system resources: `htop`
- Restart services: `pm2 restart all`

**Happy Deploying! 🚀**
