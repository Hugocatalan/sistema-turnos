import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const turno = await prisma.turno.findUnique({
      where: { id: params.id },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            telefono: true
          }
        }
      }
    });

    if (!turno) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
    }

    if (session.user.rol !== 'ADMIN' && turno.usuarioId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const fecha = new Date(turno.fecha);
    const [hora, minuto] = turno.hora.split(':').map(Number);
    fecha.setHours(hora, minuto, 0, 0);

    const fechaFin = new Date(fecha);
    fechaFin.setHours(fechaFin.getHours() + 1);

    const formatDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`Reserva: ${turno.clase}`);
    const details = encodeURIComponent(
      `📅 Actividad: ${turno.clase}\n` +
      `🕐 Hora: ${turno.hora}\n` +
      `👤 Cliente: ${turno.usuario.nombre} ${turno.usuario.apellido}` +
      (turno.usuario.telefono ? `\n📞 Tel: ${turno.usuario.telefono}` : '') +
      (turno.instructor ? `\n🏋️ Instructor: ${turno.instructor}` : '')
    );
    const location = encodeURIComponent(turno.notas || '');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(fecha)}/${formatDate(fechaFin)}&details=${details}&location=${location}`;

    return NextResponse.redirect(googleCalendarUrl);
  } catch {
    return NextResponse.json({ error: 'Error al generar enlace' }, { status: 500 });
  }
}
