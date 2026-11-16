<?php
declare(strict_types=1);

namespace App;

use App\Core\Env;
use App\Services\Services;

/** Punto unico di avvio, usato da index.php e dagli script da riga di comando. */
final class Bootstrap
{
    public static function services(): Services
    {
        Env::load();
        date_default_timezone_set('Europe/Rome');
        $dir = Env::get('DATA_DIR');
        if ($dir === '') {
            throw new \RuntimeException('DATA_DIR non impostata nel file .env');
        }
        if (str_starts_with($dir, '/') === false) {
            $dir = dirname(__DIR__) . '/' . $dir;
        }
        return new Services($dir);
    }

    public static function logger(): \Closure
    {
        return static function (\Throwable $e): void {
            // Nel log solo tipo, messaggio e posizione: mai il contenuto delle richieste.
            error_log('[gestionale] ' . $e::class . ': ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine());
        };
    }
}
