#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -t 1 ]; then
  clear
fi

printf '========================================\n'
printf '     PICHANGAPP - ARRANQUE DESARROLLO\n'
printf '========================================\n\n'
printf 'Este script iniciara el servidor de desarrollo Next.js.\n\n'

printf 'Verificando dependencias...\n'
if ! command -v node >/dev/null 2>&1; then
  printf 'ERROR: Node.js no esta en PATH. Instala Node 20 LTS.\n'
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  printf 'ERROR: npm no esta en PATH. Reinstala Node.\n'
  exit 1
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  printf '\nERROR: No se encontraron dependencias. Ejecuta primero ./scripts/setup/setup-macos.sh.\n'
  exit 1
fi

if [ ! -f "$PROJECT_ROOT/apps/web/.env" ]; then
  printf '\nADVERTENCIA: apps/web/.env no existe. Copia apps/web/env-example.txt y actualiza las variables.\n'
fi

printf '\nIniciando servidor de desarrollo Next.js...\n'
cd "$PROJECT_ROOT"
npm run dev
