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

echo Abriendo consolas...
rem Ventana Next.js dev (incluye API)
start "PichangApp - Next.js Dev" cmd /k "npm run dev"

echo.
echo Listo. Se abrio la ventana del servidor de desarrollo.
echo Esta ventana se cerrara automaticamente.
echo.

:END
endlocal
exit /b
