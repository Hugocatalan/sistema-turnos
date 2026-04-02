import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { modificarTurnoSchema } from '@/lib/validations';
import { rateLimit, createSecurityHeaders, sanitizeString } from '@/lib/security';

export async function PUT(request: NextRequest) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Demasiadas solicitudes', {
      status: 429,
      headers: { ...Object.fromEntries(rateLimitResult.headers), ...createSecurityHeaders() }
    });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = modificarTurnoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const reglas = await prisma.reglaModificacion.findFirst({
      where: { activo: true }
    });

    if (!reglas) {
      return NextResponse.json(
        { error: 'Reglas de modificación no configuradas' },
        { status: 500 }
      );
    }

    const turno = await prisma.turno.findUnique({
      where: { id: parsed.data.turnoId },
      include: { usuario: true }
    });

    if (!turno) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      );
    }

    if (session.user.rol !== 'ADMIN' && turno.usuarioId !== session.user.id) {
      return NextResponse.json(
        { error: 'No podés modificar turnos de otros usuarios' },
        { status: 403 }
      );
    }

    if (turno.estado !== 'RESERVADO') {
      return NextResponse.json(
        { error: 'Este turno no puede ser modificado' },
        { status: 400 }
      );
    }

    const ahora = new Date();
    const fechaTurno = new Date(turno.fecha);
    const horasRestantes = (fechaTurno.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (horasRestantes < reglas.horasMinimasAntelacion) {
      return NextResponse.json({
        error: `Debés solicitar cambios con al menos ${reglas.horasMinimasAntelacion} horas de anticipación`,
        mensaje: reglas.mensajePersonalizado
      }, { status: 400 });
    }

    if (parsed.data.accion === 'cancelar' && !reglas.permiteCancelar) {
      return NextResponse.json(
        { error: 'No se permiten cancelaciones', mensaje: reglas.mensajePersonalizado },
        { status: 400 }
      );
    }

    if (parsed.data.accion === 'reprogramar' && !reglas.permiteReprogramar) {
      return NextResponse.json(
        { error: 'No se permiten reprogramaciones', mensaje: reglas.mensajePersonalizado },
        { status: 400 }
      );
    }

    const semanaPasada = new Date();
    semanaPasada.setDate(semanaPasada.getDate() - 7);

    const cambiosSemana = await prisma.historialCambio.count({
      where: {
        usuarioId: session.user.id,
        tipoCambio: { in: ['CANCELACION', 'REPROGRAMACION'] },
        createdAt: { gte: semanaPasada }
      }
    });

    if (session.user.rol !== 'ADMIN' && cambiosSemana >= reglas.maxCambiosPorSemana) {
      return NextResponse.json({
        error: `Superaste el límite de ${reglas.maxCambiosPorSemana} cambios por semana`,
        mensaje: reglas.mensajePersonalizado
      }, { status: 400 });
    }

    if (parsed.data.accion === 'cancelar') {
      await prisma.turno.update({
        where: { id: parsed.data.turnoId },
        data: { estado: 'CANCELADO' }
      });

      await prisma.historialCambio.create({
        data: {
          usuarioId: session.user.id,
          turnoId: parsed.data.turnoId,
          tipoCambio: 'CANCELACION',
          detalle: `Cancelado por ${session.user.nombre} ${session.user.apellido}`,
          realizadoPor: session.user.id
        }
      });

      return NextResponse.json({ message: 'Turno cancelado' });
    }

    if (parsed.data.accion === 'reprogramar') {
      const fechaStr = parsed.data.nuevaFecha;
      const nuevaHora = parsed.data.nuevaHora;

      if (!fechaStr || !nuevaHora) {
        return NextResponse.json(
          { error: 'Nueva fecha y hora requeridas para reprogramar' },
          { status: 400 }
        );
      }

      const nuevaFecha = new Date(fechaStr + 'T12:00:00');
      
      if (nuevaFecha.getTime() < ahora.getTime()) {
        return NextResponse.json(
          { error: 'No podés reprogramar a una fecha pasada' },
          { status: 400 }
        );
      }

      const diffNuevo = (nuevaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60);
      if (diffNuevo < 1) {
        return NextResponse.json(
          { error: 'No se pueden agendar turnos con menos de 1 hora de anticipación' },
          { status: 400 }
        );
      }

      const fechaInicio = new Date(fechaStr + 'T00:00:00');
      const fechaFin = new Date(fechaStr + 'T23:59:59');

      const conflicto = await prisma.turno.findFirst({
        where: {
          id: { not: parsed.data.turnoId },
          usuarioId: session.user.id,
          fecha: {
            gte: fechaInicio,
            lte: fechaFin
          },
          hora: nuevaHora,
          estado: 'RESERVADO'
        }
      });

      if (conflicto) {
        return NextResponse.json(
          { error: 'Ya tenés un turno en ese horario' },
          { status: 400 }
        );
      }

      await prisma.turno.update({
        where: { id: parsed.data.turnoId },
        data: {
          fecha: nuevaFecha,
          hora: nuevaHora
        }
      });

      await prisma.historialCambio.create({
        data: {
          usuarioId: session.user.id,
          turnoId: parsed.data.turnoId,
          tipoCambio: 'REPROGRAMACION',
          detalle: `Reprogramado a ${nuevaFecha.toLocaleDateString()} ${nuevaHora} por ${session.user.nombre} ${session.user.apellido}`,
          realizadoPor: session.user.id
        }
      });

      return NextResponse.json({ message: 'Turno reprogramado' });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: 'Error al modificar turno' },
      { status: 500 }
    );
  }
}
