@echo off
echo Applying Performance Optimizations
echo ==================================

echo.
echo Setting environment variables for performance...
set NODE_OPTIONS=--max-old-space-size=8192
set DB_POOL_MIN=2
set DB_POOL_MAX=10
set DB_POOL_INCREMENT=2
set DB_POOL_TIMEOUT_SEC=60
set DB_POOL_QUEUE_TIMEOUT_MS=3000
set DB_STMT_CACHE_SIZE=50
set DB_FETCH_ARRAY_SIZE=200
set DB_PREFETCH_ROWS=200
set DB_SLOW_QUERY_MS=500

echo.
echo ✅ Performance optimizations applied:
echo - Memory: 8GB heap
echo - Pool: Min=2, Max=10 connections  
echo - Query optimization: 200 rows fetch
echo - Slow query detection: 500ms threshold
echo - Connection timeout: 3s queue, 60s pool

echo.
echo 🚀 System is now optimized!
echo 📊 Monitor console for slow query warnings
echo.
echo The system will restart automatically with optimizations.
echo.

REM Restart the system with optimizations
echo Restarting with optimizations...
call stop.bat
timeout /t 2 /nobreak >nul
call start-dev.bat

pause
