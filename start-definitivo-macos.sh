#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -t 1 ]; then
  clear
fi

printf '========================================\n'
printf '     PICHANGAPP - ARRANQUE DESARROLLO\n'
printf '========================================\n\n'
printf 'Este script levantara el entorno en ESTA misma terminal:\n'
printf ' - Migraciones Prisma (si aplica)\n'
printf ' - Next.js : npm run dev (incluye API backend)\n\n'

printf 'Verificando dependencias...\n'
if ! command -v node >/dev/null 2>&1; then
  printf 'ERROR: Node.js no esta en PATH. Instala Node 20 LTS.\n'
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf 'ERROR: npm no esta en PATH. Reinstala Node.\n'
  exit 1
fi

# Cargar/env por defecto para Postgres local sin Docker (peer auth)
# Si no hay DATABASE_URL definida, usar localhost sin user/pass
if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgresql://localhost:5432/pichangas?schema=public"
  printf 'DATABASE_URL no definida. Usando default local: %s\n' "$DATABASE_URL"
fi

# Validar que psql exista y la DB responda (opcional, pero útil)
if command -v psql >/dev/null 2>&1; then
  printf '\nComprobando conexión a Postgres local...\n'
  if PGPASSWORD="${PGPASSWORD:-}" psql "$DATABASE_URL" -c "\conninfo" >/dev/null 2>&1; then
    printf 'Conexión a Postgres OK.\n'
  else
    printf 'AVISO: No se pudo verificar la conexión con psql. Continuare e intentare con Prisma.\n'
  fi
else
  printf 'AVISO: psql no esta instalado, omito verificación de conexión.\n'
fi

printf '\nEjecutando prisma generate...\n'
(
  cd "$SCRIPT_DIR" && npm run prisma:generate
)

printf '\nEjecutando prisma migrate (creara tablas si faltan)...\n'
(
  cd "$SCRIPT_DIR" && npm run prisma:migrate || true
)

printf '\nIniciando servidor de desarrollo (Next.js)\n'
(
  cd "$SCRIPT_DIR" && npm run dev
)

printf '\nServidor finalizado.\n\n'
