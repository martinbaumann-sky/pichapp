#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

clear
printf '========================================\n'
printf '     PICHANGAPP - ARRANQUE DESARROLLO\n'
printf '========================================\n\n'
printf 'Este script abrira UNA ventana para el servidor de desarrollo:\n'
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

printf 'Abriendo nueva ventana de Terminal...\n'
osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  do script "cd $SCRIPT_DIR && npm run dev"
end tell
APPLESCRIPT

printf '\nListo. Se abrio la ventana del servidor de desarrollo.\n'
printf 'Puedes cerrar esta ventana cuando quieras.\n\n'
