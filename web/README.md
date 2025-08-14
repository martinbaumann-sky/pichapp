Pichanga Cupos – MVP

Configuración rápida

1) Variables de entorno
   - Copia `.env.example` a `.env` y completa:
     - `DATABASE_URL`
     - `MP_ACCESS_TOKEN`
     - `NEXT_PUBLIC_BASE_URL` (ej: http://localhost:3000)
     - `RESEND_API_KEY`
     - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_MAPBOX_TOKEN` (opcional para imágenes con pin)

2) Base de datos y Prisma
   - `npm run prisma:migrate` (crea tablas)
   - `npm run prisma:generate`
   - `npm run seed` (crea 5 partidos de ejemplo)

3) Desarrollo
   - `npm run dev`

Endpoints principales

- POST `/api/matches` – crear partido (Zod)
- GET `/api/matches` – listar/feed con filtros
- GET `/api/matches/[id]` – detalle
- POST `/api/matches/[id]/join` – reservar spot (concurrency-safe) y crear preferencia MP
- POST `/api/mp/webhook` – confirmar pago
- POST `/api/cron/release-holds` – liberar holds e invitar waitlist
- POST `/api/matches/[id]/no-show` – marcar no-show

Testing

- `npm run test` – pruebas con Vitest (pendiente agregar casos)

Cron (Vercel)

- Configurar Vercel Cron a `/api/cron/release-holds` cada 2 min
 
Rutas de la App (App Router)

- `/` Landing con cancha y pelota animada
- `/explorar` Grid de partidos con filtros y fotos (no-store)
- `/match/[id]` Detalle con organizador y jugadores (posición)
- `/organizar` Formulario con duración libre, cupos libres y lugar (pin Mapbox o imagen)
- `/dashboard` Tabs Organizador/Jugador (datos de ejemplo)

Notas

- Si defines lat/lng al crear un partido y existe `NEXT_PUBLIC_MAPBOX_TOKEN`, se generará `coverImageUrl` automáticamente con Mapbox Static.
- Si `paid=1` al volver del pago, el UI muestra toast y se refleja el cupo tomado.