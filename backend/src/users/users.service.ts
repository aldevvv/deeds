import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, AdminTitle } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        adminTitle: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        adminTitle: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(
    userId: string,
    role: Role,
    adminTitle?: AdminTitle,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ((role === Role.ADMIN || role === Role.ADMINISTRATOR) && !adminTitle) {
      throw new BadRequestException('Admin role requires an admin title');
    }

    if (role === Role.USER && adminTitle) {
      throw new BadRequestException('User role cannot have admin title');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        adminTitle: role === Role.USER ? null : adminTitle,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        adminTitle: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }
}
