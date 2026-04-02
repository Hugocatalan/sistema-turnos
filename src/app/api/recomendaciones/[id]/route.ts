import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createSecurityHeaders, sanitizeString } from '@/lib/security';
import { z } from 'zod';

const updateSchema = z.object({
  texto: z.string().min(1).max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  orden: z.number().int().optional(),
  activa: z.boolean().optional()
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
    const recomendacion = await prisma.recomendacion.findUnique({
      where: { id: params.id }
    });

    if (!recomendacion) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }

    return NextResponse.json(recomendacion);
  } catch {
    return NextResponse.json({ error: 'Error al obtener' }, { status: 500 });
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
    if (parsed.data.texto) data.texto = sanitizeString(parsed.data.texto);
    if (parsed.data.color) data.color = parsed.data.color;
    if (parsed.data.orden !== undefined) data.orden = parsed.data.orden;
    if (parsed.data.activa !== undefined) data.activa = parsed.data.activa;

    const recomendacion = await prisma.recomendacion.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json(recomendacion);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
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
    await prisma.recomendacion.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
