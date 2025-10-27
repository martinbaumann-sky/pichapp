@echo off
setlocal

cd /d "%~dp0..\.."

echo ========================================
echo   PichangApp - Setup dependencias mobile
echo ========================================
echo.

where node >nul 2>&1 || (echo ERROR: Node.js no esta en PATH. Instala Node 20 LTS. & exit /b 1)
where npm  >nul 2>&1 || (echo ERROR: npm no esta en PATH. Reinstala Node. & exit /b 1)

echo Instalando dependencias del workspace mobile...
npm install --workspace mobile
if errorlevel 1 (
  echo ERROR: No fue posible instalar dependencias del workspace mobile.
  exit /b 1
)

echo Dependencias mobile listas.
echo.

endlocal
exit /b 0
