@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo      VISOR DE BASE DE DATOS PICHAPP
echo ========================================
echo.

echo 1. Verificando Node.js y npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm no esta instalado o no esta en PATH.
    echo Instala Node.js desde https://nodejs.org/ antes de continuar.
    echo.
    pause
    exit /b 1
)
echo npm detectado.
echo.

echo 2. Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias de web/ ...
    call npm install
    if %errorlevel% neq 0 (
        echo Error instalando dependencias. Revisa el log anterior.
        pause
        exit /b 1
    )
    echo.
)

echo 3. Verificando configuracion de base de datos...
if not exist .env (
    echo ADVERTENCIA: no se encontro un archivo .env.
    echo Prisma Studio usara la variable DATABASE_URL del entorno del sistema.
    echo Asegurate de tener la base de datos activa antes de continuar.
    echo.
) else (
    for /f "tokens=1,* delims==" %%A in ('type .env ^| findstr /B "DATABASE_URL="') do (
        set "DATABASE_URL=%%~B"
    )
    if not defined DATABASE_URL (
        echo ADVERTENCIA: .env no contiene DATABASE_URL.
        echo Prisma Studio intentara usar la configuracion por defecto.
        echo.
    ) else (
        echo Se detecto DATABASE_URL configurado.
        echo.
    )
)

echo 4. Abriendo Prisma Studio...
call npx prisma generate >nul 2>&1
call npx prisma studio
if %errorlevel% neq 0 (
    echo.
    echo Ocurrio un error al intentar abrir Prisma Studio.
    echo Verifica que la base de datos este activa y que la variable DATABASE_URL sea correcta.
    pause
    exit /b 1
)

echo.
echo Prisma Studio se esta ejecutando en http://localhost:5555
if defined DATABASE_URL (
    echo Base de datos objetivo: %DATABASE_URL%
)
echo.
echo Cierra esta ventana cuando termines.
pause
endlocal
exit /b
