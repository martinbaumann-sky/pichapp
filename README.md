# PichangApp Monorepo

Este repositorio contiene la aplicación web y móvil de PichangApp organizadas como un monorepo de npm workspaces.

## Estructura

```
apps/
├── mobile/   # App Expo Router (iOS, Android, Web)
└── web/      # Aplicación Next.js + API

docs/
├── guides/   # Guías operativas (requerimientos, variables, etc.)
└── archive/  # Referencias y artefactos históricos

scripts/
├── dev/      # Lanzadores de entornos de desarrollo
├── mobile/   # Utilidades específicas para la app móvil
└── setup/    # Scripts de preparación del monorepo

package.json        # Configuración de workspaces y comandos globales
package-lock.json   # Lockfile de npm
vercel.json         # Configuración de despliegue para Vercel
```

Consulta [`docs/guides/requirements.md`](docs/guides/requirements.md) para un onboarding detallado y [`docs/guides/environment.md`](docs/guides/environment.md) para la referencia completa de variables de entorno.

## Observabilidad y Calidad

- `apps/web/src/app/api/health` expone un health check JSON (base de datos + Redis) pensado para load balancers.
- La integración con Sentry (`@sentry/nextjs`) captura errores en server, edge y cliente con sampleo configurable.
- Los webhooks críticos (Mercado Pago) se encolan via Upstash QStash y se procesan en `api/jobs/process-mp-webhook`.
- El pipeline de GitHub Actions ejecuta lint, tests con cobertura y type-check en cada push/PR.
