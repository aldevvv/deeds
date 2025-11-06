import { SetMetadata } from '@nestjs/common';
import { Role, AdminTitle } from '@prisma/client';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const AdminTitles = (...titles: AdminTitle[]) => SetMetadata('adminTitles', titles);
