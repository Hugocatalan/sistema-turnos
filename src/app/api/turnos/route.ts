import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { turnoSchema } from '@/lib/validations';
import { rateLimit, createSecurityHeaders, sanitizeString } from '@/lib/security';

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Demasiadas solicitudes', {
      status: 429,
      headers: { ...Object.fromEntries(rateLimitResult.headers), ...createSecurityHeaders() }
    });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  console.log('GET /api/turnos - User:', session.user.id, 'Rol:', session.user.rol);

  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');
  const estado = searchParams.get('estado');

  const where: Record<string, unknown> = {};

  if (session.user.rol === 'ADMIN') {
    console.log('Es admin, devolviendo todos los turnos');
    if (estado) where.estado = estado;
  } else {
    where.usuarioId = session.user.id;
    if (estado) where.estado = estado;
  }

  if (fecha) {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    where.fecha = { gte: fechaInicio, lte: fechaFin };
  }

  try {
    const turnos = await prisma.turno.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        }
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }]
    });

    console.log('Turnos encontrados:', turnos.length);
    return NextResponse.json(turnos, {
      headers: createSecurityHeaders()
    });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Demasiadas solicitudes', {
      status: 429,
      headers: { ...Object.fromEntries(rateLimitResult.headers), ...createSecurityHeaders() }
    });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Body recibido:', JSON.stringify(body));
    const parsed = turnoSchema.safeParse(body);

    if (!parsed.success) {
      console.log('Validation error:', parsed.error);
      return NextResponse.json(
        { error: parsed.error.errors[0].message, details: parsed.error },
        { status: 400 }
      );
    }

    const usuarioId = session.user.rol === 'ADMIN' && body.usuarioId
      ? body.usuarioId
      : session.user.id;

    const fechaTurno = new Date(parsed.data.fecha);
    
    if (session.user.rol !== 'ADMIN') {
      const ahora = new Date();
      const diffHoras = (fechaTurno.getTime() - ahora.getTime()) / (1000 * 60 * 60);
      if (diffHoras < 1) {
        return NextResponse.json(
          { error: 'No se pueden reservar turnos con menos de 1 hora de anticipación' },
          { status: 400 }
        );
      }
    }

    const turnoExistente = await prisma.turno.findFirst({
      where: {
        usuarioId,
        fecha: {
          gte: new Date(fechaTurno.setHours(0, 0, 0, 0)),
          lte: new Date(fechaTurno.setHours(23, 59, 59, 999))
        },
        hora: parsed.data.hora,
        estado: 'RESERVADO'
      }
    });

    if (turnoExistente) {
      return NextResponse.json(
        { error: 'Ya tenés un turno en ese horario' },
        { status: 400 }
      );
    }

    const turno = await prisma.turno.create({
      data: {
        usuarioId,
        fecha: new Date(parsed.data.fecha),
        hora: parsed.data.hora,
        clase: sanitizeString(parsed.data.clase),
        instructor: parsed.data.instructor ? sanitizeString(parsed.data.instructor) : null,
        notas: parsed.data.notas ? sanitizeString(parsed.data.notas) : null
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    return NextResponse.json(turno, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear turno' },
      { status: 500 }
    );
  }
}
