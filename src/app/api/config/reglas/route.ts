import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { reglaSchema } from '@/lib/validations';
import { rateLimit, createSecurityHeaders } from '@/lib/security';

export async function GET() {
  const reglas = await prisma.reglaModificacion.findFirst({
    where: { activo: true }
  });

  if (!reglas) {
    const defaultReglas = await prisma.reglaModificacion.create({
      data: {
        horasMinimasAntelacion: 24,
        permiteCancelar: true,
        permiteReprogramar: true,
        maxCambiosPorSemana: 2
      }
    });
    return NextResponse.json(defaultReglas);
  }

  return NextResponse.json(reglas);
}

export async function PUT(request: NextRequest) {
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
    console.log('PUT reglas body:', JSON.stringify(body));
    const parsed = reglaSchema.safeParse(body);

    if (!parsed.success) {
      console.log('Validation error:', parsed.error);
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const reglas = await prisma.reglaModificacion.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...parsed.data
      },
      update: parsed.data
    });

    return NextResponse.json(reglas);
  } catch {
    return NextResponse.json(
      { error: 'Error al guardar reglas' },
      { status: 500 }
    );
  }
}
