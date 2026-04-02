import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rateLimit, createSecurityHeaders } from '@/lib/security';

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
  const estado = searchParams.get('estado');

  const usuarios = await prisma.usuario.findMany({
    where: {
      rol: 'ALUMNO',
      ...(estado ? { estadoMembresia: estado as 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA' } : {})
    },
    select: {
      id: true,
      dni: true,
      nombre: true,
      apellido: true,
      estadoMembresia: true,
      fechaVencimiento: true,
      _count: {
        select: {
          turnos: {
            where: { estado: 'RESERVADO' }
          }
        }
      }
    },
    orderBy: { fechaVencimiento: 'asc' }
  });

  const ahora = new Date();
  const usuariosConEstado = usuarios.map(u => {
    const diasRestantes = u.fechaVencimiento
      ? Math.ceil((u.fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      ...u,
      diasRestantes,
      estadoCalculado: diasRestantes === null
        ? 'SIN_FECHA'
        : diasRestantes < 0
          ? 'VENCIDO'
          : diasRestantes <= 7
            ? 'POR_VENCER'
            : 'ACTIVO'
    };
  });

  const resumen = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estadoMembresia === 'ACTIVA').length,
    vencidos: usuarios.filter(u => u.estadoMembresia === 'VENCIDA').length,
    suspendidos: usuarios.filter(u => u.estadoMembresia === 'SUSPENDIDA').length,
    porVencer: usuariosConEstado.filter(u => u.estadoCalculado === 'POR_VENCER').length
  };

  return NextResponse.json({
    usuarios: usuariosConEstado,
    resumen
  });
}
