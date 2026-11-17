<?php
declare(strict_types=1);
// Adattatore locale: API originali e build React, senza esporre file privati.
if (!getenv('APP_ENV_FILE')) putenv('APP_ENV_FILE=' . __DIR__ . '/demo/.env.demo');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if ($path === '/api' || str_starts_with($path, '/api/')) { require __DIR__ . '/api/index.php'; return true; }
if (str_starts_with($path, '/s/')) { header('Location: /#/settimana/' . rawurlencode(basename($path))); return true; }
$public = realpath(__DIR__ . '/dist');
$file = $public ? realpath($public . ($path === '/' || str_starts_with($path, '/s/') ? '/index.html' : $path)) : false;
if (!$file || !$public || !str_starts_with($file, $public . '/') || !is_file($file)) { http_response_code(404); echo 'Pagina non trovata'; return true; }
$types = ['html'=>'text/html; charset=utf-8','js'=>'application/javascript','css'=>'text/css','svg'=>'image/svg+xml','woff2'=>'font/woff2','png'=>'image/png','json'=>'application/json'];
header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
if (str_ends_with($file, 'index.html') || str_ends_with($file, 'app-config.js')) { header('Cache-Control: no-store'); }
readfile($file);
return true;
