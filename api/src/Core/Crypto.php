<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;

/** Cifratura dei campi clinici con libsodium secretbox. La chiave sta solo nel .env privato. */
final class Crypto
{
    private const PREFIX = 'enc1:';
    private static ?string $key = null;

    public static function useKey(?string $base64): void
    {
        self::$key = $base64 === null ? null : self::decodeKey($base64);
    }

    private static function decodeKey(string $base64): string
    {
        $raw = base64_decode($base64, true);
        if ($raw === false || strlen($raw) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) {
            throw new RuntimeException('DATA_ENCRYPTION_KEY non valida: servono 32 byte in base64');
        }
        return $raw;
    }

    private static function key(): string
    {
        if (self::$key === null) {
            self::$key = self::decodeKey(Env::get('DATA_ENCRYPTION_KEY'));
        }
        return self::$key;
    }

    public static function seal(mixed $value): string
    {
        $plain = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return self::PREFIX . base64_encode($nonce . sodium_crypto_secretbox($plain, $nonce, self::key()));
    }

    public static function isSealed(mixed $value): bool
    {
        return is_string($value) && str_starts_with($value, self::PREFIX);
    }

    public static function open(string $sealed): mixed
    {
        if (!self::isSealed($sealed)) {
            return $sealed;
        }
        $raw = base64_decode(substr($sealed, strlen(self::PREFIX)), true);
        $nonceLen = SODIUM_CRYPTO_SECRETBOX_NONCEBYTES;
        if ($raw === false || strlen($raw) <= $nonceLen) {
            throw new RuntimeException('Campo cifrato danneggiato');
        }
        $plain = sodium_crypto_secretbox_open(substr($raw, $nonceLen), substr($raw, 0, $nonceLen), self::key());
        if ($plain === false) {
            throw new RuntimeException('Impossibile decifrare il campo: chiave errata o dato alterato');
        }
        return json_decode($plain, true, 512, JSON_THROW_ON_ERROR);
    }

    /** Cifra un file intero (backup, allegati sensibili). */
    public static function sealBytes(string $bytes): string
    {
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return $nonce . sodium_crypto_secretbox($bytes, $nonce, self::key());
    }

    public static function openBytes(string $blob): string
    {
        $nonceLen = SODIUM_CRYPTO_SECRETBOX_NONCEBYTES;
        if (strlen($blob) <= $nonceLen) {
            throw new RuntimeException('File cifrato danneggiato');
        }
        $plain = sodium_crypto_secretbox_open(substr($blob, $nonceLen), substr($blob, 0, $nonceLen), self::key());
        if ($plain === false) {
            throw new RuntimeException('Impossibile decifrare il file: chiave errata o file alterato');
        }
        return $plain;
    }

    public static function token(int $bytes = 32): string
    {
        return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
