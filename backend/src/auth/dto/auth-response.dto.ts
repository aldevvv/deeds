import { Role, AdminTitle } from '@prisma/client';

export class AuthResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  adminTitle?: AdminTitle;
  accessToken: string;
  isApproved: boolean;
}

export class UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  adminTitle?: AdminTitle;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
