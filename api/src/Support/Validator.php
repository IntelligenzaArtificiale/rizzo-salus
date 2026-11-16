<?php
declare(strict_types=1);

namespace App\Support;

use App\Core\ApiError;

/** Validazione degli input del corpo della richiesta. Gli errori sono codici, mai testi. */
final class Validator
{
    public static function str(array $in, string $key, bool $required = false, int $max = 255): ?string
    {
        $v = $in[$key] ?? null;
        if ($v === null || $v === '') {
            if ($required) {
                throw new ApiError("{$key}_mancante", 422, ['campo' => $key]);
            }
            return null;
        }
        if (!is_string($v) && !is_numeric($v)) {
            throw new ApiError("{$key}_non_valido", 422, ['campo' => $key]);
        }
        $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', (string) $v) ?? '');
        if ($v === '' && $required) {
            throw new ApiError("{$key}_mancante", 422, ['campo' => $key]);
        }
        if (mb_strlen($v) > $max) {
            throw new ApiError("{$key}_troppo_lungo", 422, ['campo' => $key]);
        }
        return $v === '' ? null : $v;
    }

    public static function int(array $in, string $key, bool $required = false, ?int $min = null, ?int $max = null): ?int
    {
        $v = $in[$key] ?? null;
        if ($v === null || $v === '') {
            if ($required) {
                throw new ApiError("{$key}_mancante", 422, ['campo' => $key]);
            }
            return null;
        }
        if (!is_numeric($v) || (string) (int) $v !== (string) (int) (float) $v) {
            throw new ApiError("{$key}_non_valido", 422, ['campo' => $key]);
        }
        $n = (int) $v;
        if (($min !== null && $n < $min) || ($max !== null && $n > $max)) {
            throw new ApiError("{$key}_fuori_intervallo", 422, ['campo' => $key]);
        }
        return $n;
    }

    public static function num(array $in, string $key, bool $required = false, ?float $min = null, ?float $max = null): ?float
    {
        $v = $in[$key] ?? null;
        if ($v === null || $v === '') {
            if ($required) {
                throw new ApiError("{$key}_mancante", 422, ['campo' => $key]);
            }
            return null;
        }
        if (!is_numeric($v)) {
            throw new ApiError("{$key}_non_valido", 422, ['campo' => $key]);
        }
        $n = (float) $v;
        if (($min !== null && $n < $min) || ($max !== null && $n > $max)) {
            throw new ApiError("{$key}_fuori_intervallo", 422, ['campo' => $key]);
        }
        return $n;
    }

    public static function bool(array $in, string $key, bool $default = false): bool
    {
        $v = $in[$key] ?? null;
        if ($v === null) {
            return $default;
        }
        return filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $default;
    }

    /** @param list<string> $allowed */
    public static function enum(array $in, string $key, array $allowed, bool $required = false, ?string $default = null): ?string
    {
        $v = self::str($in, $key, $required, 60) ?? $default;
        if ($v !== null && !in_array($v, $allowed, true)) {
            throw new ApiError("{$key}_non_valido", 422, ['campo' => $key]);
        }
        return $v;
    }

    public static function email(array $in, string $key, bool $required = false): ?string
    {
        $v = self::str($in, $key, $required, 190);
        if ($v === null) {
            return null;
        }
        $v = mb_strtolower($v);
        if (!filter_var($v, FILTER_VALIDATE_EMAIL)) {
            throw new ApiError('email_non_valida', 422, ['campo' => $key]);
        }
        return $v;
    }

    public static function date(array $in, string $key, bool $required = false): ?string
    {
        $v = self::str($in, $key, $required, 10);
        if ($v === null) {
            return null;
        }
        $d = \DateTimeImmutable::createFromFormat('!Y-m-d', $v);
        if (!$d || $d->format('Y-m-d') !== $v) {
            throw new ApiError('data_non_valida', 422, ['campo' => $key]);
        }
        return $v;
    }

    public static function time(array $in, string $key, bool $required = false): ?string
    {
        $v = self::str($in, $key, $required, 5);
        if ($v === null) {
            return null;
        }
        if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $v)) {
            throw new ApiError('ora_non_valida', 422, ['campo' => $key]);
        }
        return $v;
    }

    /** Istante locale "YYYY-MM-DDTHH:MM" o con secondi, normalizzato ai secondi. */
    public static function stamp(array $in, string $key, bool $required = false): ?string
    {
        $v = self::str($in, $key, $required, 19);
        if ($v === null) {
            return null;
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $v)) {
            throw new ApiError('istante_non_valido', 422, ['campo' => $key]);
        }
        $v = strlen($v) === 16 ? $v . ':00' : $v;
        self::date(['d' => substr($v, 0, 10)], 'd');
        return $v;
    }

    /** Telefono in formato E.164. Accetta numeri italiani senza prefisso (cellulari 3xx, fissi 0x). */
    public static function phone(array $in, string $key, bool $required = false): ?string
    {
        $v = self::str($in, $key, $required, 30);
        if ($v === null) {
            return null;
        }
        $n = self::normalizePhone($v);
        if ($n === null) {
            throw new ApiError('telefono_non_valido', 422, ['campo' => $key]);
        }
        return $n;
    }

    public static function normalizePhone(string $raw): ?string
    {
        $s = preg_replace('/[\s().\-\/]/', '', $raw) ?? '';
        if (str_starts_with($s, '00')) {
            $s = '+' . substr($s, 2);
        }
        if ($s !== '' && $s[0] !== '+') {
            $s = '+39' . $s;
        }
        if (!preg_match('/^\+[1-9]\d{7,14}$/', $s)) {
            return null;
        }
        if (str_starts_with($s, '+39') && !preg_match('/^\+39(3\d{8,9}|0\d{6,10}|8\d{2}\d{6,7})$/', $s)) {
            return null;
        }
        return $s;
    }

    public static function arr(array $in, string $key, bool $required = false): array
    {
        $v = $in[$key] ?? null;
        if ($v === null) {
            if ($required) {
                throw new ApiError("{$key}_mancante", 422, ['campo' => $key]);
            }
            return [];
        }
        if (!is_array($v)) {
            throw new ApiError("{$key}_non_valido", 422, ['campo' => $key]);
        }
        return $v;
    }

    public static function id(array $in, string $key, string $prefix, bool $required = false): ?string
    {
        $v = self::str($in, $key, $required, 40);
        if ($v === null) {
            return null;
        }
        if (!preg_match('/^' . preg_quote($prefix, '/') . '_[a-f0-9]{16}$/', $v)) {
            throw new ApiError("{$key}_non_valido", 422, ['campo' => $key]);
        }
        return $v;
    }

    public static function fiscalCode(string $cf): bool
    {
        return FiscalCode::isValid($cf);
    }
}
