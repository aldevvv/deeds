@echo off
echo Setting up DEEDS database...
echo.

echo Step 1: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Failed to generate Prisma client
    pause
    exit /b %errorlevel%
)
echo.

echo Step 2: Pushing schema to database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo Failed to push schema. Make sure PostgreSQL is running and database 'deeds' exists.
    pause
    exit /b %errorlevel%
)
echo.

echo Step 3: Seeding database with default users...
call npx prisma db seed
if %errorlevel% neq 0 (
    echo Failed to seed database
    pause
    exit /b %errorlevel%
)
echo.

echo Database setup completed successfully!
echo.
echo Default credentials:
echo User: user@pln.co.id / password123
echo Admin: admin@pln.co.id / admin123
echo Administrator: administrator@pln.co.id / administrator123
echo.
pause
