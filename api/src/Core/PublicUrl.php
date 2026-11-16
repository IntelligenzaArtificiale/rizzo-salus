<?php
declare(strict_types=1);
namespace App\Core;

/** URL pubblici e cookie: una sola configurazione per root e sottocartelle. */
final class PublicUrl
{
    /** @return array{origin:string,base:string,url:string} */
    private static function config(): array
    {
        $legacy = rtrim(Env::get('APP_URL'), '/');
        $origin = rtrim(Env::get('APP_ORIGIN'), '/');
        $parts = parse_url($origin !== '' ? $origin : $legacy);
        if (!$parts || !in_array($parts['scheme'] ?? '', ['http', 'https'], true) || empty($parts['host'])
            || isset($parts['query']) || isset($parts['fragment'])
            || isset($parts['user']) || isset($parts['pass'])) {
            throw new \RuntimeException('Origine pubblica non valida');
        }
        if ($origin !== '' && !in_array($parts['path'] ?? '', ['', '/'], true)) {
            throw new \RuntimeException('APP_ORIGIN non deve contenere un percorso');
        }
        $base = $origin !== '' ? Env::get('APP_BASE_PATH') : ($parts['path'] ?? '');
        $base = rtrim($base, '/');
        if ($base !== '' && (!str_starts_with($base, '/') || !preg_match('#^/[A-Za-z0-9._~/-]+$#D', $base)
            || str_contains($base, '//') || array_intersect(explode('/', $base), ['.', '..']))) {
            throw new \RuntimeException('APP_BASE_PATH non valido');
        }
        $origin = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
        $url = $origin . $base;
        if (Env::get('APP_ORIGIN') !== '' && $legacy !== '' && $legacy !== $url) {
            throw new \RuntimeException('APP_URL non coerente con APP_ORIGIN e APP_BASE_PATH');
        }
        return ['origin' => $origin, 'base' => $base, 'url' => $url];
    }

    public static function root(): string { return self::config()['url']; }
    public static function origin(): string { return self::config()['origin']; }
    public static function basePath(): string { return self::config()['base']; }
    public static function cookiePath(): string { return self::basePath() . '/'; }
    public static function secure(): bool { return str_starts_with(self::root(), 'https://'); }

    public static function localPath(string $uri): ?string
    {
        $base = self::basePath();
        if ($uri === $base || $uri === $base . '/') return '/';
        if ($base !== '' && !str_starts_with($uri, $base . '/')) return null;
        return substr($uri, strlen($base));
    }
}
