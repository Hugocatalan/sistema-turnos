const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clear() {
  try {
    await prisma.rateLimit.deleteMany({});
    console.log('Rate limits eliminados');
  } catch (e) {
    console.log('Error:', e.message);
  }
  await prisma.$disconnect();
}

clear();
