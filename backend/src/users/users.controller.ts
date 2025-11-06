import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, AdminTitle } from '@prisma/client';

class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;

  @IsEnum(AdminTitle)
  @IsOptional()
  adminTitle?: AdminTitle;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMINISTRATOR)
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRATOR)
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/role')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, dto.role, dto.adminTitle);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATOR)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
