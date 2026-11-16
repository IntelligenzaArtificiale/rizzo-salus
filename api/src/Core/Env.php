<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Lettura della configurazione privata (.env) fuori dalla document root.
 * Cerca il file in APP_ENV_FILE, poi in ../.env.private e infine in ../../gestionale-private/.env.
 */
final class Env
{
    /** @var array<string,string> */
    private static array $values = [];
    private static bool $loaded = false;

    public static function load(?string $file = null): void
    {
        self::$values = [];
        $candidates = array_filter([
            $file,
            getenv('APP_ENV_FILE') ?: null,
            dirname(__DIR__, 2) . '/.env.private',
            dirname(__DIR__, 3) . '/gestionale-private/.env',
            dirname(__DIR__, 4) . '/gestionale-private/.env',
        ]);
        foreach ($candidates as $path) {
            if (is_file($path) && is_readable($path)) {
                self::parse((string) file_get_contents($path));
                break;
            }
        }
        self::$loaded = true;
    }

    private static function parse(string $text): void
    {
        foreach (preg_split('/\R/', $text) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $value = trim($value);
            if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[-1] === $value[0]) {
                $value = substr($value, 1, -1);
            }
            self::$values[trim($key)] = $value;
        }
    }

    public static function get(string $key, string $default = ''): string
    {
        if (!self::$loaded) {
            self::load();
        }
        $env = getenv($key);
        if ($env !== false && $env !== '') {
            return $env;
        }
        $value = self::$values[$key] ?? '';
        return $value === '' ? $default : $value;
    }

    public static function set(string $key, string $value): void
    {
        if (!self::$loaded) {
            self::load();
        }
        self::$values[$key] = $value;
    }

    public static function isProduction(): bool
    {
        return self::get('APP_ENV', 'production') === 'production';
    }
}
