@echo off
echo ========================================
echo    CONFIGURACION RAPIDA PICHANGA
echo ========================================
echo.

echo 1. Verificando PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL no esta instalado o no esta en PATH
    echo.
    echo Instala PostgreSQL desde: https://www.postgresql.org/download/windows/
    echo O usa Docker: docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
    echo.
    pause
    exit /b 1
)

echo PostgreSQL encontrado ✓
echo.

echo 2. Creando base de datos...
psql -U postgres -c "CREATE DATABASE pichanga_db;" 2>nul
if %errorlevel% neq 0 (
    echo Intentando con usuario actual...
    createdb pichanga_db 2>nul
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo crear la base de datos
        echo Asegurate de que PostgreSQL este corriendo en puerto 5432
        pause
        exit /b 1
    )
)

echo Base de datos creada ✓
echo.

echo 3. Configurando variables de entorno...
if not exist .env (
    echo Creando archivo .env...
    (
        echo # Supabase Configuration
        echo NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
        echo SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
        echo.
        echo # Database Configuration
        echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pichanga_db"
        echo.
        echo # Mercado Pago
        echo MP_ACCESS_TOKEN=your-mp-access-token
        echo.
        echo # Base URL
        echo NEXT_PUBLIC_BASE_URL=http://localhost:3000
        echo.
        echo # Google Maps API ^(opcional^)
        echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
        echo.
        echo # Admin Configuration
        echo ADMIN_EMAIL=admin@pichanga.com
        echo ADMIN_PASSWORD=admin123
        echo.
        echo # Resend ^(opcional^)
        echo RESEND_API_KEY=your-resend-api-key
    ) > .env
    echo Archivo .env creado ✓
) else (
    echo Archivo .env ya existe ✓
)

echo.
echo 4. Generando cliente Prisma...
npm run prisma:generate

echo.
echo 5. Ejecutando migraciones...
npm run prisma:migrate

echo.
echo ========================================
echo    CONFIGURACION COMPLETADA
echo ========================================
echo.
echo IMPORTANTE: Edita el archivo .env con tus credenciales reales
echo - NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY de Supabase
echo - DATABASE_URL si usas credenciales diferentes
echo.
echo Luego ejecuta: npm run dev
echo.
pause
