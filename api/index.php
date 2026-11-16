<?php
declare(strict_types=1);

/** Ingresso dell'API: tutte le richieste a /api/... arrivano qui (vedi .htaccess). */
require __DIR__ . '/vendor/autoload.php';

use App\Bootstrap;
use App\Http\App;
use App\Http\Request;
use App\Http\Routes;

ini_set('display_errors', '0');
ini_set('log_errors', '1');

try {
    $svc = Bootstrap::services();
    (new App($svc, Routes::build(), Bootstrap::logger()))->handle(Request::capture('/api'))->emit();
} catch (Throwable $e) {
    Bootstrap::logger()($e);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'errore_interno']);
}
