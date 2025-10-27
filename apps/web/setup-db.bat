@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo    CONFIGURACION RAPIDA PICHANGAPP
echo ========================================
echo.

echo 1. Verificando PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL no esta instalado o no esta en PATH
    echo.
    echo Instala PostgreSQL: https://www.postgresql.org/download/windows/
    echo O usa Docker: docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
    echo.
    pause
    exit /b 1
)

echo PostgreSQL encontrado.
echo.

echo 2. Creando base de datos local 'pichapp' (si no existe)...
psql -U postgres -c "CREATE DATABASE pichapp;" 2>nul
if %errorlevel% neq 0 (
    echo Intentando con usuario actual...
    createdb pichapp 2>nul
)
echo.

echo 3. Configurando variables de entorno...
if not exist .env (
    echo Creando archivo .env...
    (
        echo # Database Configuration
        echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pichapp?schema=public"
        echo DIRECT_URL="postgresql://postgres:postgres@localhost:5432/pichapp"
        echo.
        echo # Base URL
        echo NEXT_PUBLIC_BASE_URL=http://localhost:3000
        echo.
        echo # Sessions
        echo AUTH_SECRET=change_me_in_dev
        echo.
        echo # Maps (opcional)
        echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
        echo NEXT_PUBLIC_MAPBOX_TOKEN=
        echo.
        echo # Email (opcional)
        echo RESEND_API_KEY=
        echo RESEND_FROM_EMAIL="PichangApp <no-reply@pichangapp.cl>"
        echo EMAIL_VERIFICATION_TTL_MINUTES=15
        echo.
        echo # Payments (opcional)
        echo MP_ACCESS_TOKEN=
        echo FLOW_API_KEY=
        echo FLOW_SECRET_KEY=
        echo FLOW_ENV=SANDBOX
        echo KHIPU_RECEIVER_ID=
        echo KHIPU_SECRET_KEY=
        echo FINTOC_SECRET_KEY=
        echo TRANSBANK_COMMERCE_CODE=
        echo TRANSBANK_API_KEY=
        echo.
        echo # Rate limiting (opcional)
        echo UPSTASH_REDIS_REST_URL=
        echo UPSTASH_REDIS_REST_TOKEN=
        echo.
        echo # Admin
        echo ADMIN_EMAIL=contacto.pichapp@gmail.com
        echo ADMIN_PASSWORD=Babolat3008
        echo ADMIN_USER_ID=admin-user-id
        echo ADMIN_EMAILS=contacto.pichapp@gmail.com
    ) > .env
    echo Archivo .env creado.
    echo.
    echo Revisa y edita .env segun tus credenciales reales.
    echo.
)

echo 4. Generando cliente Prisma...
npm run prisma:generate
if %errorlevel% neq 0 (
    echo Error generando Prisma. Revisa tu Node/npm.
    pause
    exit /b 1
)

echo.
echo 5. Ejecutando migraciones (dev)...
npm run prisma:migrate
if %errorlevel% neq 0 (
    echo Error ejecutando migraciones.
    pause
    exit /b 1
)

echo.
echo ========================================
echo     CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Para desarrollo, ejecuta: ..\start-windows.bat
echo.
pause
endlocal
exit /b
