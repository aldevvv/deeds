# Auth Module Documentation

## Overview
Auth module untuk sistem DEEDS PLN dengan support role-based access control (RBAC) dan admin title hierarchy.

## User Roles
- **USER**: User biasa
- **ADMIN**: Administrator dengan title jabatan tertentu

## Admin Titles
Khusus untuk user dengan role ADMIN:
- **SENIOR_MANAGER**: Senior Manager
- **MANAGER_SUB_BIDANG**: Manager Sub Bidang
- **ASISTEN_MANAGER**: Asisten Manager

## API Endpoints

### 1. Register
**POST** `/auth/register`

Request Body:
```json
{
  "email": "user@pln.co.id",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "08123456789",
  "role": "USER",           // optional, default: USER
  "adminTitle": null        // optional, required if role is ADMIN
}
```

Response:
```json
{
  "id": "clx1234567890",
  "email": "user@pln.co.id",
  "fullName": "John Doe",
  "phone": "08123456789",
  "role": "USER",
  "adminTitle": null,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login
**POST** `/auth/login`

Request Body:
```json
{
  "email": "user@pln.co.id",
  "password": "password123"
}
```

Response:
```json
{
  "id": "clx1234567890",
  "email": "user@pln.co.id",
  "fullName": "John Doe",
  "phone": "08123456789",
  "role": "USER",
  "adminTitle": null,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get Current User
**GET** `/auth/me`

Headers:
```
Authorization: Bearer <access_token>
```

Response:
```json
{
  "id": "clx1234567890",
  "email": "user@pln.co.id",
  "fullName": "John Doe",
  "phone": "08123456789",
  "role": "USER",
  "adminTitle": null,
  "createdAt": "2025-11-06T00:00:00.000Z",
  "updatedAt": "2025-11-06T00:00:00.000Z"
}
```

## Usage Examples

### Register Admin with Title
```json
{
  "email": "manager@pln.co.id",
  "password": "securepass123",
  "fullName": "Jane Manager",
  "phone": "08123456788",
  "role": "ADMIN",
  "adminTitle": "SENIOR_MANAGER"
}
```

### Using Guards in Controllers

#### Require Authentication
```typescript
@Get('protected')
@UseGuards(JwtAuthGuard)
async protectedRoute(@Request() req) {
  return req.user;
}
```

#### Require Specific Role
```typescript
@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async adminOnly(@Request() req) {
  return 'Admin only content';
}
```

#### Require Specific Admin Title
```typescript
@Get('senior-manager-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@AdminTitles(AdminTitle.SENIOR_MANAGER)
async seniorManagerOnly(@Request() req) {
  return 'Senior manager only content';
}
```

#### Multiple Admin Titles
```typescript
@Get('manager-level')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@AdminTitles(AdminTitle.SENIOR_MANAGER, AdminTitle.MANAGER_SUB_BIDANG)
async managerLevel(@Request() req) {
  return 'Manager level content';
}
```

## Database Schema

```prisma
enum Role {
  USER
  ADMIN
}

enum AdminTitle {
  SENIOR_MANAGER
  MANAGER_SUB_BIDANG
  ASISTEN_MANAGER
}

model User {
  id         String      @id @default(cuid())
  email      String      @unique
  password   String
  fullName   String
  phone      String
  role       Role        @default(USER)
  adminTitle AdminTitle?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@map("users")
}
```

## Notes
- Password di-hash menggunakan SHA-256
- JWT token valid selama 7 hari
- Admin harus memiliki adminTitle
- User biasa tidak boleh memiliki adminTitle
