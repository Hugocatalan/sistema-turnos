import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit, createSecurityHeaders, sanitizeString } from '@/lib/security';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '');
}

function calcularSimilitud(texto1: string, texto2: string): number {
  const t1 = normalizarTexto(texto1);
  const t2 = normalizarTexto(texto2);

  if (t1.includes(t2) || t2.includes(t1)) return 1;

  const palabras1 = new Set(t1.split(/\s+/));
  const palabras2 = new Set(t2.split(/\s+/));

  const interseccion = Array.from(palabras1).filter(p => palabras2.has(p));
  const union = new Set([...Array.from(palabras1), ...Array.from(palabras2)]);

  return interseccion.length / union.size;
}

async function getRespuestaDinamica(pregunta: string): Promise<string | null> {
  const preguntaNorm = normalizarTexto(pregunta);
  const config = await prisma.configuracionSitio.findFirst();
  const regla = await prisma.reglaModificacion.findFirst({ where: { activo: true } });
  const ahora = new Date();
  
  // Saludos básicos
  const saludos = ['hola', 'buenos dias', 'buenas', 'que tal', 'hi', 'hello', 'hey'];
  if (saludos.some(s => preguntaNorm.includes(s)) && preguntaNorm.length < 20) {
    const respuestasSaludo = [
      '¡Hola! ¿En qué puedo ayudarte hoy?',
      '¡Buenos días! ¿Querés información sobre horarios, turnos o membresías?',
      '¡Hola! Estoy acá para responder tus dudas. Preguntame lo que necesites.',
      '¡Hey! ¿En qué te puedo ayudar?'
    ];
    return respuestasSaludo[Math.floor(Math.random() * respuestasSaludo.length)] + ' Podés preguntarme sobre horarios disponibles, cómo cancelar un turno, el estado de tu membresía, y más.';
  }
  
  // Consulta de membresía / vencimiento
  if (preguntaNorm.includes('membres') || preguntaNorm.includes('venc') || preguntaNorm.includes('cuota') || preguntaNorm.includes('pago')) {
    // Intentar obtener info del usuario desde la sesión
    // Por ahora respondemos genérico
    const membresiasActivas = await prisma.usuario.count({ where: { estadoMembresia: 'ACTIVA' } });
    const totalUsuarios = await prisma.usuario.count();
    
    // Si pregunta por "mi" membresía
    if (preguntaNorm.includes('mi') || preguntaNorm.includes('yo') || preguntaNorm.includes('mi propia')) {
      return 'Para ver el estado de tu membresía y fecha de vencimiento, podés revisar tu perfil haciendo clic en "Mi Perfil" en el menú. Allí verás los detalles de tu membresía actual.';
    }
    
    return `Tenemos ${membresiasActivas} membresías activas de ${totalUsuarios} usuarios registrados. Los detalles de tu membresía los podés ver en tu perfil de usuario.`;
  }
  
  // Estado de cuenta / mi perfil
  if ((preguntaNorm.includes('mi') || preguntaNorm.includes('mi cuenta') || preguntaNorm.includes('mi perfil')) && (preguntaNorm.includes('ver') || preguntaNorm.includes('consultar') || preguntaNorm.includes('estado'))) {
    return 'Podés ver tu información personal, historial de turnos y estado de membresía en la sección "Mi Perfil" del menú. Allí encontrarás todos los detalles de tu cuenta.';
  }
  
  // Horarios disponibles genérico - debe estar primero para coincidir con "que horarios hay"
  if (preguntaNorm.includes('horario') && !preguntaNorm.includes('abiert') && !preguntaNorm.includes('atencion') && !preguntaNorm.includes('cierre')) {
    const horarios = await prisma.horarioClase.findMany({ 
      where: { activo: true },
      orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }]
    });
    
    if (horarios.length === 0) {
      return 'Aún no hay horarios de clases configurados. Contactá al administrador para más información.';
    }
    
    // Obtener turnos de los próximos 7 días
    const proximoSemana = addDays(ahora, 7);
    const turnosReservados = await prisma.turno.findMany({
      where: { 
        fecha: { gte: startOfDay(ahora), lte: proximoSemana },
        estado: 'RESERVADO'
      },
      select: { fecha: true, hora: true }
    });
    
    // Crear set de turnos ocupados
    const ocupados = new Set(turnosReservados.map(t => `${format(t.fecha, 'yyyy-MM-dd')}-${t.hora}`));
    
    // Encontrar próximos horarios disponibles
    let respuesta = 'Horarios disponibles para los próximos días:\n\n';
    let count = 0;
    const maxResultados = 10;
    
    for (let d = 0; d < 7 && count < maxResultados; d++) {
      const fecha = addDays(ahora, d);
      const diaSemana = fecha.getDay();
      
      const horariosDia = horarios.filter(h => h.dia === diaSemana);
      
      for (const h of horariosDia) {
        const key = `${format(fecha, 'yyyy-MM-dd')}-${h.horaInicio}`;
        if (!ocupados.has(key)) {
          const fechaFormateada = format(fecha, 'EEEE d MMM', { locale: es });
          respuesta += `• ${h.clase}: ${h.horaInicio} - ${h.horaFin} (${fechaFormateada})\n`;
          count++;
          if (count >= maxResultados) break;
        }
      }
    }
    
    if (count === 0) {
      return 'No hay horarios disponibles en los próximos 7 días. Todos los turnos están reservados.';
    }
    
    respuesta += `\nPodés reservar directamente desde el calendario en tu página de inicio.`;
    return respuesta;
  }
  
  // Turnos disponibles
  if (preguntaNorm.includes('turno') && (preguntaNorm.includes('disponible') || preguntaNorm.includes('queda') || preguntaNorm.includes('hay'))) {
    const proximosDias = addDays(ahora, 7);
    const turnosTotales = await prisma.turno.count({
      where: { fecha: { gte: startOfDay(ahora), lte: proximosDias } }
    });
    const turnosReservados = await prisma.turno.count({
      where: { fecha: { gte: startOfDay(ahora), lte: proximosDias }, estado: 'RESERVADO' }
    });
    return `En los próximos 7 días hay ${turnosTotales} turnos registrados, de los cuales ${turnosReservados} están reservados. Podés reservar desde el panel de usuario.`;
  }
  
  // Clases disponibles / próximos turnos libres
  if ((preguntaNorm.includes('clase') || preguntaNorm.includes('actividad')) && (preguntaNorm.includes('disponible') || preguntaNorm.includes('libre') || preguntaNorm.includes('queda') || preguntaNorm.includes('próximo') || preguntaNorm.includes('busco') || preguntaNorm.includes('quiero'))) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const horarios = await prisma.horarioClase.findMany({ 
      where: { activo: true },
      orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }]
    });
    
    if (horarios.length === 0) {
      return 'Aún no hay horarios de clases configurados. Contactá al administrador para más información.';
    }
    
    // Obtener turnos de los próximos 7 días
    const proximoSemana = addDays(ahora, 7);
    const turnosReservados = await prisma.turno.findMany({
      where: { 
        fecha: { gte: startOfDay(ahora), lte: proximoSemana },
        estado: 'RESERVADO'
      },
      select: { fecha: true, hora: true }
    });
    
    // Crear set de turnos ocupados
    const ocupados = new Set(turnosReservados.map(t => `${format(t.fecha, 'yyyy-MM-dd')}-${t.hora}`));
    
    // Encontrar próximos horarios disponibles
    let respuesta = 'Estas son las próximas clases disponibles:\n\n';
    let count = 0;
    const maxResultados = 10;
    
    for (let d = 0; d < 7 && count < maxResultados; d++) {
      const fecha = addDays(ahora, d);
      const diaSemana = fecha.getDay();
      
      const horariosDia = horarios.filter(h => h.dia === diaSemana);
      
      for (const h of horariosDia) {
        const key = `${format(fecha, 'yyyy-MM-dd')}-${h.horaInicio}`;
        if (!ocupados.has(key)) {
          const fechaFormateada = format(fecha, 'EEEE d MMM', { locale: es });
          respuesta += `• ${h.clase}: ${h.horaInicio} - ${h.horaFin} (${fechaFormateada})\n`;
          count++;
          if (count >= maxResultados) break;
        }
      }
    }
    
    if (count === 0) {
      return 'No hay horarios disponibles en los próximos 7 días. Todos los turnos están reservados. Probá en otra fecha o contactá al administrador.';
    }
    
    respuesta += `\nPodés reservar directamente desde el calendario en tu página de inicio.`;
    return respuesta;
  }
  
  // Horarios de atención
  if (preguntaNorm.includes('horario') && (preguntaNorm.includes('abiert') || preguntaNorm.includes('atencion') || preguntaNorm.includes('cierre'))) {
    if (config) {
      return `Nuestro horario de atención es de ${config.horaApertura} a ${config.horaCierre} horas.${config.diasLaborales ? ` Estamos abiertos ${config.diasLaborales.split(',').length} días a la semana.` : ''}`;
    }
    return 'Nuestro horario es de 08:00 a 22:00. Consultá en el panel para más detalles.';
  }
  
  // Cancelar turno
  if ((preguntaNorm.includes('cancel') || preguntaNorm.includes('anul')) && preguntaNorm.includes('turno')) {
    if (regla) {
      if (!regla.permiteCancelar) {
        return regla.mensajePersonalizado || 'No está permitido cancelar turnos en este momento. Comunicate con el administrador.';
      }
      return `Sí podés cancelar tu turno, pero debes hacerlo con al menos ${regla.horasMinimasAntelacion} horas de anticipación.${regla.maxCambiosPorSemana ? ` Tenés un máximo de ${regla.maxCambiosPorSemana} cambios por semana.` : ''}`;
    }
    return 'Podés cancelar tus turnos desde el panel de usuario. Se requiere realizarlo con al menos 24 horas de anticipación.';
  }
  
  // Reprogramar turno
  if ((preguntaNorm.includes('reprogram') || preguntaNorm.includes('cambiar') || preguntaNorm.includes('modificar')) && preguntaNorm.includes('turno')) {
    if (regla) {
      if (!regla.permiteReprogramar) {
        return 'No está permitido reprogramar turnos en este momento. Comunicate con el administrador.';
      }
      return `Sí podés reprogramar tu turno, pero debes hacerlo con al menos ${regla.horasMinimasAntelacion} horas de anticipación.`;
    }
    return 'Podés reprogramar tus turnos desde el panel de usuario.';
  }
  
  // Membresía / precio
  if (preguntaNorm.includes('membres') || preguntaNorm.includes('precio') || preguntaNorm.includes('costo') || preguntaNorm.includes('cuota')) {
    const membresias = await prisma.usuario.count({ where: { estadoMembresia: 'ACTIVA' } });
    return `Actualmente tenemos ${membresias} membresías activas. Los planes y precios varían según el tipo de membresía. Consultá en administración para más información sobre planes disponibles.`;
  }
  
  // Actividades / clases
  if (preguntaNorm.includes('clase') || preguntaNorm.includes('actividad') || preguntaNorm.includes('ejercicio')) {
    const actividades = await prisma.actividad.findMany({ where: { activo: true } });
    if (actividades.length > 0) {
      const nombres = actividades.map(a => a.nombre).join(', ');
      return `Las actividades disponibles son: ${nombres}.${actividades.length > 0 ? ` Cada clase dura aproximadamente ${actividades[0].duracion} minutos.` : ''}`;
    }
    return 'Aún no hay actividades configuradas. Próximamente tendremos clases disponibles.';
  }
  
  // Horarios de clases
  if (preguntaNorm.includes('horario') && preguntaNorm.includes('clase')) {
    const horarios = await prisma.horarioClase.findMany({ where: { activo: true }, orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }] });
    if (horarios.length > 0) {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const horariosAgrupados = horarios.reduce((acc, h) => {
        if (!acc[h.clase]) acc[h.clase] = [];
        acc[h.clase].push(`${h.horaInicio} - ${h.horaFin}`);
        return acc;
      }, {} as Record<string, string[]>);
      
      let respuesta = 'Los horarios de clases son: ';
      for (const [clase, horas] of Object.entries(horariosAgrupados)) {
        respuesta += `${clase}: ${horas.join(', ')}. `;
      }
      return respuesta;
    }
    return 'Aún no hay horarios de clases configurados.';
  }
  
  // Miembro / usuario
  if (preguntaNorm.includes('soy') && (preguntaNorm.includes('miembro') || preguntaNorm.includes('usuario') || preguntaNorm.includes('alumno'))) {
    const usuariosActivos = await prisma.usuario.count({ where: { rol: 'ALUMNO' } });
    return `Actualmente hay ${usuariosActivos} usuarios activos en el sistema. Para consultas sobre tu cuenta, iniciá sesión y revisá tu perfil.`;
  }
  
  // Contacto
  if (preguntaNorm.includes('contact') || preguntaNorm.includes('hablar') || preguntaNorm.includes('atencion')) {
    if (config) {
      const contacto = [];
      if (config.telefono) contacto.push(`Teléfono: ${config.telefono}`);
      if (config.email) contacto.push(`Email: ${config.email}`);
      if (config.direccion) contacto.push(`Dirección: ${config.direccion}`);
      if (contacto.length > 0) {
        return `Podés contactarnos por: ${contacto.join(', ')}`;
      }
    }
    return 'Para contactarte con nosotros, iniciá sesión y usá el formulario de contacto o escribinos directamente.';
  }
  
  // Información general del gym
  if (preguntaNorm.includes('gimnasio') || preguntaNorm.includes('gym') || preguntaNorm.includes('centro')) {
    const info = [];
    if (config?.nombreEmpresa) info.push(config.nombreEmpresa);
    if (config?.horaApertura && config?.horaCierre) info.push(`Horario: ${config.horaApertura} - ${config.horaCierre}`);
    
    const usuarios = await prisma.usuario.count();
    const actividades = await prisma.actividad.count({ where: { activo: true } });
    info.push(`Tenemos ${usuarios} usuarios y ${actividades} actividades disponibles`);
    
    return info.join('. ') || 'Somos un centro de fitness con clases y turnos disponibles.';
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Demasiadas solicitudes', {
      status: 429,
      headers: { ...Object.fromEntries(rateLimitResult.headers), ...createSecurityHeaders() }
    });
  }

  try {
    const body = await request.json();
    const { pregunta } = body;

    if (!pregunta || typeof pregunta !== 'string' || pregunta.trim().length < 3) {
      return NextResponse.json(
        { error: 'Pregunta inválida' },
        { status: 400 }
      );
    }

    const sanitizedPregunta = sanitizeString(pregunta);
    
    // Primero buscar en respuestas dinámicas
    const respuestaDinamica = await getRespuestaDinamica(sanitizedPregunta);
    if (respuestaDinamica) {
      return NextResponse.json({
        respuesta: respuestaDinamica,
        tipo: 'dinamico'
      });
    }
    
    // Luego buscar en preguntas frecuentes
    const preguntas = await prisma.preguntaFrecuente.findMany({
      where: { activa: true }
    });

    if (preguntas.length === 0) {
      return NextResponse.json({
        respuesta: 'Aún no hay preguntas frecuentes configuradas. ¡Pronto tendremos más información!',
        tipo: 'default'
      });
    }

    let mejorCoincidencia = { pregunta: '', respuesta: '', similitud: 0 };

    for (const p of preguntas) {
      const similitud = calcularSimilitud(sanitizedPregunta, p.pregunta);
      if (similitud > mejorCoincidencia.similitud) {
        mejorCoincidencia = { pregunta: p.pregunta, respuesta: p.respuesta, similitud };
      }
    }

    const umbralMinimo = 0.2;

    if (mejorCoincidencia.similitud >= umbralMinimo) {
      return NextResponse.json({
        respuesta: mejorCoincidencia.respuesta,
        preguntaCoincidente: mejorCoincidencia.pregunta,
        tipo: 'frecuente'
      });
    }

    const respuestasDefault = [
      'No estoy seguro de entender tu pregunta. ¿Podrías reformularla?',
      'No encontré información específica sobre eso. Probá preguntando sobre horarios, precios, clases o turnos.',
      'Tu consulta no coincide con la información disponible. Escribinos directamente.'
    ];

    return NextResponse.json({
      respuesta: respuestasDefault[Math.floor(Math.random() * respuestasDefault.length)],
      sugerencia: 'Probá preguntando sobre: horarios de atención, cancelar turnos, reprogramar, clases disponibles, precios o cómo reservar.',
      tipo: 'default'
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar pregunta' },
      { status: 500 }
    );
  }
}
