import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, AdminTitle } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredTitles = this.reflector.getAllAndOverride<AdminTitle[]>('adminTitles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredTitles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (requiredTitles && user.role === Role.ADMIN) {
      if (!user.adminTitle || !requiredTitles.includes(user.adminTitle)) {
        throw new ForbiddenException('Insufficient admin title');
      }
    }

    return true;
  }
}
