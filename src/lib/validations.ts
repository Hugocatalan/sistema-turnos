import { z } from 'zod';

export const loginSchema = z.object({
  dni: z.string()
    .min(7, 'El DNI debe tener al menos 7 dígitos')
    .max(10, 'El DNI no puede tener más de 10 dígitos')
    .regex(/^[0-9]+$/, 'El DNI solo debe contener números')
});

export const usuarioSchema = z.object({
  dni: z.string()
    .min(7, 'El DNI debe tener al menos 7 dígitos')
    .max(10, 'El DNI no puede tener más de 10 dígitos')
    .regex(/^[0-9]+$/, 'El DNI solo debe contener números'),
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo debe contener letras'),
  apellido: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo debe contener letras'),
  email: z.string()
    .email('Email inválido')
    .or(z.literal(''))
    .optional()
    .transform(v => v === '' ? undefined : v),
  telefono: z.string()
    .regex(/^\+?[0-9]{8,15}$/, 'Teléfono inválido')
    .or(z.literal(''))
    .optional()
    .transform(v => v === '' ? undefined : v),
  estadoMembresia: z.enum(['ACTIVA', 'VENCIDA', 'SUSPENDIDA']).optional(),
  fechaVencimiento: z.string()
    .or(z.literal(''))
    .optional()
    .transform(v => v === '' ? undefined : v),
});

export const turnoSchema = z.object({
  usuarioId: z.string().optional(),
  fecha: z.string(),
  hora: z.string(),
  clase: z.string()
    .min(1, 'La clase es requerida')
    .max(100),
  instructor: z.string().max(100).optional().nullable(),
  notas: z.string().max(500).optional().nullable(),
});

export const modificarTurnoSchema = z.object({
  turnoId: z.string().min(1, 'ID de turno requerido'),
  nuevaFecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato YYYY-MM-DD)')
    .optional(),
  nuevaHora: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida (formato HH:MM)')
    .optional(),
  accion: z.enum(['reprogramar', 'cancelar']),
});

export const reglaSchema = z.object({
    id: z.string().optional(),
    horasMinimasAntelacion: z.number().min(0).max(72),
    permiteCancelar: z.boolean(),
    permiteReprogramar: z.boolean(),
    maxCambiosPorSemana: z.number().min(0).max(10),
    requierePagoDia: z.boolean(),
  mensajePersonalizado: z.string().max(500).optional().nullable(),
});

export const configSchema = z.object({
  nombreEmpresa: z.string().min(1).max(100),
  colorPrimario: z.string(),
  colorSecundario: z.string(),
  colorFondo: z.string(),
  colorTexto: z.string(),
  tipoFondo: z.string(),
  telefono: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  horaApertura: z.string().optional().nullable(),
  horaCierre: z.string().optional().nullable(),
  diasLaborales: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  fondoPersonalizado: z.string().optional().nullable(),
});

export const preguntaSchema = z.object({
  pregunta: z.string()
    .min(5, 'La pregunta debe tener al menos 5 caracteres')
    .max(200, 'La pregunta no puede exceder 200 caracteres'),
  respuesta: z.string()
    .min(10, 'La respuesta debe tener al menos 10 caracteres')
    .max(2000, 'La respuesta no puede exceder 2000 caracteres'),
  categoria: z.string().max(50).optional(),
  activa: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Contraseña actual requerida'),
  nuevaPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});
