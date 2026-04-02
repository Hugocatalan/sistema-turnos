const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.usuario.findFirst({ where: { dni: '12345678' } });
  console.log('Admin:', admin ? `${admin.dni} - ${admin.nombre} (${admin.rol})` : 'NO ENCONTRADO');
  
  const alumno = await prisma.usuario.findFirst({ where: { dni: '87654321' } });
  console.log('Alumno:', alumno ? `${alumno.dni} - ${alumno.nombre} (${alumno.rol})` : 'NO ENCONTRADO');
  
  await prisma.$disconnect();
}

check();
