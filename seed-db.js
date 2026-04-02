const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUsers() {
  const admin = await prisma.usuario.upsert({
    where: { dni: '12345678' },
    update: {},
    create: {
      dni: '12345678',
      nombre: 'Admin',
      apellido: 'Principal',
      rol: 'ADMIN',
      estadoMembresia: 'ACTIVA'
    }
  });
  console.log('Admin:', admin.dni, '-', admin.nombre);

  const alumno = await prisma.usuario.upsert({
    where: { dni: '87654321' },
    update: {},
    create: {
      dni: '87654321',
      nombre: 'Juan',
      apellido: 'Pérez',
      rol: 'ALUMNO',
      estadoMembresia: 'ACTIVA',
      fechaVencimiento: new Date('2026-12-31')
    }
  });
  console.log('Alumno:', alumno.dni, '-', alumno.nombre);

  const clases = ['Spinning', 'Yoga', 'Pilates', 'Funcional', 'Zumba'];
  for (let dia = 0; dia <= 6; dia++) {
    for (let hora = 8; hora <= 20; hora++) {
      const clase = clases[Math.floor(Math.random() * clases.length)];
      await prisma.horarioClase.create({
        data: {
          clase,
          horaInicio: `${hora.toString().padStart(2, '0')}:00`,
          horaFin: `${(hora + 1).toString().padStart(2, '0')}:00`,
          dia,
          activo: dia !== 0
        }
      });
    }
  }
  console.log('Horarios creados');

  await prisma.$disconnect();
}

createUsers().catch(console.error);
