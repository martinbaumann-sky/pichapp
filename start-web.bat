@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if exist web (
  cd web
) else (
  echo No se encontro la carpeta "web".
  pause
  exit /b 1
)
set PORT=3000
npm run dev
