@echo off
echo ========================================
echo   CONFIGURACION DE IMAGENES GOOGLE MAPS
echo ========================================
echo.

echo 1. Para que las imagenes funcionen, necesitas:
echo    - Una API key de Google Maps
echo    - Habilitar las APIs: Places API, Street View Static API
echo.
echo 2. Obtener API key:
echo    - Ve a: https://console.cloud.google.com/
echo    - Crea un proyecto o selecciona uno existente
echo    - Ve a "APIs y servicios" > "Credenciales"
echo    - Crea una nueva API key
echo    - Restringe la key a: Places API, Street View Static API
echo.
echo 3. Configurar .env:
echo    - Copia env-example.txt como .env
echo    - Reemplaza "tu-api-key-de-google-maps" con tu API key real
echo.
echo 4. Reiniciar servidor:
echo    - Deten el servidor (Ctrl+C)
echo    - Ejecuta: npm run dev
echo.
echo 5. Probar:
echo    - Ve a http://localhost:3000/explorar
echo    - Las imagenes deberian aparecer automaticamente
echo.

pause
