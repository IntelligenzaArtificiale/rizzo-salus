#!/bin/sh
# Avvio locale da clone: dipendenze, dati sintetici e build corrente; nessun reset.
set -eu
cd "$(dirname "$0")"
PORT="${PORT:-8081}"
export PORT
export APP_URL="http://localhost:$PORT"
export DATA_DIR="$PWD/demo/dati"
export BACKUP_DIR="$PWD/demo/backup"
export APP_ENV_FILE="$PWD/demo/.env.demo"
export MESSAGING_MODE=test
mkdir -p .runtime
if [ -z "${PHP_BIN:-}" ] && [ "$(uname -s)" = Linux ] && [ -x .runtime/php/usr/bin/php8.3 ]; then
    export LD_LIBRARY_PATH="$PWD/.runtime/php/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
    PHP_BIN="$PWD/.runtime/php/usr/bin/php8.3"
    set -- -d "extension=$PWD/.runtime/php/usr/lib/php/20230831/mbstring.so" -d "extension=$PWD/.runtime/php/usr/lib/php/20230831/dom.so" -d "extension=$PWD/.runtime/php/usr/lib/php/20230831/zip.so" -d "extension=$PWD/.runtime/php/usr/lib/php/20230831/gd.so"
else
    PHP_BIN="${PHP_BIN:-php}"
    set --
fi
if ! command -v "$PHP_BIN" >/dev/null 2>&1; then
    echo 'PHP non trovato. Installa PHP 8.2+ con le estensioni indicate nel README.' >&2
    exit 1
fi
"$PHP_BIN" "$@" demo/verifica-runtime.php
if ! command -v npm >/dev/null 2>&1; then
    echo 'npm non trovato. Installa Node.js 22.12+ e riapri il terminale.' >&2
    exit 1
fi
if [ ! -f api/vendor/autoload.php ]; then
    if ! command -v composer >/dev/null 2>&1; then
        echo 'Installa Composer 2, esegui composer install --working-dir=api e ripeti ./avvia.sh.' >&2
        exit 1
    fi
    composer install --working-dir=api --no-interaction --prefer-dist
fi
if [ ! -d node_modules ]; then npm ci; fi
npm run build
"$PHP_BIN" "$@" demo/prepara.php
if [ -d /proc ] && [ "${LOCAL_WORKER:-1}" = 1 ]; then
    "$PHP_BIN" "$@" api/bin/local-worker.php "$$" >> .runtime/attivita-locali.log 2>&1 &
fi
printf 'Apri http://localhost:%s/#/accedi (Ctrl+C per fermare)\n' "$PORT"
exec "$PHP_BIN" "$@" -S "127.0.0.1:$PORT" router.php
