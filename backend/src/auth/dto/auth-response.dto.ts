import { Role, AdminTitle } from '@prisma/client';

export class AuthResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  adminTitle?: AdminTitle;
  accessToken: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  adminTitle?: AdminTitle;
  createdAt: Date;
  updatedAt: Date;
}
