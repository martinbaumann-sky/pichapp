# Requirements

## Stack de la app
- Next.js 15 (App Router) y React 18 renderizados en el paquete `apps/web`.
- Node.js 20 LTS y npm workspaces (raiz + paquete `apps/web`).
- TypeScript 5, Tailwind CSS 3, ESLint 9, Vitest 3.
- Supabase como backend de base de datos (PostgreSQL gestionado).
- Librerías opcionales integradas: Mercado Pago, Flow, Khipu, Fintoc, Transbank sandbox, Resend, Mapbox, Google Maps, Upstash.

## Dependencias de sistema
- Node.js >= 20.10 y npm >= 10.5 (usar nvm, Volta o el instalador LTS).
- Git 2.40+.
- PostgreSQL 15+ (o un servicio compatible). Se necesita acceso CLI (`psql`) para migraciones locales.
- Acceso a `npx` y `tsx` (se instala via npm).
- Opcional: Docker para levantar PostgreSQL rapido:
  ```
  docker run --name pichapp-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
  ```

## Variables de entorno
Consulta [Environment Configuration](./environment.md) para la lista completa de variables, sus descripciones y el detalle de qué servicios habilita cada una. Define los valores en `apps/web/.env` durante el desarrollo y en tu proveedor (Vercel, AWS, etc.) para los entornos desplegados.

## Pasos rapidos en un PC nuevo
1. Clonar el repo: `git clone <URL> && cd pichapp`.
2. Instalar Node 20 LTS y PostgreSQL (o levantar el contenedor anterior).
3. Ejecutar el script de setup segun tu sistema:
   - macOS / Linux: `./scripts/setup/setup-macos.sh`
   - Windows: `scripts\setup\setup-windows.bat`
   Estos scripts corren `npm install` y copian `apps/web/env-example.txt` a `apps/web/.env` si aun no existe.
4. Si prefieres hacerlo manual: `npm install` y copia la plantilla (`copy apps\web\env-example.txt apps\web\.env` en Windows / `cp apps/web/env-example.txt apps/web/.env` en Unix).
5. Editar `apps/web/.env` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
6. Configurar la base de datos en Supabase (las tablas y funciones están definidos en `apps/web/src/lib/db.ts` y migraciones SQL).
7. Levantar entorno dev: `npm run dev` (o `./scripts/dev/start-macos.sh` / `scripts\dev\start-windows.bat`) y navegar a http://localhost:3000.
8. Opcional: `npm run test` para validar con Vitest.

## Scripts utiles
- `npm run dev`: Next.js en modo desarrollo (workspace `web`).
- `npm run build`: build tradicional (`next build`).
- `npm run vercel-build`: build para producción.
- `npm run start`: servidor en modo produccion (`next start`).
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
  - Definir `PORT` y configurar las variables de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- Opcion contenedor (ECS / Fargate / App Runner):
  - Usar imagen base `node:20-alpine`.
  - Copiar el workspace, ejecutar `npm install`, `npm run vercel-build`.
  - En el `CMD`, ejecutar `npm run start`.
- Asegurar SG o firewall de la base de datos permite conexiones desde la app.
- Gestionar secretos con AWS SSM Parameter Store o Secrets Manager; no commitear `.env` de produccion.

## Chequeos previos al despliegue
- `npm run test` y (si se agrega) `npm run lint`.
- Confirmar que las variables de Supabase están configuradas correctamente.
- Revisar que los proveedores de pago configurados tengan credenciales sandbox o produccion correctas antes de mover a produccion.
