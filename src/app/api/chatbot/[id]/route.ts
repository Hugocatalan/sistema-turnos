import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rateLimit, createSecurityHeaders } from '@/lib/security';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Demasiadas solicitudes', {
      status: 429,
      headers: { ...Object.fromEntries(rateLimitResult.headers), ...createSecurityHeaders() }
    });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const id = params.id;
    const pregunta = await prisma.preguntaFrecuente.findUnique({ where: { id } });
    if (!pregunta) {
      return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
    }

    await prisma.preguntaFrecuente.update({ where: { id }, data: { activa: false } });
    return NextResponse.json({ message: 'Pregunta eliminada' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar pregunta' }, { status: 500 });
  }
}
