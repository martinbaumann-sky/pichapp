@echo off
setlocal
cd /d "%~dp0"

title PichangApp - Setup DEV
echo ========================================
echo     PICHANGAPP - PREPARAR ENTORNO DEV
echo ========================================
echo.
echo Este script instalara las dependencias del proyecto.
echo Asegurate de haber clonado el repo antes de continuar.
echo.

echo Verificando dependencias...
where node >nul 2>&1 || (echo ERROR: Node.js no esta en PATH. Instala Node 20 LTS. & goto :END)
where npm  >nul 2>&1 || (echo ERROR: npm no esta en PATH. Reinstala Node. & goto :END)

echo.
echo Instalando dependencias con npm install...
call npm install
if errorlevel 1 (
  echo.
  echo ERROR: Fallo la instalacion de dependencias. Revisa los mensajes anteriores.
  goto :END
)

echo.
echo Dependencias instaladas correctamente.
echo Ya puedes ejecutar start-definitivo.bat para iniciar el entorno de desarrollo.
echo.

:END
endlocal
exit /b
