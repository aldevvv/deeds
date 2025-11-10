# Quick Start Guide - DEEDS

## Prerequisites
✅ PostgreSQL running on localhost:5432
✅ Node.js installed

## Setup in 3 Steps

### 1. Create PostgreSQL Database
```sql
CREATE DATABASE deeds;
```

### 2. Setup Backend
```bash
cd backend
npm install
setup-db.bat
npm run start:dev
```

### 3. Setup Frontend (in new terminal)
```bash
cd frontend
npm install
npm run dev
```

## Login

Open http://localhost:3000 and login with:

**User Account:**
- Email: `user@pln.co.id`
- Password: `password123`

**Admin Account:**
- Email: `admin@pln.co.id`
- Password: `admin123`

**Administrator Account:**
- Email: `administrator@pln.co.id`
- Password: `administrator123`

---

## Troubleshooting

### "Cannot connect to database"
- Make sure PostgreSQL is running
- Check credentials in `backend/.env`

### "Invalid credentials" when logging in
- Run `npx prisma db seed` in backend directory
- Make sure database was created successfully

### Backend/Frontend not starting
- Check if ports 3000 and 3001 are available
- Kill existing processes if needed

For detailed setup instructions, see [SETUP.md](./SETUP.md)
