const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrisma() {
  try {
    const count = await prisma.user.count();
    console.log('Prisma user count:', count);
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Prisma users sample:', users);
  } catch (error) {
    console.error('Prisma error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrisma();
