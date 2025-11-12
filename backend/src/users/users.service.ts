import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminTitle } from '@prisma/client';

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
        isApproved: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async getPendingUsers() {
    const users = await this.prisma.user.findMany({
      where: {
        isApproved: false,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        adminTitle: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async updateUserRole(userId: string, updateData: { role: any; adminTitle?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: updateData.role,
        adminTitle: updateData.adminTitle ? (updateData.adminTitle as AdminTitle) : null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        adminTitle: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return {
      message: 'User role updated successfully',
      user: updatedUser,
    };
  }

  async approveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
      },
    });

    return { message: 'User approved successfully' };
  }

  async rejectUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user from database (reject = delete)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User rejected and removed from system' };
  }
}
