import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role, AdminTitle } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(AdminTitle)
  @IsOptional()
  adminTitle?: AdminTitle;
}
