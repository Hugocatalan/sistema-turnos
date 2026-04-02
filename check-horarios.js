const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const horarios = await prisma.horarioClase.findMany({
      where: { activo: true }
    });
    console.log('Horarios activos:', horarios.length);
    
    const todos = await prisma.horarioClase.findMany();
    console.log('Total horarios:', todos.length);
    
    if (horarios.length > 0) {
      console.log('Ejemplo:', horarios[0]);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  await prisma.$disconnect();
}

check();
