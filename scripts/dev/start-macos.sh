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
printf 'Este script abrira dos ventanas de Terminal:\n'
printf ' - Next.js : npm run dev (incluye API backend)\n'
printf ' - Expo    : npm exec --workspace mobile expo start (LAN/local)\n\n'

printf 'Verificando dependencias...\n'
if ! command -v node >/dev/null 2>&1; then
  printf 'ERROR: Node.js no esta en PATH. Instala Node 20 LTS.\n'
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  printf 'ERROR: npm no esta en PATH. Reinstala Node.\n'
  exit 1
fi
if ! command -v osascript >/dev/null 2>&1; then
  printf 'ERROR: osascript no esta disponible. Terminal no puede automatizarse.\n'
  exit 1
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  printf '\nERROR: No se encontraron dependencias. Ejecuta primero ./scripts/setup/setup-macos.sh.\n'
  exit 1
fi

if [ ! -f "$PROJECT_ROOT/apps/web/.env" ]; then
  printf '\nADVERTENCIA: apps/web/.env no existe. Copia apps/web/env-example.txt y actualiza las variables.\n'
fi

is_private_ip() {
  case "$1" in
    10.*|192.168.*|172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) return 0 ;;
    *) return 1 ;;
  esac
}

detect_local_ip() {
  local iface ip
  for iface in en0 en1 en2 en3; do
    ip=$(ipconfig getifaddr "$iface" 2>/dev/null || true)
    if [ -n "${ip:-}" ] && is_private_ip "$ip"; then
      printf '%s\n' "$ip"
      return 0
    fi
  done

  while read -r ip; do
    if [ -n "$ip" ] && is_private_ip "$ip"; then
      printf '%s\n' "$ip"
      return 0
    fi
  done < <(ifconfig 2>/dev/null | awk '/inet / {print $2}')

  return 1
}

printf '\nDetectando IP local para Expo...\n'
LOCAL_IP="$(detect_local_ip || true)"
if [ -n "$LOCAL_IP" ]; then
  EXPO_API_URL="http://$LOCAL_IP:3000"
  printf '  IP detectada: %s\n' "$LOCAL_IP"
  printf '  Expo apuntara a %s\n' "$EXPO_API_URL"
else
  EXPO_API_URL="http://localhost:3000"
  printf '  ADVERTENCIA: No se detecto IP privada. Expo usara %s\n' "$EXPO_API_URL"
  printf '  Ajusta EXPO_PUBLIC_API_BASE_URL manualmente si conectas desde otro dispositivo.\n'
fi

printf '\nAbriendo ventanas de Terminal...\n'
NEXT_COMMAND=$(printf 'cd %q && npm run dev' "$PROJECT_ROOT")

# Elegir modo de host para Expo: LAN si hay IP local privada, de lo contrario localhost.
if [ -n "$LOCAL_IP" ]; then
  HOST_FLAG="--lan"
else
  HOST_FLAG="--localhost"
fi

# No abrir tuneles nunca
MOBILE_COMMAND=$(printf 'cd %q && export EXPO_NO_TUNNEL=1 EXPO_PUBLIC_API_BASE_URL=%q && npm exec --workspace mobile expo start -- %s' "$PROJECT_ROOT" "$EXPO_API_URL" "$HOST_FLAG")
osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  do script "$NEXT_COMMAND"
  delay 1
  do script "$MOBILE_COMMAND"
end tell
APPLESCRIPT

printf '\nListo. Se abrieron las ventanas del servidor de desarrollo y Expo.\n'
printf 'Puedes cerrar esta ventana cuando quieras.\n\n'
