# DEEDS Setup Instructions

## Prerequisites
- PostgreSQL installed and running on localhost:5432
- Node.js and npm installed

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies (if not done):
```bash
npm install
```

3. Make sure `.env` file exists in backend directory with the following content:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deeds?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=3001
```
Update the DATABASE_URL with your PostgreSQL credentials if different.

4. Setup database (create database named 'deeds' in PostgreSQL):
```sql
CREATE DATABASE deeds;
```

5. **EASY WAY (Windows)**: Run the setup script:
```bash
setup-db.bat
```

**OR MANUAL WAY**:

5a. Generate Prisma Client:
```bash
npx prisma generate
```

5b. Push schema to database:
```bash
npx prisma db push
```

5c. Seed database with default users:
```bash
npx prisma db seed
```

6. Start backend server:
```bash
npm run start:dev
```

Backend will run on http://localhost:3001

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not done):
```bash
npm install
```

3. Make sure `.env.local` file exists in frontend directory with:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start frontend:
```bash
npm run dev
```

Frontend will run on http://localhost:3000

## Default Login Credentials

### User Account
- Email: user@pln.co.id
- Password: password123

### Admin Account
- Email: admin@pln.co.id
- Password: admin123

### Administrator Account
- Email: administrator@pln.co.id
- Password: administrator123

## Database Configuration

The default database URL is set in `backend/.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/deeds?schema=public"
```

Update this with your PostgreSQL credentials if different.

## Troubleshooting

### Cannot login
- Make sure PostgreSQL is running
- Make sure database 'deeds' exists
- Make sure you ran `npx prisma db push`
- Make sure you ran `npx prisma db seed` to create default users
- Check backend logs for errors

### Backend not starting
- Check if port 3001 is available
- Check PostgreSQL connection
- Check if `.env` file exists in backend directory

### Frontend not starting
- Check if port 3000 is available
- Make sure backend is running first
