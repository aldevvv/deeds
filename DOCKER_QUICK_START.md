# 🐳 Docker Quick Start - DEEDS Project

Panduan step-by-step setup Docker untuk menjalankan Frontend & Backend dalam 1 container.

---

## 📋 Prerequisites

1. **Docker Desktop** sudah terinstall dan running
   - Download: https://www.docker.com/products/docker-desktop/
   - Pastikan Docker Desktop sudah berjalan (cek icon di system tray)

2. **Git Bash / Command Prompt / PowerShell** (sudah ada di Windows)

---

## 🚀 Step-by-Step Setup

### **Step 1: Buka Docker Desktop**

- Buka aplikasi **Docker Desktop**
- Tunggu sampai status berubah menjadi **"Running"**
- Pastikan di kiri bawah ada tulisan "Engine running"

---

### **Step 2: Buka Terminal di Folder Project**

```bash
# Masuk ke folder project
cd C:\Users\ASUS\deeds
```

Atau klik kanan di folder `deeds` > **"Open in Terminal"** / **"Git Bash Here"**

---

### **Step 3: Build & Run Docker Container**

Jalankan perintah ini:

```bash
docker-compose up --build
```

**Apa yang terjadi:**
- ✅ Download image Node.js & PostgreSQL
- ✅ Build Frontend (Next.js) 
- ✅ Build Backend (NestJS)
- ✅ Setup PostgreSQL database
- ✅ Run migrations & setup database
- ✅ Start Frontend di port 3000
- ✅ Start Backend di port 4000

**Proses ini memakan waktu 5-10 menit pertama kali.**

Tunggu sampai muncul log seperti ini:
```
deeds-app      | Starting Backend service on port 4000...
deeds-app      | Starting Frontend service on port 3000...
deeds-app      | Services started successfully!
```

---

### **Step 4: Akses Aplikasi**

Buka browser dan akses:

**Frontend:**
```
http://localhost:3000
```

**Backend API:**
```
http://localhost:4000
```

**Database:**
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `deeds`

---

### **Step 5: Login ke Aplikasi**

Gunakan salah satu akun berikut:

**👤 User Biasa:**
- Email: `user@pln.co.id`
- Password: `password123`

**👨‍💼 Admin:**
- Email: `admin@pln.co.id`
- Password: `admin123`

**🔐 Administrator:**
- Email: `administrator@pln.co.id`
- Password: `administrator123`

---

## 🛑 Stop Docker Container

### Cara 1: Via Terminal (Ctrl+C tidak cukup)

```bash
# Stop containers
docker-compose down
```

### Cara 2: Via Docker Desktop

1. Buka **Docker Desktop**
2. Masuk ke tab **"Containers"**
3. Klik tombol **Stop** di container `deeds-app` dan `deeds-postgres`

---

## 🔄 Start Ulang (Tanpa Rebuild)

Jika sudah pernah build, jalankan tanpa `--build`:

```bash
docker-compose up
```

Atau run di background (tanpa log di terminal):

```bash
docker-compose up -d
```

---

## 📊 Cek Status & Logs

### Cek Container Running

```bash
docker ps
```

Atau buka **Docker Desktop** > **Containers**

### Lihat Logs

```bash
# Semua logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Logs untuk app saja
docker-compose logs -f app

# Logs untuk database saja
docker-compose logs -f postgres
```

---

## 🗄️ Database Management

### Akses Database via Terminal

```bash
docker exec -it deeds-postgres psql -U postgres -d deeds
```

Setelah masuk, bisa jalankan SQL queries:
```sql
\dt                    -- List semua tables
SELECT * FROM "User";  -- Query users
\q                     -- Keluar
```

### Run Seed Data (Isi Data Dummy)

```bash
docker exec -it deeds-app sh -c "cd /app/backend && npx prisma db seed"
```

### Reset Database (Hati-hati!)

```bash
# Stop dan hapus database
docker-compose down -v

# Start ulang (akan buat database baru)
docker-compose up --build
```

---

## 🔧 Troubleshooting

### ❌ Port Already in Use (Port 3000/4000 sudah dipakai)

**Solusi 1: Matikan aplikasi yang pakai port tersebut**

Cari process yang pakai port:
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :4000
```

Matikan process (ganti PID dengan nomor dari hasil di atas):
```bash
taskkill /PID [nomor_PID] /F
```

**Solusi 2: Ganti port di `docker-compose.yml`**

Edit file `docker-compose.yml`, ubah ports:
```yaml
ports:
  - "3001:3000"  # Frontend jadi port 3001
  - "4001:4000"  # Backend jadi port 4001
```

---

### ❌ Docker Build Failed / Error saat Build

```bash
# Clean semua dan rebuild
docker-compose down -v
docker system prune -a --volumes
docker-compose up --build
```

---

### ❌ Database Connection Failed

```bash
# Restart postgres container
docker-compose restart postgres

# Cek logs postgres
docker-compose logs postgres
```

---

### ❌ Frontend/Backend Not Starting

```bash
# Cek logs
docker-compose logs -f app

# Masuk ke container untuk debug
docker exec -it deeds-app sh
pm2 logs
```

---

## 📦 Cleanup (Hapus Semua)

Jika ingin hapus semua container, images, dan volumes:

```bash
# Stop dan hapus containers + volumes
docker-compose down -v

# Hapus images
docker rmi deeds-app deeds-postgres postgres:16-alpine

# Atau hapus semua unused images/containers (hati-hati!)
docker system prune -a --volumes
```

---

## 🎯 Commands Reference

| Perintah | Deskripsi |
|----------|-----------|
| `docker-compose up --build` | Build & start semua services |
| `docker-compose up` | Start services (tanpa rebuild) |
| `docker-compose up -d` | Start di background |
| `docker-compose down` | Stop semua services |
| `docker-compose down -v` | Stop + hapus volumes |
| `docker-compose logs -f` | Lihat logs real-time |
| `docker-compose restart` | Restart semua services |
| `docker ps` | Lihat container yang running |
| `docker exec -it deeds-app sh` | Masuk ke app container |

---

## 🎨 Docker Desktop Interface

### Containers Tab
- Lihat semua container yang running
- Start/Stop/Restart containers
- Lihat logs
- Masuk ke terminal container

### Images Tab
- Lihat semua Docker images
- Delete unused images

### Volumes Tab
- Lihat database volumes
- Delete volumes (hati-hati, data akan hilang)

---

## ✅ Checklist Setup

- [ ] Docker Desktop terinstall dan running
- [ ] Terminal/Command Prompt di folder project
- [ ] Jalankan `docker-compose up --build`
- [ ] Tunggu sampai selesai (5-10 menit)
- [ ] Buka http://localhost:3000
- [ ] Login dengan akun test
- [ ] ✨ **Done!** Aplikasi sudah berjalan

---

## 🆘 Butuh Bantuan?

1. Cek logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Clean start: `docker-compose down -v && docker-compose up --build`

---

## 📝 Catatan Penting

⚠️ **Data Database:**
- Data disimpan di Docker volume `postgres_data`
- Akan tetap ada meskipun stop container
- Akan hilang jika jalankan `docker-compose down -v`

⚠️ **Environment Variables:**
- Default sudah di-set di `docker-compose.yml`
- Untuk production, ganti `JWT_SECRET` di `.env`

⚠️ **Ports:**
- Frontend: 3000
- Backend: 4000
- PostgreSQL: 5432
- Pastikan ports ini tidak dipakai aplikasi lain

---

**🎉 Selamat! Aplikasi DEEDS sudah berjalan di Docker!**
