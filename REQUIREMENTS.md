# Requirements

## Stack de la app
- Next.js 15 (App Router) y React 18 renderizados en el paquete `web`.
- Node.js 20 LTS y npm workspaces (raiz + paquete `web`).
- TypeScript 5, Tailwind CSS 3, ESLint 9, Vitest 3.
- Prisma 6 apuntando a PostgreSQL (scripts de migracion y seed incluidos).
- Librerias opcionales integradas: Mercado Pago, Flow, Khipu, Fintoc, Transbank sandbox, Resend, Mapbox, Google Maps, Upstash, Supabase (scripts).

## Dependencias de sistema
- Node.js >= 20.10 y npm >= 10.5 (usar nvm, Volta o el instalador LTS).
- Git 2.40+.
- PostgreSQL 15+ (o un servicio compatible). Se necesita acceso CLI (`psql`) para migraciones locales.
- Acceso a `npx` para Prisma y `tsx` (se instala via npm).
- Opcional: Docker para levantar PostgreSQL rapido:
  ```
  docker run --name pichapp-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
  ```

## Variables de entorno
Definirlas en `web/.env` para desarrollo y en tu proveedor (Vercel, AWS, etc.) para produccion.

### Basicas (obligatorias en produccion)
- `DATABASE_URL`: cadena PostgreSQL completa usada por Prisma.
- `DIRECT_URL`: URL sin pool para `prisma migrate deploy` (usa la variable no pool de tu proveedor; Vercel Postgres expone `POSTGRES_URL_NON_POOLING`).
- `NEXT_PUBLIC_BASE_URL`: URL publica de la app (incluye protocolo). Define cookies seguras y metadatos.
- `AUTH_SECRET` (o `JWT_SECRET`): clave HS256 para firmar los tokens de sesion.

### Email y administracion
- `RESEND_API_KEY`: necesario para enviar correos de verificacion (`/api/auth/verification/resend`).
- `RESEND_FROM_EMAIL`: remitente mostrado por Resend (default interno si falta).
- `EMAIL_VERIFICATION_TTL_MINUTES`: minutos de vigencia del codigo (default 15).
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USER_ID`, `ADMIN_EMAILS`, `NEXT_PUBLIC_ADMIN_EMAIL`: datos del usuario administrador y lista blanca usada en seeds/scripts.

### Mapas y contenido
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: habilita Places, Street View Static y fotos en `/api/geocode`.
- `NEXT_PUBLIC_MAPBOX_TOKEN`: genera imagenes estaticas de canchas (fallback a OSM si falta).

### Rate limiting y cache
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: necesarios para rate limiting persistente. Si faltan, se usa un fallback en memoria (no recomendado para produccion).

### Pagos y proveedores
- `MP_ACCESS_TOKEN`: requerido para habilitar Mercado Pago checkout.
- `MP_QR_USER_ID`, `MP_QR_POS_ID`: requeridos solo para la modalidad QR de Mercado Pago.
- `KHIPU_RECEIVER_ID`, `KHIPU_SECRET_KEY`: habilitan pagos con Khipu.
- `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_ENV`: habilitan Flow (`FLOW_ENV` valores `SANDBOX` o `PROD`).
- `FINTOC_SECRET_KEY`: habilita Webpay via Fintoc.
- `TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY`: usados por el sandbox de Webpay (Transbank).

### Integraciones heredadas y ajustes
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: solo necesarias si usas los scripts de Supabase (`scripts/clear-users`, `scripts/seed-dev-user`, etc.).
- `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`: variables que Vercel Postgres entrega y que el script `vercel-build` usa como fallback.
- `STRICT_BUILD`: define `1` para convertir errores de lint en fallos de build.

### Recomendaciones
Genera `AUTH_SECRET` con `openssl rand -base64 32` y almacena valores sensibles solo en el gestor de secretos de tu proveedor.

## Pasos rapidos en un PC nuevo
1. Clonar el repo: `git clone <URL> && cd pichapp`.
2. Instalar Node 20 LTS y PostgreSQL (o levantar el contenedor anterior).
3. Instalar dependencias: `npm install`.
4. Copiar plantilla: `copy web\env-example.txt web\.env` (Windows) o `cp web/env-example.txt web/.env` (Unix).
5. Editar `web/.env` con al menos `DATABASE_URL`, `DIRECT_URL` (si aplica), `NEXT_PUBLIC_BASE_URL`, `AUTH_SECRET` y los proveedores que se usaran.
6. Ejecutar Prisma desde la raiz:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
   - `npm run seed` (opcional, popula partidos de ejemplo).
7. Levantar entorno dev: `npm run dev` y navegar a http://localhost:3000.
8. Opcional: `npm run test` para validar con Vitest.

## Scripts utiles
- `npm run dev`: Next.js en modo desarrollo (workspace `web`).
- `npm run build`: build tradicional (`next build`).
- `npm run vercel-build`: asegura `prisma generate`, `prisma migrate deploy` y luego `next build` (usar en CI/CD).
- `npm run start`: servidor en modo produccion (`next start`).
- `npm run prisma:generate | migrate | studio`: tareas de base de datos.
- `npm run seed`, `npm run clear:matches`, `npm run seed:reset`: manejo de datos de ejemplo.
- `npm run test`: ejecuta Vitest.

## Guia de deploy en Vercel
- Directorio raiz: `.` (el proyecto usa npm workspaces).
- `Install Command`: `npm install`.
- `Build Command`: `npm run vercel-build`.
- `Output Directory`: Vercel detecta `.next`.
- Node version: 20.x (configurar en Vercel -> Settings -> Environment -> Node.js Version).
- Configurar las variables de entorno descritas arriba. Si usas Vercel Postgres, Vercel ya expone `POSTGRES_*`; aun asi define `DATABASE_URL` y `DIRECT_URL` expresamente para evitar ambiguedades.
- Agendar cron en `/api/cron/release-holds` si se desean liberaciones automaticas (cada 2 min recomendado).

## Guia de deploy en AWS
- Opcion Amplify / CodeBuild:
  - Install: `npm install`
  - Build: `npm run vercel-build`
  - Start (si aplica): `npm run start`
  - Definir `PORT` y crear `DATABASE_URL` apuntando a RDS (u otra base). Ejecutar `npx prisma migrate deploy` en el paso de build o en un job previo a `npm run start`.
- Opcion contenedor (ECS / Fargate / App Runner):
  - Usar imagen base `node:20-alpine`.
  - Copiar el workspace, ejecutar `npm install`, `npm run vercel-build`.
  - En el `CMD`, correr un script que primero ejecute `npx prisma migrate deploy` y luego `npm run start`.
- Asegurar SG o firewall de la base de datos permite conexiones desde la app.
- Gestionar secretos con AWS SSM Parameter Store o Secrets Manager; no commitear `.env` de produccion.

## Chequeos previos al despliegue
- `npm run test` y (si se agrega) `npm run lint`.
- Confirmar que `prisma migrate deploy` aplica limpio contra la base remota.
- Revisar que los proveedores de pago configurados tengan credenciales sandbox o produccion correctas antes de mover a produccion.
