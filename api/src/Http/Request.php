<?php
declare(strict_types=1);

namespace App\Http;

/** Richiesta HTTP già normalizzata: i test la costruiscono a mano, in produzione arriva da capture(). */
final class Request
{
    /** @param array<string,mixed> $body @param array<string,string> $headers @param array<string,string> $cookies */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $body = [],
        public readonly array $headers = [],
        public readonly array $cookies = [],
        public readonly string $ip = '0.0.0.0',
        public readonly array $files = [],
        public readonly string $rawBody = '',
        public readonly array $query = [],
    ) {
    }

    public static function capture(string $basePath = '/api'): self
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $matches = $uri === $basePath || str_starts_with($uri, $basePath . '/');
        $path = $matches ? substr($uri, strlen($basePath)) : $uri;
        $path = '/' . trim($path, '/');
        $path = preg_replace('#^/index\.php#', '', $path) ?: '/';

        $headers = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $headers[str_replace('_', '-', strtolower(substr($k, 5)))] = (string) $v;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }
        $raw = (string) file_get_contents('php://input');
        $body = [];
        if ($raw !== '' && str_contains($headers['content-type'] ?? '', 'json')) {
            $decoded = json_decode($raw, true);
            $body = is_array($decoded) ? $decoded : [];
        } elseif ($_POST) {
            $body = $_POST;
        }
        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            $path,
            $body,
            $headers,
            $_COOKIE,
            self::clientIp(),
            $_FILES,
            $raw,
            $_GET,
        );
    }

    private static function clientIp(): string
    {
        // Dietro proxy fidato si può abilitare TRUSTED_PROXY nel .env; di default si usa solo REMOTE_ADDR.
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function userAgent(): string
    {
        return substr($this->header('user-agent') ?? '', 0, 200);
    }
}
