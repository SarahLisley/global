@echo off
echo Starting Portal Global Bravo - Optimized Version
echo ========================================

REM Set Node.js memory limit for optimal performance
set NODE_OPTIONS=--max-old-space-size=8192

REM Enable performance monitoring
set NODE_ENV=development
set ENABLE_PERFORMANCE_LOGGING=1

REM Database pool optimizations
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
echo Configuration:
echo - Memory Limit: 8GB
echo - Pool Min: 2, Max: 10
echo - Slow Query Threshold: 500ms
echo - Performance Logging: Enabled
echo.

cd /d "%~dp0"

REM Start optimized server
echo Starting optimized API server...
cd apps/api
node src/server-optimized.ts

pause
