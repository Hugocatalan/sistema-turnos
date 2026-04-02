import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { usuarioSchema } from '@/lib/validations';
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
  if (!session?.user || session.user.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search') || '';
  const estado = searchParams.get('estado');

  const where: Record<string, unknown> = {
    rol: 'ALUMNO'
  };

  if (search) {
    const searchLower = search.toLowerCase();
    where.OR = [
      { nombre: { contains: searchLower } },
      { apellido: { contains: searchLower } },
      { dni: { contains: search } }
    ];
  }

  if (estado) {
    where.estadoMembresia = estado;
  }

  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({
      where,
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        estadoMembresia: true,
        fechaVencimiento: true,
        imagenUrl: true,
        createdAt: true,
        _count: {
          select: { turnos: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.usuario.count({ where })
  ]);

  return NextResponse.json({
    data: usuarios,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }, {
    headers: createSecurityHeaders()
  });
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
    const parsed = usuarioSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = {
      dni: sanitizeString(parsed.data.dni),
      nombre: sanitizeString(parsed.data.nombre),
      apellido: sanitizeString(parsed.data.apellido),
      email: parsed.data.email || null,
      telefono: parsed.data.telefono || null,
      estadoMembresia: parsed.data.estadoMembresia || 'ACTIVA',
      fechaVencimiento: parsed.data.fechaVencimiento ? new Date(parsed.data.fechaVencimiento) : null
    };

    const existe = await prisma.usuario.findUnique({
      where: { dni: data.dni }
    });

    if (existe) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este DNI' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.create({
      data,
      select: {
        id: true,
        dni: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        estadoMembresia: true,
        fechaVencimiento: true,
        createdAt: true
      }
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
