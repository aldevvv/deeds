import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('pending')
  async getPendingUsers(@Request() req) {
    // Only ADMINISTRATOR can view pending users
    if (req.user.role !== Role.ADMINISTRATOR) {
      throw new ForbiddenException('Only administrators can view pending users');
    }
    return this.usersService.getPendingUsers();
  }

  @Post(':userId/approve')
  @HttpCode(HttpStatus.OK)
  async approveUser(@Request() req, @Param('userId') userId: string) {
    // Only ADMINISTRATOR can approve users
    if (req.user.role !== Role.ADMINISTRATOR) {
      throw new ForbiddenException('Only administrators can approve users');
    }
    return this.usersService.approveUser(userId);
  }

  @Post(':userId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectUser(@Request() req, @Param('userId') userId: string) {
    // Only ADMINISTRATOR can reject users
    if (req.user.role !== Role.ADMINISTRATOR) {
      throw new ForbiddenException('Only administrators can reject users');
    }
    return this.usersService.rejectUser(userId);
  }
}
