import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit, createSecurityHeaders, sanitizeString } from '@/lib/security';

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
    const preguntas = await prisma.preguntaFrecuente.findMany({
      where: { activa: true }
    });

    if (preguntas.length === 0) {
      return NextResponse.json({
        respuesta: 'Aún no hay preguntas configuradas. ¡Pronto我们将添加常见问题！'
      });
    }

    let mejorCoincidencia = { pregunta: '', respuesta: '', similitud: 0 };

    for (const p of preguntas) {
      const similitud = calcularSimilitud(sanitizedPregunta, p.pregunta);
      if (similitud > mejorCoincidencia.similitud) {
        mejorCoincidencia = { pregunta: p.pregunta, respuesta: p.respuesta, similitud };
      }
    }

    const umbralMinimo = 0.15;

    if (mejorCoincidencia.similitud >= umbralMinimo) {
      return NextResponse.json({
        respuesta: mejorCoincidencia.respuesta,
        preguntaCoincidente: mejorCoincidencia.pregunta
      });
    }

    const respuestasDefault = [
      'No estoy seguro de entender tu pregunta. ¿Podrías reformularla?',
      'No encontré información sobre eso. Contactá al administrador.',
      'Tu consulta no coincide con las preguntas frecuentes. Escribinos directamente.'
    ];

    return NextResponse.json({
      respuesta: respuestasDefault[Math.floor(Math.random() * respuestasDefault.length)],
      sugerencia: 'Probá preguntando sobre horarios, precios, ubicación o clases.'
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar pregunta' },
      { status: 500 }
    );
  }
}
