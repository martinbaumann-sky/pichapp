@echo off
setlocal
cd /d "%~dp0\..\.."

title PichangApp - Setup DEV
echo ========================================
echo     PICHANGAPP - PREPARAR ENTORNO DEV
echo ========================================
echo.
echo Este script instalara las dependencias base y dejara listo el entorno.
echo Asegurate de haber clonado el repo antes de continuar.
echo.

echo Verificando dependencias...
where node >nul 2>&1 || (echo ERROR: Node.js no esta en PATH. Instala Node 20 LTS. & goto :END)
where npm  >nul 2>&1 || (echo ERROR: npm no esta en PATH. Reinstala Node. & goto :END)
for /f "usebackq tokens=* delims=" %%V in (`node -v`) do set "NODE_VERSION=%%V"
for /f "usebackq tokens=* delims=" %%V in (`npm -v`) do set "NPM_VERSION=%%V"
echo   Node: %NODE_VERSION%
echo   npm : %NPM_VERSION%

echo.
echo Instalando dependencias con npm install...
call npm install
if errorlevel 1 (
  echo.
  echo ERROR: Fallo la instalacion de dependencias. Revisa los mensajes anteriores.
  goto :END
)

if exist "apps\web\env-example.txt" if not exist "apps\web\.env" (
  echo.
  echo Copiando apps\web\env-example.txt a apps\web\.env como base...
  copy "apps\web\env-example.txt" "apps\web\.env" >nul
  if errorlevel 1 (
    echo ADVERTENCIA: No se pudo copiar apps\web\env-example.txt. Hazlo manualmente.
  ) else (
    echo Recuerda actualizar apps\web\.env con tus credenciales reales.
  )
)

echo.
echo Dependencias instaladas correctamente.
echo Ya puedes ejecutar scripts\dev\start-windows.bat para iniciar el entorno de desarrollo.
echo.

:END
endlocal
exit /b
