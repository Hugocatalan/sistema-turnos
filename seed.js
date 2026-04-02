const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.usuario.create({
    data: {
      id: 'admin1',
      dni: '12345678',
      nombre: 'Admin',
      apellido: 'Principal',
      rol: 'ADMIN',
      estadoMembresia: 'ACTIVA'
    }
  });
  console.log('Admin creado:', admin);
  
  const alumno = await prisma.usuario.create({
    data: {
      dni: '87654321',
      nombre: 'Juan',
      apellido: 'Pérez',
      rol: 'ALUMNO',
      estadoMembresia: 'ACTIVA',
      fechaVencimiento: new Date('2026-12-31')
    }
  });
  console.log('Alumno de prueba creado:', alumno);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
