# Plan integral: Web-only con Supabase (sin Prisma ni mobile) y port de mejoras del commit `baf13e0b1da824ee7aca9a2c54549fee3ee5f38a`

## Objetivo
- Dejar la rama **solo con la app web** sobre **Supabase** (sin rastro de Prisma ni de la app móvil/Expo).
- Portar lo útil del commit `baf13e0b1da824ee7aca9a2c54549fee3ee5f38a`: lógica robusta de checkout/reservas, mejoras en pagos/rutas, y configuración de Sentry solo en producción.
- Eliminar scripts/env/plantillas de Prisma y cualquier artefacto de la app móvil.

## Estado actual (observado)
- Carpeta mobile removida, envs apuntan a Supabase.
- Persisten alias `prisma` (compat Supabase) en muchas APIs/libs y el stub `src/types/prisma.d.ts`.
- Archivos legacy en `apps/web`: `setup-images.bat`, `tmp_prev_*`, `test-*` (no aplican).
- Lógica específica del commit no está portada aún (checkout/pagos, params async, Sentry).

## Trabajo por fases

### A) Limpieza base
1. Borrar archivos/scripts legacy en `apps/web`: `setup-images.bat`, `tmp_prev_*`, `test-*.js/ts`, restos de mobile/Expo si quedara algo.
2. Revisar `package.json` raíz y `apps/web/package.json`: eliminar scripts `prisma:*` y dependencias Prisma; mantener solo Supabase y dependencias vigentes (Radix/next-themes/@types-bcrypt si se usan).
3. Verificar envs (`.env.example`, `env-example.txt`) contienen solo claves Supabase/mapas/pagos; sin referencias a Prisma.

### B) Migrar backend a Supabase (sustituir Prisma)
Meta: cero uso real de `prisma`. Reemplazar importaciones y llamadas por clientes Supabase (service/route). Al final, eliminar `types/prisma.d.ts` y alias `prisma` si ya no se usa.

- **Auth**: `auth/signup`, `auth/login`, `auth/session`, `auth/verify-email`, `auth/verification/resend`, `auth/oauth/google/callback`, `auth/signout`. Migrar User/Profile/Sessions a Supabase; usar `createServerClient` para cookies.
- **Matches/Spots**:
  - `api/matches`, `api/matches/[id]`, `join`, `leave`, `reserve`, `rate`, `no-show`.
  - Portar `api/matches/[id]/checkout` con la lógica del commit: validar estado/precio, contar PAID/CONFIRMED, reutilizar reservas, lock optimista de spot AVAILABLE con reintentos (3) y hold 15 minutos, mensajes claros.
- **Pagos**: `payments/process`, `payments/[id]`, webhooks MP/Flow/Khipu/TB; conectar con stubs `lib/mp/*`, `lib/payments/*` sobre Supabase.
- **Venue**: `venue/profile`, `venue/register`, `venue/login`, `venue/dashboard`, `venue/matches/cancel`, planes `plans/checkout|cancel|status`, MP connect/disconnect.
- **Admin**: `admin/overview`, `admin/matches/users/venues/admins/export/emails`, `mp-diagnostic`; consultas/agregados via Supabase.
- **Mensajes/Notifs/Amigos**: `messages`, `messages/inbox`, `notifications`, `friends`, `friends/[id]`.
- **Jobs/Cron**: `cron/release-holds`, `jobs/t60-confirm-or-refund`, `tb/webhook|simulate` migrados a Supabase.
- **Libs**: actualizar `email-verification`, `user-summary`, `freeReservations`, `admin/delete-user|delete-venue|match-tools`, `queue`, `prismaCompat` (eliminar si ya no se usa), y remover `lib/prisma.ts`/alias `prisma` cuando no haya referencias.

### C) Configuración
1. `next.config.ts`: aplicar patrón del commit `baf13e0b1da824ee7aca9a2c54549fee3ee5f38a`: Sentry solo en producción con `withSentryConfig`, `release: { name }`, `disableLogger`, `hideSourceMaps`; respetar `loadEnvConfig`.
2. TSConfig: re-incluir APIs tras migrar; ir quitando `ts-nocheck` conforme se corrigen tipos.
3. Dependencias: confirmar Radix/next-themes/@types bcrypt, etc., eliminar no usadas.

### D) Frontend (opcional / menor prioridad)
1. Portar mejoras UI del commit si son compatibles: header/footer/RouteTransition, panel de cancha, CreateMatchWizard, landing.
2. Ajustar tipos (Lucide/Radix) y eliminar `ts-nocheck` donde sea viable.

### E) Validación
1. Ejecutar `npm run lint` y `npx tsc --noEmit` en `apps/web`; corregir errores sin reintroducir logs de build.
2. `rg` para confirmar que no queden importaciones de `prisma`/`@prisma/client`.
3. Probar manualmente flujos críticos: signup/login, crear partido, checkout/reserva, pagos (stubs), perfil venue, admin overview, notifs/mensajes.

### F) Cierre
1. Al compilar y pasar lint/tsc: eliminar stubs/compat de Prisma (`types/prisma.d.ts`, alias `prisma` si procede) o renombrar a `db` consistentemente.
2. Commit con mensaje claro: “Port Supabase-only backend, migrate checkout/pagos logic from baf13e0b1da824ee7aca9a2c54549fee3ee5f38a, remove Prisma/mobile artifacts, prod-only Sentry config.”
3. Push solo tras validar ausencia de restos de mobile/Prisma y flujos clave operativos.
