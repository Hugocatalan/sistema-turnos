import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginSchema } from '@/lib/validations';
import prisma from '@/lib/prisma';
import { sanitizeString, validateDNI } from '@/lib/security';
import { UsuarioSession } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'DNI',
      credentials: {
        dni: { label: 'DNI', type: 'text', placeholder: 'Ingresá tu DNI' }
      },
      async authorize(credentials) {
        if (!credentials?.dni) {
          throw new Error('DNI requerido');
        }

        const parsed = loginSchema.safeParse({ dni: credentials.dni });
        if (!parsed.success) {
          throw new Error(parsed.error.errors[0].message);
        }

        const dni = sanitizeString(parsed.data.dni);

        if (!validateDNI(dni)) {
          throw new Error('DNI inválido');
        }

        const usuario = await prisma.usuario.findUnique({
          where: { dni },
          select: {
            id: true,
            dni: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            rol: true,
            estadoMembresia: true,
            fechaVencimiento: true,
            imagenUrl: true
          }
        });

        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }

        return {
          id: usuario.id,
          dni: usuario.dni,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: usuario.rol,
          estadoMembresia: usuario.estadoMembresia,
          fechaVencimiento: usuario.fechaVencimiento?.toISOString()
        };
      }
    }),
    CredentialsProvider({
      id: 'admin',
      name: 'Admin',
      credentials: {
        dni: { label: 'DNI Admin', type: 'text' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.dni || !credentials?.password) {
          throw new Error('Credenciales requeridas');
        }

        const admin = await prisma.usuario.findFirst({
          where: {
            dni: credentials.dni,
            rol: 'ADMIN'
          }
        });

        if (!admin) {
          throw new Error('Administrador no encontrado');
        }

        const isValid = credentials.password === process.env.ADMIN_PASSWORD;
        if (!isValid) {
          throw new Error('Contraseña incorrecta');
        }

        return {
          id: admin.id,
          dni: admin.dni,
          nombre: admin.nombre,
          apellido: admin.apellido,
          email: admin.email,
          telefono: admin.telefono,
          rol: admin.rol,
          estadoMembresia: admin.estadoMembresia,
          fechaVencimiento: admin.fechaVencimiento?.toISOString()
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user as UsuarioSession;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as UsuarioSession;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
