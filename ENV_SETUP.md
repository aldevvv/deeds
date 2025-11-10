# 🔧 Environment Variables Setup Guide

DEEDS menggunakan **3 file environment** yang berbeda:

---

## 📁 File Structure

```
deeds/
├── .env                      # Docker Compose (root level)
├── backend/.env              # Backend NestJS
└── frontend/.env.local       # Frontend Next.js
```

---

## 🐳 For Docker Deployment (Recommended)

### Option 1: Single Root .env File (Easiest)

Untuk Docker deployment, cukup buat **1 file .env di root** yang berisi semua variabel:

```bash
# Di root project
cp .env.example .env
nano .env
```

**File: `.env` (di root)**

```env
# Backend Variables
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-xxx.pooler.supabase.com:5432/postgres
JWT_SECRET=your-super-secret-jwt-key
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend Variables
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:4000
BACKEND_API_URL=http://127.0.0.1:4000

# Docker Options
RUN_MIGRATIONS=false
RUN_SEED=true
FRONTEND_PORT=3000
BACKEND_PORT=4000
```

**Startup script akan otomatis membuat `backend/.env` dan `frontend/.env.local` dari variabel ini!**

---

## 💻 For Local Development (Non-Docker)

Jika ingin run tanpa Docker (development manual), buat 2 file terpisah:

### 1. Backend Environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

**File: `backend/.env`**

```env
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-xxx.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key"
PORT=4000
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Frontend Environment

```bash
cp frontend/.env.example frontend/.env.local
nano frontend/.env.local
```

**File: `frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
BACKEND_API_URL=http://127.0.0.1:4000
```

---

## 🔐 Getting Supabase Credentials

### 1. Database URL

1. Login ke https://supabase.com
2. Pilih project Anda
3. Go to **Settings** > **Database**
4. Scroll ke **Connection String**
5. Pilih tab **URI**
6. Pilih mode **Session** (pooler)
7. Copy connection string:
   ```
   postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

### 2. Supabase URL & Key

1. Go to **Settings** > **API**
2. Copy **Project URL**:
   ```
   https://xxxxx.supabase.co
   ```
3. Copy **service_role key** (secret):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **IMPORTANT**: Service role key adalah SECRET! Jangan expose ke client/frontend!

---

## 🌐 Setting NEXT_PUBLIC_API_URL

Environment variable `NEXT_PUBLIC_API_URL` harus sesuai dengan cara Anda deploy:

### Development (Local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### VPS - Direct Port Access
```env
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:4000
```

### VPS - Nginx Reverse Proxy (Subdomain)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### VPS - Nginx Reverse Proxy (Same Domain)
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

---

## 🚀 Quick Setup Examples

### Docker Local Development

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit .env
nano .env

# 3. Set values:
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_API_URL=http://localhost:4000

# 4. Deploy
docker compose up -d --build
```

### Docker VPS Production

```bash
# 1. Copy template
cp .env.example .env

# 2. Edit .env
nano .env

# 3. Set values:
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key
JWT_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:4000  # or https://api.yourdomain.com
RUN_SEED=true  # First time only

# 4. Deploy
docker compose up -d --build
```

### Manual Local Development

```bash
# 1. Setup backend
cp backend/.env.example backend/.env
nano backend/.env
# Fill: DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_KEY

# 2. Setup frontend
cp frontend/.env.example frontend/.env.local
nano frontend/.env.local
# Fill: NEXT_PUBLIC_API_URL=http://localhost:4000

# 3. Run backend
cd backend
npm install
npm run start:dev

# 4. Run frontend (in new terminal)
cd frontend
npm install
npm run dev
```

---

## 📋 Environment Variables Reference

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres.xxx:pass@...` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with `openssl rand -base64 32` |
| `PORT` | Backend server port | `4000` |
| `NODE_ENV` | Node environment | `production` or `development` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Supabase service role key | `eyJhbGci...` |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Public backend API URL (accessible from browser) | `http://localhost:4000` or `https://api.yourdomain.com` |
| `BACKEND_API_URL` | Internal backend API URL (for server-side calls) | `http://127.0.0.1:4000` |

### Docker Options

| Variable | Description | Default |
|----------|-------------|---------|
| `RUN_MIGRATIONS` | Run Prisma migrations (set false for Supabase) | `false` |
| `RUN_SEED` | Seed database with default users | `false` |
| `FRONTEND_PORT` | Frontend port mapping | `3000` |
| `BACKEND_PORT` | Backend port mapping | `4000` |

---

## ⚠️ Common Issues

### Issue 1: Frontend can't connect to backend

**Symptom**: Frontend shows "Network Error" or "Cannot connect to backend"

**Solution**: Check `NEXT_PUBLIC_API_URL` is correct
- For local: `http://localhost:4000`
- For VPS: Must be accessible from browser (not `http://localhost`)

### Issue 2: Backend can't connect to Supabase

**Symptom**: "Database connection failed" or "P1001: Can't reach database server"

**Solution**: Check `DATABASE_URL` is correct
- Make sure using **Session mode** (pooler) connection string
- Verify password is correct

### Issue 3: NEXT_PUBLIC_API_URL not updating after rebuild

**Symptom**: Frontend still uses old API URL after changing `.env`

**Solution**: NEXT_PUBLIC_* variables are baked at build time
```bash
# For Docker
docker compose down
docker compose up -d --build

# For local development
cd frontend
rm -rf .next
npm run build
npm run dev
```

---

## 🔒 Security Best Practices

1. **Never commit .env files to git**
   ```bash
   # Check .gitignore contains:
   .env
   .env.local
   .env*.local
   backend/.env
   frontend/.env.local
   ```

2. **Use strong secrets in production**
   ```bash
   # Generate strong JWT secret
   openssl rand -base64 32
   ```

3. **Protect Supabase service_role key**
   - Only use in backend
   - Never expose to frontend/client
   - Never commit to git

4. **Use HTTPS in production**
   - Set up SSL certificate
   - Update `NEXT_PUBLIC_API_URL` to use `https://`

---

## ✅ Checklist

### Docker Deployment
- [ ] Created `.env` in root project
- [ ] Set `DATABASE_URL` from Supabase
- [ ] Set `SUPABASE_URL` & `SUPABASE_KEY`
- [ ] Generated strong `JWT_SECRET`
- [ ] Set `NEXT_PUBLIC_API_URL` to VPS IP/domain
- [ ] Set `RUN_SEED=true` for first deployment
- [ ] Run `docker compose up -d --build`
- [ ] Verified frontend & backend accessible

### Manual Development
- [ ] Created `backend/.env`
- [ ] Created `frontend/.env.local`
- [ ] Set all required variables
- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000
- [ ] Can login with test accounts

---

**Need help? Check [VPS_DEPLOYMENT_SUPABASE.md](./VPS_DEPLOYMENT_SUPABASE.md) for complete deployment guide.**
