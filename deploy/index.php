<?php
declare(strict_types=1);
/** Ingresso dell'hosting: asset pubblici separati da codice, archivio e segreti. */
ini_set('display_errors', '0');
ini_set('memory_limit', '512M');
ini_set('log_errors', '1');
$private = __DIR__ . '/private';
putenv('APP_ENV_FILE=' . $private . '/runtime/.env');
require $private . '/api/vendor/autoload.php';

use App\Core\Env;
use App\Core\PublicUrl;

try {
    Env::load();
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = PublicUrl::localPath($uri);
    if ($path === null) { http_response_code(404); exit('Pagina non trovata'); }
    if ($path === '/api' || str_starts_with($path, '/api/')) {
        require $private . '/api/index.php';
        exit;
    }
    if ($path === '/health') {
        $ready = PHP_VERSION_ID >= 80200;
        foreach (['calendar', 'sodium', 'mbstring', 'dom', 'gd', 'zip', 'curl', 'openssl'] as $ext) $ready = $ready && extension_loaded($ext);
        $ready = $ready && is_writable($private . '/runtime/data');
        http_response_code($ready ? 200 : 503);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['ok' => $ready]);
        exit;
    }
    if (preg_match('#^/s/([A-Za-z0-9_-]+)/?$#D', $path, $match)) {
        header('Location: ' . PublicUrl::basePath() . '/#/settimana/' . rawurlencode($match[1]));
        exit;
    }
    if ($path !== '/') { http_response_code(404); exit('Pagina non trovata'); }
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    readfile($private . '/frontend/index.html');
} catch (Throwable $e) {
    error_log('[deploy] ' . $e::class . ': ' . $e->getMessage());
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Servizio temporaneamente non disponibile';
}
