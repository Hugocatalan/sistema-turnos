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
  const includeArchivados = searchParams.get('includeArchivados');
  const archivadoEnabled = process.env.TURNOS_ARCHIVADO_ENABLED !== 'false';

  const where: Record<string, unknown> = {};

  if (session.user.rol === 'ADMIN') {
    console.log('Es admin, devolviendo turnos');
    if (archivadoEnabled) {
      if (includeArchivados !== 'true') {
        where.archivado = false;
      }
      // si includeArchivados es true y está habilitado, no filtramos archivado
    }
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

  // Archivar turnos pasados si la característica está habilitada
  const archivadoEnabled2 = process.env.TURNOS_ARCHIVADO_ENABLED !== 'false';
  if (archivadoEnabled2) {
    try {
      // Cast to any to avoid TS conflicts with generated Prisma types before regen
      await (prisma.turno.updateMany as any)({
        where: {
          archivado: false,
          fecha: { lt: new Date() }
        },
        data: {
          archivado: true,
          archivadoEn: new Date()
        }
      });
    } catch {
      // No bloqueará la petición si falla el archivado
    }
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
    
    // Verificar y crear turno de forma atómica para evitar race conditions
    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar si ya existe un turno en ese horario
      const turnoExistente = await tx.turno.findFirst({
        where: {
          fecha: {
            gte: new Date(fechaTurno.setHours(0, 0, 0, 0)),
            lte: new Date(fechaTurno.setHours(23, 59, 59, 999))
          },
          hora: parsed.data.hora,
          clase: parsed.data.clase,
          estado: 'RESERVADO'
        }
      });

      if (turnoExistente) {
        throw new Error('RESERVADO');
      }

      // Crear el turno
      return await tx.turno.create({
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
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'RESERVADO') {
      return NextResponse.json(
        { error: 'Ese turno ya fue reservado por otra persona. Por favor elegí otro horario.' },
        { status: 400 }
      );
    }
    console.error('Error al crear turno:', error);
    return NextResponse.json(
      { error: 'Error al crear turno' },
      { status: 500 }
    );
  }
}
