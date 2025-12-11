@echo off
setlocal
cd /d "%~dp0\..\.."

title PichangApp - Lanzador DEV
echo ========================================
echo      PICHANGAPP - ARRANQUE DESARROLLO
echo ========================================
echo.
echo Este script abrira la consola de desarrollo Next.js.
echo.

echo Verificando dependencias...
where node >nul 2>&1 || (echo ERROR: Node.js no esta en PATH. Instala Node 20 LTS. & goto :END)
where npm  >nul 2>&1 || (echo ERROR: npm no esta en PATH. Reinstala Node. & goto :END)
if not exist "node_modules" (
  echo.
  echo ERROR: No se encontraron dependencias. Ejecuta primero scripts\setup\setup-windows.bat.
  goto :END
)
if not exist "apps\web\.env" (
  echo.
  echo ADVERTENCIA: apps\web\.env no existe. Copia apps\web\env-example.txt y actualiza las variables.
)

echo.
echo Iniciando servidor de desarrollo Next.js...
start "PichangApp - Next.js Dev" cmd /k "npm run dev"

echo.
echo Listo. Se abrio la consola de Next.js.
echo Esta ventana se cerrara automaticamente.
echo.

:END
endlocal
exit /b
