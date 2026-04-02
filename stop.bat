@echo off
setlocal enabledelayedexpansion
REM Script para parar a aplicacao

title Parando Portal Global Bravo
cls

echo ========================================
echo     PARANDO - Portal Global Bravo
echo ========================================
echo.

echo Finalizando todos os processos Node.js...
taskkill /F /IM node.exe

echo.
echo Aplicacao parada com sucesso!
echo.

pause
