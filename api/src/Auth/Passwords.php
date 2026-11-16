<?php
declare(strict_types=1);

namespace App\Auth;

final class Passwords
{
    public static function hash(string $plain): string
    {
        return password_hash($plain, PASSWORD_ARGON2ID, ['memory_cost' => 19456, 'time_cost' => 2, 'threads' => 1]);
    }

    public static function verify(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    public static function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_ARGON2ID, ['memory_cost' => 19456, 'time_cost' => 2, 'threads' => 1]);
    }

    /** Politica: almeno 10 caratteri, una lettera e un numero. Per dati sanitari è il minimo ragionevole. */
    public static function isAcceptable(string $plain): bool
    {
        return mb_strlen($plain) >= 10 && preg_match('/\p{L}/u', $plain) === 1 && preg_match('/\d/', $plain) === 1;
    }
}
