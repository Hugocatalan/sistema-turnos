import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      dni: string
      nombre: string
      apellido: string
      email?: string | null
      telefono?: string | null
      rol: "ADMIN" | "ALUMNO"
      estadoMembresia: "ACTIVA" | "VENCIDA" | "SUSPENDIDA"
      fechaVencimiento?: string | null
      imagenUrl?: string | null
    }
  }
}
