@echo off
setlocal
cd /d "%~dp0"
if not defined PORT set PORT=8081
set APP_URL=http://localhost:%PORT%
set DATA_DIR=../demo/dati
set BACKUP_DIR=%CD%/demo/backup
set APP_ENV_FILE=%CD%/demo/.env.demo
set MESSAGING_MODE=test
if not exist .runtime mkdir .runtime
php demo/verifica-runtime.php
if errorlevel 1 exit /b 1
if not exist api/vendor/autoload.php (
    call composer install --working-dir=api --no-interaction --prefer-dist
    if errorlevel 1 exit /b 1
)
if not exist node_modules (
    call npm ci
    if errorlevel 1 exit /b 1
)
call npm run build
if errorlevel 1 exit /b 1
php demo/prepara.php
if errorlevel 1 exit /b 1
echo Apri http://localhost:%PORT%/#/accedi - Ctrl+C per fermare
php -S 127.0.0.1:%PORT% router.php
