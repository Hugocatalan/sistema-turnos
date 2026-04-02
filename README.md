# Sistema de Reservas para Gimnasio

Sistema de gestión de turnos para gimnasio con paneles de administración y alumnos.

## Características

- **Login por DNI**: Alumnos acceden solo con su número de documento
- **Panel Admin**: CRUD de usuarios, gestión de turnos, configuración de reglas, personalización del sitio
- **Panel Alumno**: Reserva y modificación de turnos, chatbot de consultas
- **Chatbot**: Responde preguntas frecuentes configuradas por el admin
- **Personalización**: Colores, logo, fondos, nombre de empresa
- **Seguridad**: Rate limiting, validación de inputs, sanitización

## Stack Tecnológico

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js

## Requisitos Previos

- Node.js 18+
- PostgreSQL (local o Supabase)
- npm o yarn

## Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd gimnasio-reservas
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editá `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/gimnasio_db"
NEXTAUTH_SECRET="tu-clave-secreta"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_PASSWORD="tu-contraseña-admin"
```

4. **Inicializar la base de datos**
```bash
npm run db:push
npm run db:generate
```

5. **Crear admin inicial**
Ejecutá en la base de datos:
```sql
INSERT INTO "Usuario" (id, dni, nombre, apellido, rol) 
VALUES ('admin-1', '12345678', 'Admin', 'User', 'ADMIN');
```

6. **Ejecutar en desarrollo**
```bash
npm run dev
```

7. **Abrir en el navegador**
```
http://localhost:3000
```

## Deploy en Vercel

1. Subí el código a GitHub
2. Conectá tu repo a Vercel
3. Configurá las variables de entorno en Vercel
4. Deploy automático

## Configuración de Supabase (Opcional)

1. Creá un proyecto en [Supabase](https://supabase.com)
2. Obtené la URL y la clave API
3. Actualizá `DATABASE_URL` en `.env`

## Uso

### Panel Admin
- Accedé con DNI de admin y contraseña
- Gestionar usuarios, turnos, membresías
- Configurar chatbot y reglas de modificación
- Personalizar colores y logo

### Panel Alumno
- Ingresá solo con tu DNI
- Reservá turnos de las clases disponibles
- Modificá o cancelá turnos según las reglas
- Consultá al chatbot

## Estructura del Proyecto

```
src/
├── app/
│   ├── admin/          # Panel de administración
│   ├── alumno/        # Panel de alumnos
│   ├── api/           # Rutas de API
│   └── login/         # Página de login
├── components/        # Componentes React
├── lib/               # Utilidades y configuraciones
├── types/             # Tipos TypeScript
prisma/
└── schema.prisma       # Schema de base de datos
```

## Licencia

MIT
