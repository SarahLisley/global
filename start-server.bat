@echo off
setlocal
title Portal Global Bravo - SERVIDOR
cls

echo ========================================
echo     SERVIDOR - Portal Global Bravo
echo ========================================
echo.

cd /d "%~dp0"

REM Mata processos existentes
echo [LOG] Parando aplicacao anterior...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Inicia o BACKEND (Producao)
echo [LOG] Iniciando API em modo PRODUCAO...
cd apps/api
start "API - PGB" /min node dist/apps/api/src/server.js
cd ../..

REM Inicia o FRONTEND (Dev Mode - Para evitar erro de symlink)
echo [LOG] Iniciando WEB em modo ESTAVEL (Dev)...
cd apps/web
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_PRIVATE_LOCAL_SKIP_SYMLINK=1
start "WEB - PGB" /min pnpm dev -p 3200
cd ../..

echo.
echo ========================================
echo  ✅ SISTEMA RODANDO NO SERVIDOR!
echo ========================================
echo.
echo IP DO SERVIDOR: 192.168.0.9
echo API: http://localhost:4001
echo WEB: http://localhost:3200
echo.
echo ACESSO EXTERNO: http://globalh.ddns.net:3200
echo.
echo Mantenha este terminal aberto ou rode em segundo plano.
echo.
pause
