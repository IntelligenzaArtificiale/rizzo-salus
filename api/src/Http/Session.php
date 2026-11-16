<?php
declare(strict_types=1);

namespace App\Http;

use App\Core\Clock;
use App\Core\Crypto;

/**
 * Sessioni su file, con cookie opaco (solo l'hash del cookie è nel nome del file).
 * Implementazione propria: nessuno stato globale PHP, quindi testabile e senza fissazione di sessione.
 */
final class Session
{
    public const COOKIE = 'poli_sid';
    private bool $dirty = false;
    private bool $destroyed = false;

    /** @param array<string,mixed> $data */
    private function __construct(private string $sid, private array $data, private readonly string $dir, public bool $isNew)
    {
    }

    public static function open(string $dir, ?string $cookie, int $idleMinutes): self
    {
        @mkdir($dir, 0700, true);
        if ($cookie !== null && preg_match('/^[A-Za-z0-9_-]{40,60}$/', $cookie)) {
            $file = self::file($dir, $cookie);
            if (is_file($file)) {
                $data = json_decode((string) file_get_contents($file), true);
                if (is_array($data)) {
                    $last = (int) ($data['_seen'] ?? 0);
                    if ($idleMinutes > 0 && time() - $last > $idleMinutes * 60) {
                        @unlink($file);
                    } else {
                        $s = new self($cookie, $data, $dir, false);
                        if (time() - $last > 30) {
                            $s->data['_seen'] = time();
                            $s->dirty = true;
                        }
                        return $s;
                    }
                }
            }
        }
        return new self(Crypto::token(36), ['_seen' => time(), 'csrf' => Crypto::token(24)], $dir, true);
    }

    private static function file(string $dir, string $sid): string
    {
        return $dir . '/' . hash('sha256', $sid) . '.json';
    }

    public function id(): string
    {
        return $this->sid;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->data[$key] ?? $default;
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
        $this->dirty = true;
    }

    public function forget(string $key): void
    {
        unset($this->data[$key]);
        $this->dirty = true;
    }

    public function csrf(): string
    {
        return (string) $this->data['csrf'];
    }

    /** Nuovo id dopo il login: impedisce la fissazione di sessione. */
    public function regenerate(): void
    {
        @unlink(self::file($this->dir, $this->sid));
        $this->sid = Crypto::token(36);
        $this->data['csrf'] = Crypto::token(24);
        $this->isNew = true;
        $this->dirty = true;
    }

    public function destroy(): void
    {
        @unlink(self::file($this->dir, $this->sid));
        $this->destroyed = true;
    }

    public function save(): void
    {
        if ($this->destroyed || !$this->dirty) {
            return;
        }
        $this->data['_seen'] = time();
        $file = self::file($this->dir, $this->sid);
        $tmp = $file . '.' . bin2hex(random_bytes(3));
        file_put_contents($tmp, json_encode($this->data), LOCK_EX);
        chmod($tmp, 0600);
        rename($tmp, $file);
    }

    public function isDestroyed(): bool
    {
        return $this->destroyed;
    }

    /** Elimina i file delle sessioni scadute. */
    public static function sweep(string $dir, int $idleMinutes): int
    {
        $n = 0;
        foreach (glob($dir . '/*.json') ?: [] as $f) {
            if (time() - (int) filemtime($f) > max(1, $idleMinutes) * 60 * 2) {
                @unlink($f);
                $n++;
            }
        }
        return $n;
    }

    public function cookieOptions(bool $secure, int $lifetime): array
    {
        return ['expires' => $lifetime > 0 ? time() + $lifetime : 0, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax'];
    }
}
