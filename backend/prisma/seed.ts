import { PrismaClient, Role, AdminTitle } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Start seeding...');

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: 'user@pln.co.id' },
    update: {},
    create: {
      email: 'user@pln.co.id',
      password: hashPassword('password123'),
      fullName: 'User PLN',
      role: Role.USER,
    },
  });
  console.log('Created user:', user);

  // Create default admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pln.co.id' },
    update: {},
    create: {
      email: 'admin@pln.co.id',
      password: hashPassword('admin123'),
      fullName: 'Admin PLN',
      role: Role.ADMIN,
      adminTitle: AdminTitle.MANAGER_SUB_BIDANG,
    },
  });
  console.log('Created admin:', admin);

  // Create default administrator
  const administrator = await prisma.user.upsert({
    where: { email: 'administrator@pln.co.id' },
    update: {},
    create: {
      email: 'administrator@pln.co.id',
      password: hashPassword('administrator123'),
      fullName: 'Administrator PLN',
      role: Role.ADMINISTRATOR,
      adminTitle: AdminTitle.SENIOR_MANAGER,
    },
  });
  console.log('Created administrator:', administrator);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
