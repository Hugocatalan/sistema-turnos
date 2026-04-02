import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createSecurityHeaders, sanitizeString } from '@/lib/security';
import { z } from 'zod';

const recomendacionSchema = z.object({
  texto: z.string().min(1, 'Texto requerido').max(500),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  orden: z.number().int().default(0),
  activa: z.boolean().default(true)
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const recomendaciones = await prisma.recomendacion.findMany({
      orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
      where: session.user.rol === 'ADMIN' ? undefined : { activa: true }
    });

    return NextResponse.json(recomendaciones, {
      headers: createSecurityHeaders()
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener recomendaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = recomendacionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const recomendacion = await prisma.recomendacion.create({
      data: {
        texto: sanitizeString(parsed.data.texto),
        color: parsed.data.color,
        orden: parsed.data.orden,
        activa: parsed.data.activa
      }
    });

    return NextResponse.json(recomendacion, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear recomendación' }, { status: 500 });
  }
}
