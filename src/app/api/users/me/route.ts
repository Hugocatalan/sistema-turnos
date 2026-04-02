import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      dni: true,
      nombre: true,
      apellido: true,
      email: true,
      telefono: true,
      rol: true,
      estadoMembresia: true,
      fechaVencimiento: true,
      imagenUrl: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json(user);
}
