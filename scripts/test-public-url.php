<?php
declare(strict_types=1);
/** Configurazione pubblica: sottocartelle, cookie, confini e URL incoerenti. */
require dirname(__DIR__) . '/api/vendor/autoload.php';
use App\Core\{Env, PublicUrl};
use App\Http\{Request, Session};
$checks = 0;
function check(bool $value, string $name): void { global $checks; if (!$value) throw new RuntimeException($name); $checks++; echo "PASS $name\n"; }
function config(string $origin, string $base, string $url = ''): void {
    foreach (['APP_ORIGIN' => $origin, 'APP_BASE_PATH' => $base, 'APP_URL' => $url] as $key => $value) { putenv($key); Env::set($key, $value); }
}
foreach ([['https://one.example', ''], ['https://one.example', '/app'], ['https://one.example', '/altra'], ['https://two.example', '/app']] as [$origin, $base]) {
    config($origin, $base);
    check(PublicUrl::root() === $origin . $base, 'URL ' . $origin . $base);
    check(PublicUrl::localPath($base . '/api/auth/login') === '/api/auth/login', 'API nel percorso ' . $base);
    $session = Session::open(dirname(__DIR__) . '/.runtime/qa/url-sessions', null, 60);
    check($session->cookieOptions(true, 0)['path'] === $base . '/', 'cookie limitato ' . $base);
    $_SERVER['REQUEST_URI'] = $base . '/api/auth/login';
    check(Request::capture($base . '/api')->path === '/auth/login', 'capture con prefisso esatto ' . $base);
}
config('https://one.example', '/app');
check(PublicUrl::localPath('/app-altro/api') === null, 'cartelle sorelle rifiutate');
$_SERVER['REQUEST_URI'] = '/altro/app/api/auth/login';
check(Request::capture('/app/api')->path === '/altro/app/api/auth/login', 'prefissi solo a inizio URI');
config('', '', 'http://localhost:8081');
check(PublicUrl::root() === 'http://localhost:8081' && PublicUrl::cookiePath() === '/', 'compatibilità demo locale');
config('', '', 'https://one.example/legacy');
check(PublicUrl::basePath() === '/legacy', 'compatibilità APP_URL con sottocartella');
foreach ([['https://one.example/app', '', ''], ['https://one.example', '/app/../altro', ''], ['https://one.example', '/app', 'https://one.example/altro']] as $args) {
    config(...$args); $rejected = false;
    try { PublicUrl::root(); } catch (RuntimeException) { $rejected = true; }
    check($rejected, 'configurazione incoerente rifiutata');
}
echo "COMPLETATI $checks controlli URL\n";
