#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -t 1 ]; then
  clear
fi

printf '========================================\n'
printf '    PICHANGAPP - PREPARAR ENTORNO DEV\n'
printf '========================================\n\n'
printf 'Este script instalara las dependencias del proyecto.\n'
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

printf '\nInstalando dependencias con npm install...\n'
(
  cd "$SCRIPT_DIR"
  npm install
)

printf '\nDependencias instaladas correctamente.\n'
printf 'Ya puedes ejecutar start-definitivo-macos.sh para iniciar el entorno de desarrollo.\n'
printf '\n'
 