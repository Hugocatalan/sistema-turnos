export type Role = 'ADMIN' | 'ALUMNO';
export type EstadoMembresia = 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA';
export type EstadoTurno = 'RESERVADO' | 'CANCELADO' | 'COMPLETADO' | 'NO_ASISTIO';

export interface UsuarioSession {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  rol: Role;
  estadoMembresia: EstadoMembresia;
  fechaVencimiento?: string | null;
}

export interface TurnoWithUsuario {
  id: string;
  usuarioId: string;
  fecha: Date;
  hora: string;
  clase: string;
  instructor?: string | null;
  estado: EstadoTurno;
  notas?: string | null;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    telefono?: string | null;
  };
}

export interface ConfiguracionSitioData {
  nombreEmpresa: string;
  logoUrl?: string | null;
  colorPrimario: string;
  colorSecundario: string;
  colorFondo: string;
  colorTexto: string;
  tipoFondo: string;
  fondoPersonalizado?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

export interface ReglaData {
  horasMinimasAntelacion: number;
  permiteCancelar: boolean;
  permiteReprogramar: boolean;
  maxCambiosPorSemana: number;
  requierePagoDia: boolean;
  mensajePersonalizado?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EstadisticasAlumno {
  totalTurnos: number;
  turnosCompletados: number;
  turnosCancelados: number;
  inasistencias: number;
  cambiosRealizados: number;
}

export interface ChatbotPregunta {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria?: string | null;
}
