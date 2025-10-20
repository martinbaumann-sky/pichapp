@echo off
setlocal
cd /d "%~dp0"

title PichangApp - Lanzador DEV
echo ========================================
echo      PICHANGAPP - ARRANQUE DESARROLLO
echo ========================================
echo.
echo Este script abrira UNA ventana para el servidor de desarrollo:
echo  - Next.js : npm run dev (incluye API backend)
echo.

echo Verificando dependencias...
where node >nul 2>&1 || (echo ERROR: Node.js no esta en PATH. Instala Node 20 LTS. & goto :END)
where npm  >nul 2>&1 || (echo ERROR: npm no esta en PATH. Reinstala Node. & goto :END)

echo Ejecutando setup de la app mobile...
call scripts\mobile\setup-mobile.bat
if errorlevel 1 (
  echo ERROR: Fallo el setup de la app mobile. Revisa los mensajes anteriores.
  goto :END
)

echo Detectando IP local para Expo...
for /f "usebackq tokens=*" %%I in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { ($_.IPAddress -like '10.*' -or $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '172.1[6-9]*' -or $_.IPAddress -like '172.2[0-9]*' -or $_.IPAddress -like '172.3[0-1]*') -and $_.IPAddress -ne '127.0.0.1' } ^| Select-Object -First 1 -ExpandProperty IPAddress"`) do set "LOCAL_IP=%%~I"

if defined LOCAL_IP (
  set "EXPO_API_URL=http://%LOCAL_IP%:3000"
  echo   IP detectada: %LOCAL_IP%
  echo   Expo apuntara a %EXPO_API_URL%
) else (
  set "EXPO_API_URL=http://localhost:3000"
  echo   ADVERTENCIA: No se detecto IP privada.
  echo   Expo usara %EXPO_API_URL%. Si abres desde otro dispositivo, cambia manualmente.
)

echo.
echo Abriendo consolas...
rem Ventana Next.js dev (incluye API)
start "PichangApp - Next.js Dev" cmd /k "npm run dev"
rem Ventana Expo (mobile)
start "PichangApp - Expo (Mobile)" cmd /k "set EXPO_PUBLIC_API_BASE_URL=%EXPO_API_URL% && npm exec --workspace mobile expo start -- --tunnel"

echo.
echo Listo. Se abrio la ventana del servidor de desarrollo.
echo Esta ventana se cerrara automaticamente.
echo.

:END
endlocal
exit /b
