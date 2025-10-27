#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
ENV_SAMPLE="$PROJECT_ROOT/web/env-example.txt"
ENV_FILE="$PROJECT_ROOT/web/.env"

if [ -t 1 ]; then
  clear
fi

printf '========================================\n'
printf '    PICHANGAPP - PREPARAR ENTORNO DEV\n'
printf '========================================\n\n'
printf 'Este script instalara las dependencias base y dejara listo el entorno.\n'
printf 'Asegurate de haber clonado el repo antes de continuar.\n\n'

printf 'Verificando dependencias...\n'
if ! command -v node >/dev/null 2>&1; then
  printf 'ERROR: Node.js no esta en PATH. Instala Node 20 LTS.\n'
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  printf 'ERROR: npm no esta en PATH. Reinstala Node.\n'
  exit 1
fi
printf '  Node: %s\n' "$(node -v)"
printf '  npm : %s\n' "$(npm -v)"

printf '\nInstalando dependencias del monorepo (npm install)...\n'
(
  cd "$PROJECT_ROOT"
  npm install
)

if [ -f "$ENV_SAMPLE" ] && [ ! -f "$ENV_FILE" ]; then
  printf '\nNo existe web/.env. Copiando env-example.txt como base...\n'
  cp "$ENV_SAMPLE" "$ENV_FILE"
  printf 'Recuerda actualizar web/.env con tus credenciales reales.\n'
fi

printf '\nDependencias instaladas correctamente.\n'
printf 'Ya puedes ejecutar ./start-macos.sh para iniciar el entorno de desarrollo.\n\n'
