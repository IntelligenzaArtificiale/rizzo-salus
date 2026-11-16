<?php
declare(strict_types=1);

// Router del server locale: /api/... va all'API, il resto sono le pagine statiche della demo.
putenv('APP_ENV_FILE=' . __DIR__ . '/.env.demo');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (str_starts_with($path, '/api/') || $path === '/api') {
    require dirname(__DIR__) . '/api/index.php';
    return true;
}
$public = __DIR__ . '/public';
$file = realpath($public . ($path === '/' ? '/index.html' : $path));
if ($file !== false && str_starts_with($file, $public . '/') && is_file($file)) {
    $types = ['html' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'text/javascript', 'svg' => 'image/svg+xml', 'json' => 'application/json'];
    header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
    readfile($file);
    return true;
}
if (str_starts_with($path, '/s/')) {   // pagina pubblica del promemoria
    header('Content-Type: text/html; charset=utf-8');
    readfile($public . '/settimana.html');
    return true;
}
http_response_code(404);
echo 'Pagina non trovata';
return true;
