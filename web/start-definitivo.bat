@echo off
title Pichanga Cupos - Servidor
echo ========================================
echo    PICHANGA CUPOS - SERVIDOR WEB
echo ========================================
echo.
echo Iniciando servidor de desarrollo...
echo.
echo IMPORTANTE: NO CIERRES ESTA VENTANA
echo El servidor debe mantenerse corriendo
echo.
echo Espera a que compile completamente...
echo.
echo Cuando veas "Ready" puedes abrir:
echo http://localhost:3000
echo.
echo ========================================
echo.

cd /d "%~dp0"
npm run dev

echo.
echo El servidor se detuvo. Presiona cualquier tecla para salir...
pause >nul

