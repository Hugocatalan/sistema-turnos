import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rateLimit, createSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dia = searchParams.get('dia');
    const clase = searchParams.get('clase');

    const where: Record<string, unknown> = { activo: true };
    if (dia) where.dia = parseInt(dia);
    if (clase) where.clase = clase;

    const horarios = await prisma.horarioClase.findMany({
      where,
      orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }]
    });

    return NextResponse.json(horarios);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Demasiadas solicitudes', { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clase, horaInicio, horaFin, dia, instructor } = body;

    if (!clase || !horaInicio || !horaFin || dia === undefined) {
      return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
    }

    if (horaInicio >= horaFin) {
      return NextResponse.json({ error: 'Hora inicio debe ser menor que hora fin' }, { status: 400 });
    }

    if (dia < 0 || dia > 6) {
      return NextResponse.json({ error: 'Día inválido (0-6)' }, { status: 400 });
    }

    const horario = await prisma.horarioClase.create({
      data: {
        clase,
        horaInicio,
        horaFin,
        dia,
        instructor,
        activo: true
      }
    });

    return NextResponse.json(horario, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear horario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Demasiadas solicitudes', { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, activo } = body;

    if (id) {
      const horario = await prisma.horarioClase.update({
        where: { id },
        data: { activo }
      });
      return NextResponse.json(horario);
    }

    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.horarioClase.delete({ where: { id } });
    return NextResponse.json({ message: 'Horario eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
