import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createSecurityHeaders, sanitizeString } from '@/lib/security';
import { z } from 'zod';

const updateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descripcion: z.string().max(500).optional(),
  duracion: z.number().min(15).max(480).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  activo: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const actividad = await prisma.actividad.findUnique({
      where: { id: params.id }
    });

    if (!actividad) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    return NextResponse.json(actividad);
  } catch {
    return NextResponse.json({ error: 'Error al obtener actividad' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.nombre) data.nombre = sanitizeString(parsed.data.nombre);
    if (parsed.data.descripcion !== undefined) data.descripcion = parsed.data.descripcion ? sanitizeString(parsed.data.descripcion) : null;
    if (parsed.data.duracion) data.duracion = parsed.data.duracion;
    if (parsed.data.color) data.color = parsed.data.color;
    if (parsed.data.activo !== undefined) data.activo = parsed.data.activo;

    const actividad = await prisma.actividad.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json(actividad);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar actividad' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    await prisma.actividad.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar actividad' }, { status: 500 });
  }
}
