import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { usuarioSchema } from '@/lib/validations';
import { rateLimit, createSecurityHeaders, sanitizeString } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const usuario = await prisma.usuario.findUnique({
    where: { id: params.id },
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
      updatedAt: true,
      turnos: {
        where: { estado: 'RESERVADO' },
        select: {
          id: true,
          fecha: true,
          hora: true,
          clase: true,
          instructor: true,
          estado: true
        }
      },
      historialCambios: {
        select: {
          id: true,
          tipoCambio: true,
          detalle: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          turnos: true
        }
      }
    }
  });

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json(usuario);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existe = await prisma.usuario.findFirst({
      where: {
        dni: parsed.data.dni,
        NOT: { id: params.id }
      }
    });

    if (existe) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este DNI' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: {
        dni: sanitizeString(parsed.data.dni),
        nombre: sanitizeString(parsed.data.nombre),
        apellido: sanitizeString(parsed.data.apellido),
        email: parsed.data.email || null,
        telefono: parsed.data.telefono || null,
        estadoMembresia: parsed.data.estadoMembresia || 'ACTIVA',
        fechaVencimiento: parsed.data.fechaVencimiento ? new Date(parsed.data.fechaVencimiento) : null
      },
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
        updatedAt: true
      }
    });

    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  if (session.user.id === params.id) {
    return NextResponse.json(
      { error: 'No podés eliminarte a vos mismo' },
      { status: 400 }
    );
  }

  await prisma.usuario.delete({
    where: { id: params.id }
  });

  return NextResponse.json({ message: 'Usuario eliminado' });
}
