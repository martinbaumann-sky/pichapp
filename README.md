# PichangApp

Aplicación web de PichangApp desarrollada con Next.js.

## Estructura

```
apps/
└── web/      # Aplicación Next.js + API

docs/
├── guides/   # Guías operativas (requerimientos, variables, etc.)
└── archive/  # Referencias y artefactos históricos

scripts/
├── dev/      # Lanzadores de entornos de desarrollo
└── setup/    # Scripts de preparación del proyecto

package.json        # Configuración de workspaces y comandos globales
vercel.json         # Configuración de despliegue para Vercel
```

Consulta [`docs/guides/requirements.md`](docs/guides/requirements.md) para un onboarding detallado y [`docs/guides/environment.md`](docs/guides/environment.md) para la referencia completa de variables de entorno.

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Observabilidad y Calidad

- `apps/web/src/app/api/health` expone un health check JSON (base de datos + Redis) pensado para load balancers.
- La integración con Sentry (`@sentry/nextjs`) captura errores en server, edge y cliente con sampleo configurable.
- Los webhooks críticos (Mercado Pago) se encolan via Upstash QStash y se procesan en `api/jobs/process-mp-webhook`.
- El pipeline de GitHub Actions ejecuta lint, tests con cobertura y type-check en cada push/PR.
