import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { preguntaSchema } from '@/lib/validations';
import { rateLimit, createSecurityHeaders, sanitizeString } from '@/lib/security';

export async function GET() {
  const preguntas = await prisma.preguntaFrecuente.findMany({
    where: { activa: true },
    orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }]
  });

  return NextResponse.json(preguntas);
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
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = preguntaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const pregunta = await prisma.preguntaFrecuente.create({
      data: {
        pregunta: sanitizeString(parsed.data.pregunta),
        respuesta: sanitizeString(parsed.data.respuesta),
        categoria: parsed.data.categoria ? sanitizeString(parsed.data.categoria) : null,
        activa: parsed.data.activa ?? true,
        orden: parsed.data.orden ?? 0
      }
    });

    return NextResponse.json(pregunta, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear pregunta' },
      { status: 500 }
    );
  }
}
