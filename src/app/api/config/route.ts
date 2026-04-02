import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { configSchema } from '@/lib/validations';
import { rateLimit, createSecurityHeaders, sanitizeString } from '@/lib/security';

export async function GET() {
  let config = await prisma.configuracionSitio.findFirst();
  
  if (!config) {
    config = await prisma.configuracionSitio.create({
      data: {
        nombreEmpresa: 'Mi Empresa',
        colorPrimario: '#3B82F6',
        colorSecundario: '#1E40AF',
        colorFondo: '#F8FAFC',
        colorTexto: '#1E293B',
        horaApertura: '08:00',
        horaCierre: '22:00',
        diasLaborales: '1,2,3,4,5,6'
      }
    });
  }

  return NextResponse.json(config);
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
    console.log('PUT config body:', JSON.stringify(body));
    const parsed = configSchema.safeParse(body);

    if (!parsed.success) {
      console.log('Validation error:', parsed.error);
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData = {
      nombreEmpresa: sanitizeString(parsed.data.nombreEmpresa) || 'Mi Empresa',
      colorPrimario: parsed.data.colorPrimario || '#3B82F6',
      colorSecundario: parsed.data.colorSecundario || '#1E40AF',
      colorFondo: parsed.data.colorFondo || '#F8FAFC',
      colorTexto: parsed.data.colorTexto || '#1E293B',
      tipoFondo: parsed.data.tipoFondo || 'color',
      telefono: parsed.data.telefono || null,
      email: parsed.data.email || null,
      direccion: parsed.data.direccion || null,
      horaApertura: parsed.data.horaApertura || '08:00',
      horaCierre: parsed.data.horaCierre || '22:00',
      diasLaborales: parsed.data.diasLaborales || '1,2,3,4,5,6',
      logoUrl: parsed.data.logoUrl || null,
      fondoPersonalizado: parsed.data.fondoPersonalizado || null,
    };

    const existing = await prisma.configuracionSitio.findFirst();
    
    let config;
    if (existing) {
      config = await prisma.configuracionSitio.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      config = await prisma.configuracionSitio.create({
        data: updateData
      });
    }

    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
