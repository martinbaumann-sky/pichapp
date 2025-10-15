# Environment Configuration

This document centralizes every environment variable used across the project. Unless otherwise noted, variables must be defined in `web/.env` for development and configured in your hosting provider for production.

## Core
| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Full PostgreSQL connection string consumed by Prisma. |
| `DIRECT_URL` | Recommended | Non-pooled PostgreSQL URL used by `prisma migrate deploy`. Required by some managed databases (e.g. Vercel Postgres). |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public origin of the app (with protocol). Used for cookies, redirects and metadata. |
| `AUTH_SECRET` | Yes | HS256 secret to sign authentication tokens. Generate with `openssl rand -base64 32`. |

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
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional | Persistent rate limiting. Falls back to in-memory store locally. |

## Legacy Integrations & Scripts
| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Optional | Required only for Supabase management scripts (`scripts/clear-users`, `scripts/seed-dev-user`, etc.). |
| `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` | Optional | Aliases provided by some hosts (e.g. Vercel Postgres). Used as fallbacks in `npm run vercel-build`. |
| `STRICT_BUILD` | Optional | Set to `1` to convert lint warnings into build failures. |

## Local Development Tips
- Duplicate `web/env-example.txt` into `web/.env` as a starting point.
- Run `npm run prisma:generate` after editing database variables so Prisma Client picks up the new connection.
- Keep secrets out of version control by using `.env.local` or your provider's secret manager in production.
