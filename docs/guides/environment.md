# Environment Configuration

This document centralizes every environment variable used across the project. Unless otherwise noted, variables must be defined in `apps/web/.env` for development and configured in your hosting provider for production.

## Core
| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Full PostgreSQL connection string consumed by Prisma. |
| `DIRECT_URL` | Recommended | Non-pooled PostgreSQL URL used by `prisma migrate deploy`. Required by some managed databases (e.g. Vercel Postgres). |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public origin of the app (with protocol). Used for cookies, redirects and metadata. |
| `WEB_APP_BASE_URL` | Optional | Internal origin used when background jobs need a stable base URL (defaults to `NEXT_PUBLIC_BASE_URL`). |
| `AUTH_SECRET` | Yes | HS256 secret to sign authentication tokens. Generate with `openssl rand -base64 32`. |

## Database Providers
### Supabase (Postgres)
If you manage your PostgreSQL database with Supabase you can either set `DATABASE_URL`/`DIRECT_URL` manually or let the app build them from the Supabase credentials below.

| Variable | Required | Description |
| --- | --- | --- |
| `SUPABASE_DB_URL` | Optional | Direct connection string (`psql`) copied from **Project Settings → Database**. Used when `DATABASE_URL` is not set. |
| `SUPABASE_DB_POOLER_URL` | Optional | Connection pooling string (`pgbouncer`) copied from the same screen. Preferred for serverless deployments. |
| `SUPABASE_DB_HOST` / `SUPABASE_DB_PORT` | Optional | Host and port of the primary database. Used to compose the connection string if `SUPABASE_DB_URL` is absent. Defaults to port `5432`. |
| `SUPABASE_DB_DATABASE` | Optional | Database name (defaults to `postgres`). |
| `SUPABASE_DB_USER` / `SUPABASE_DB_PASSWORD` | Optional | Credentials for the Postgres user. |
| `SUPABASE_DB_POOLER_HOST` / `SUPABASE_DB_POOLER_PORT` | Optional | Host/port for the pooling endpoint. Defaults to port `6543`. |

> The helper automatically enforces `sslmode=require` for Supabase hosts and adds `?pgbouncer=true&connection_limit=1` when pointing to the pooling endpoint.

## Email & Admin
| Variable | Required | Description |
| --- | --- | --- |
| `RESEND_API_KEY` | Optional (prod recommended) | Enables transactional emails through Resend (verification messages). |
| `RESEND_FROM_EMAIL` | Optional | Overrides the default From header for Resend. |
| `EMAIL_VERIFICATION_TTL_MINUTES` | Optional | Minutes before a verification code expires. Defaults to `15`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USER_ID` | Optional | Default admin credentials for seeds and local scripts. |
| `ADMIN_EMAILS` | Optional | Comma separated allow-list for admin accounts. |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Optional | Exposes a contact/admin email address to the frontend. |

## Maps & Content
| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Enables Google Places, Street View Static and `/api/geocode`. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional | Generates static pitch images via Mapbox. The UI falls back to OSM if absent. |

## Payments & Providers
| Variable | Required | Description |
| --- | --- | --- |
| `MP_ACCESS_TOKEN` | Optional (required for Mercado Pago) | Enables classic Mercado Pago checkout flows. |
| `MP_QR_USER_ID` / `MP_QR_POS_ID` | Optional | Required only for Mercado Pago QR payments. |
| `KHIPU_RECEIVER_ID` / `KHIPU_SECRET_KEY` | Optional | Enables Khipu payments. |
| `FLOW_API_KEY` / `FLOW_SECRET_KEY` / `FLOW_ENV` | Optional | Enables Flow payments. `FLOW_ENV` accepts `SANDBOX` or `PROD`. |
| `FINTOC_SECRET_KEY` | Optional | Enables Transbank Webpay via Fintoc. |
| `TRANSBANK_COMMERCE_CODE` / `TRANSBANK_API_KEY` | Optional | Credentials for the Webpay sandbox. |

## Rate Limiting & Caching
| Variable | Required | Description |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | Persistent rate limiting and Redis health check. Falls back to in-memory store locally. |

## Observability
| Variable | Required | Description |
| --- | --- | --- |
| `SENTRY_DSN` | Optional (prod recommended) | Enables error and performance tracking with Sentry across client/server/edge. |
| `SENTRY_ENVIRONMENT` | Optional | Overrides the environment tag reported to Sentry. Defaults to `NODE_ENV`. |
| `SENTRY_TRACES_SAMPLE_RATE` / `SENTRY_PROFILES_SAMPLE_RATE` | Optional | Fraction of requests/profiled transactions captured for performance monitoring. |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Optional | Required only if CI uploads source maps via the Sentry Webpack plugin. |
| `LOG_LEVEL` | Optional | Pino log level (`info`, `debug`, etc.). Defaults to `debug` locally and `info` in production. |

## Async Workloads & Webhooks
| Variable | Required | Description |
| --- | --- | --- |
| `MP_WEBHOOK_JOB_URL` | Optional | Absolute URL used by the webhook handler when enqueuing Mercado Pago jobs. Defaults to `NEXT_PUBLIC_BASE_URL`. |
| `QSTASH_URL` / `QSTASH_TOKEN` | Optional | Upstash QStash REST endpoint and token. Required to enqueue background jobs. |
| `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` | Optional | Keys used to verify QStash signatures when the queue calls back the worker route. |


## Legacy Integrations & Scripts
| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Optional | Required only for Supabase management scripts (`apps/web/scripts/clear-users.ts`, `apps/web/scripts/seed-dev-user.ts`, etc.). |
| `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` | Optional | Aliases provided by some hosts (e.g. Vercel Postgres). Used as fallbacks in `npm run vercel-build`. |

## Local Development Tips
- Duplicate `apps/web/env-example.txt` into `apps/web/.env` as a starting point.
- Run `npm run prisma:generate` after editing database variables so Prisma Client picks up the new connection.
- Keep secrets out of version control by using `.env.local` or your provider's secret manager in production.
