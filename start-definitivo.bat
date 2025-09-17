@echo off
setlocal
cd /d "%~dp0"

title PichangApp - Lanzador DEV
echo ========================================
echo      PICHANGAPP - ARRANQUE DESARROLLO
echo ========================================
echo.
echo Este script abrira DOS ventanas separadas:
echo  - FRONT   : Next.js (npm run dev)
echo  - BACKEND : Prisma Studio (npm run prisma:studio)
echo.

echo Verificando dependencias...
where node >nul 2>&1 || (echo ERROR: Node.js no esta en PATH. Instala Node 20 LTS. & goto :END)
where npm  >nul 2>&1 || (echo ERROR: npm no esta en PATH. Reinstala Node. & goto :END)

echo Abriendo consolas...
rem Ventana FRONT (Next dev)
start "PichangApp - FRONT (Next dev)" cmd /k "npm run dev"

rem Ventana BACKEND (Prisma Studio para inspeccionar BD)
start "PichangApp - BACKEND (Prisma Studio)" cmd /k "npm run prisma:studio"

echo.
echo Listo. Se abrieron las ventanas FRONT y BACKEND.
echo Cierra esta ventana si no la necesitas.
echo.

:END
pause
endlocal
exit /b

