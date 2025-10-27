PichangApp ??? MVP

Configuraci??n r??pida

1) Variables de entorno
   - Copia `env-example.txt` a `.env` y completa los valores necesarios.
   - Consulta [Environment Configuration](../../docs/guides/environment.md) para ver qu?? variables son obligatorias y qu?? servicios habilita cada una.

2) Base de datos y Prisma
   - `npm run prisma:migrate` (crea tablas)
   - `npm run prisma:generate`
   - `npm run seed` (crea 5 partidos de ejemplo)

3) Desarrollo
   - `npm run dev`

Endpoints principales

- POST `/api/matches` ??? crear partido (Zod)
- GET `/api/matches` ??? listar/feed con filtros
- GET `/api/matches/[id]` ??? detalle
- POST `/api/matches/[id]/join` ??? reservar spot (concurrency-safe) y crear preferencia MP
- POST `/api/mp/webhook` ??? confirmar pago
- POST `/api/jobs/process-mp-webhook` ??? worker as??ncrono desde Upstash QStash
- GET `/api/health` ??? health check para load balancers (DB + Redis)
- POST `/api/cron/release-holds` ??? liberar holds e invitar waitlist
- POST `/api/matches/[id]/no-show` ??? marcar no-show

Testing

- `npm run test` ??? Vitest con cobertura habilitada
- `npm run lint` ??? ESLint (fallar?? en CI si hay warnings bloqueantes)
- `npx tsc --project apps/web/tsconfig.json --noEmit` ??? type-check estricto

Observabilidad y resiliencia

- Sentry (`SENTRY_DSN`) captura errores y traces tanto en server como en client.
- Logging estructurado con Pino (`LOG_LEVEL`) reemplaza `console.*` y se env??a a stdout.
- Upstash QStash (`QSTASH_*`) despacha el webhook de MercadoPago a un worker idempotente.

Cron (Vercel)

- Configurar Vercel Cron a `/api/cron/release-holds` cada 2 min
 
Rutas de la App (App Router)

- `/` Landing con cancha y pelota animada
- `/explorar` Grid de partidos con filtros y fotos (no-store)
- `/match/[id]` Detalle con organizador y jugadores (posici??n)
- `/organizar` Formulario con duraci??n libre, cupos libres y lugar (pin Mapbox o imagen)
- `/dashboard` Tabs Organizador/Jugador (datos de ejemplo)

Notas

- Si defines lat/lng al crear un partido y existe `NEXT_PUBLIC_MAPBOX_TOKEN`, se generar?? `coverImageUrl` autom??ticamente con Mapbox Static.
- Si `paid=1` al volver del pago, el UI muestra toast y se refleja el cupo tomado.

Deploy en Vercel

- El repo usa npm workspaces; deja `Root Directory` en `.`.
- `Install Command`: `npm install` (instala dependencias de `apps/web`).
- `Build Command`: `npm run vercel-build` (ejecuta `prisma generate`, `prisma migrate deploy` y `next build`).
- Configura las variables de entorno de produccion en el panel (ver [`docs/guides/environment.md`](../../docs/guides/environment.md)).
- Si aun no tienes base Postgres, usa temporalmente `npm run build` y ejecuta migraciones manualmente.



