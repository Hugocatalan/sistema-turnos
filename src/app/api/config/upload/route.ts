import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rateLimit, createSecurityHeaders } from '@/lib/security';

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
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tipo = formData.get('tipo') as string;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const tiposPermitidos = ['logo', 'fondo'];
    if (!tiposPermitidos.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de archivo inválido' }, { status: 400 });
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!extension || !extensionesPermitidas.includes(extension)) {
      return NextResponse.json(
        { error: `Extensiones permitidas: ${extensionesPermitidas.join(', ')}` },
        { status: 400 }
      );
    }

    const tamanoMaximo = 5 * 1024 * 1024;
    if (file.size > tamanoMaximo) {
      return NextResponse.json(
        { error: 'El archivo no puede superar los 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const config = await prisma.configuracionSitio.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
    }

    if (tipo === 'logo') {
      await prisma.configuracionSitio.update({
        where: { id: config.id },
        data: { logoUrl: dataUrl }
      });
    } else if (tipo === 'fondo') {
      await prisma.configuracionSitio.update({
        where: { id: config.id },
        data: { fondoPersonalizado: dataUrl }
      });
    }

    return NextResponse.json({ url: dataUrl });
  } catch {
    return NextResponse.json(
      { error: 'Error al subir imagen' },
      { status: 500 }
    );
  }
}
