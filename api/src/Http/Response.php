<?php
declare(strict_types=1);

namespace App\Http;

final class Response
{
    /** @param array<string,string> $headers @param list<array{0:string,1:string,2:array}> $cookies */
    public function __construct(
        public int $status = 200,
        public string $body = '',
        public array $headers = [],
        public array $cookies = [],
    ) {
    }

    public static function json(array $payload, int $status = 200): self
    {
        return new self($status, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE), ['Content-Type' => 'application/json; charset=utf-8']);
    }

    public static function ok(mixed $data = []): self
    {
        return self::json(['ok' => true, 'data' => $data === [] ? new \stdClass() : $data]);
    }

    public static function error(string $code, int $status = 400, array $extra = []): self
    {
        return self::json(['ok' => false, 'error' => $code] + $extra, $status);
    }

    public static function file(string $bytes, string $mime, string $name, bool $inline = false): self
    {
        $safe = preg_replace('/[^A-Za-z0-9._-]+/', '_', $name) ?: 'file';
        return new self(200, $bytes, [
            'Content-Type' => $mime,
            'Content-Disposition' => ($inline ? 'inline' : 'attachment') . '; filename="' . $safe . '"',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function decoded(): array
    {
        return json_decode($this->body, true) ?? [];
    }

    public function emit(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $k => $v) {
            header("$k: $v");
        }
        foreach ($this->cookies as [$name, $value, $opts]) {
            setcookie($name, $value, $opts);
        }
        echo $this->body;
    }
}
