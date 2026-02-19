@echo off
REM ============================================
REM  Portal Global Bravo - Script de Deploy
REM  Uso: deploy.bat
REM ============================================

echo.
echo ========================================
echo   Portal Global Bravo - Deploy
echo ========================================
echo.

REM 1. Verificar Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instale o Node.js v20.
    exit /b 1
)
echo [OK] Node.js encontrado

REM 2. Verificar pnpm
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando pnpm...
    npm i -g pnpm@9.11.0
)
echo [OK] pnpm encontrado

REM 3. Verificar PM2
pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Instalando PM2...
    npm i -g pm2
)
echo [OK] PM2 encontrado

REM 4. Verificar .env da API
if not exist "apps\api\.env" (
    echo [ERRO] Arquivo apps\api\.env nao encontrado!
    echo        Copie apps\api\.env.example para apps\api\.env e preencha.
    exit /b 1
)
echo [OK] .env da API encontrado

REM 5. Verificar .env.local do Web
if not exist "apps\web\.env.local" (
    echo [ERRO] Arquivo apps\web\.env.local nao encontrado!
    echo        Copie apps\web\.env.local.example para apps\web\.env.local e preencha.
    exit /b 1
)
echo [OK] .env.local do Web encontrado

REM 6. Instalar dependencias
echo.
echo [INFO] Instalando dependencias...
call pnpm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias.
    exit /b 1
)
echo [OK] Dependencias instaladas

REM 7. Build
echo.
echo [INFO] Fazendo build...
call pnpm build
if %errorlevel% neq 0 (
    echo [ERRO] Falha no build.
    exit /b 1
)
echo [OK] Build concluido

REM 8. Criar diretorios de logs
if not exist "apps\api\logs" mkdir "apps\api\logs"
if not exist "apps\web\logs" mkdir "apps\web\logs"

REM 9. Parar processos anteriores (se existirem)
pm2 delete pgb-api >nul 2>&1
pm2 delete pgb-web >nul 2>&1

REM 10. Iniciar com PM2
echo.
echo [INFO] Iniciando servicos com PM2...
call pm2 start ecosystem.config.js
echo.

REM 11. Salvar configuracao PM2
call pm2 save

echo.
echo ========================================
echo   Deploy concluido com sucesso!
echo ========================================
echo.
echo   API: http://localhost:4001
echo   Web: http://localhost:3200
echo.
echo   Comandos uteis:
echo     pm2 status    - ver status
echo     pm2 logs      - ver logs em tempo real
echo     pm2 restart all - reiniciar tudo
echo     pm2 stop all  - parar tudo
echo.
