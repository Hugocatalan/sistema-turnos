import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createSecurityHeaders, sanitizeString } from '@/lib/security';
import { z } from 'zod';

const actividadSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  descripcion: z.string().max(500).optional(),
  duracion: z.number().min(15).max(480).default(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  activo: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const actividades = await prisma.actividad.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(actividades, {
      headers: createSecurityHeaders()
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = actividadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const actividad = await prisma.actividad.create({
      data: {
        nombre: sanitizeString(parsed.data.nombre),
        descripcion: parsed.data.descripcion ? sanitizeString(parsed.data.descripcion) : null,
        duracion: parsed.data.duracion,
        color: parsed.data.color,
        activo: parsed.data.activo
      }
    });

    return NextResponse.json(actividad, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear actividad' }, { status: 500 });
  }
}
