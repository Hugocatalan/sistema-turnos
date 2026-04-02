# Sistema de Reservas de Turnos

Sistema de gestión de turnos desarrollado con Next.js, Prisma y Tailwind CSS.

## Despliegue en Vercel

### 1. Preparar el código

```bash
# Crear archivo de variables de producción
cp .env.example .env
# Editar .env con tus valores reales

# Hacer commit de los cambios
git add .
git commit -m "Listo para deploy"
```

### 2. Subir a GitHub

1. Crear repo en [github.com](https://github.com)
2. Conectar repo local con GitHub:
```bash
git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPO.git
git branch -M main
git push -u origin main
```

### 3. Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importar el repo de GitHub
4. En "Environment Variables" agregar:
   - `NEXTAUTH_SECRET` = tu secret
   - `NEXTAUTH_URL` = https://tu-proyecto.vercel.app
   - `ADMIN_PASSWORD` = tu contraseña
   - `DATABASE_URL` = tu conexión PostgreSQL

### 4. Base de datos (recomendado)

Para producción usar PostgreSQL en vez de SQLite:

**Supabase (gratis):**
1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Copiar "Connection string" (URI)
4. Usar ese URI como `DATABASE_URL` en Vercel

### 5. Migrar base de datos

Después del primer deploy, ejecutar migraciones:
```bash
npx prisma db push
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| DATABASE_URL | URL de PostgreSQL/SQLite |
| NEXTAUTH_SECRET | Secret para JWT (generar con `openssl rand -base64 32`) |
| NEXTAUTH_URL | URL de producción |
| ADMIN_PASSWORD | Contraseña del admin |
