@echo off
setlocal enabledelayedexpansion
REM Script para iniciar a aplicação em modo desenvolvimento

title Portal Global Bravo - Desenvolvimento
cls

echo ========================================
echo     INICIANDO - Portal Global Bravo
echo ========================================
echo.

cd /d "%~dp0"

REM Define variaveis de memoria
set NODE_OPTIONS=--max-old-space-size=8192

REM Mata processos Node existentes
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Iniciando aplicacao em MODO DESENVOLVIMENTO...
echo.
echo [LOG] Aumentando limite de memoria para 8GB
echo [LOG] API rodando em: http://localhost:4001
echo [LOG] Web rodando em: http://localhost:3200
echo [LOG] Documentacao Swagger: http://localhost:4001/docs
echo.

pnpm dev

pause
