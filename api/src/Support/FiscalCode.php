<?php
declare(strict_types=1);

namespace App\Support;

/** Codice fiscale italiano: formato, carattere di controllo, data e sesso. Il luogo resta da confermare. */
final class FiscalCode
{
    private const ODD = [
        '0' => 1, '1' => 0, '2' => 5, '3' => 7, '4' => 9, '5' => 13, '6' => 15, '7' => 17, '8' => 19, '9' => 21,
        'A' => 1, 'B' => 0, 'C' => 5, 'D' => 7, 'E' => 9, 'F' => 13, 'G' => 15, 'H' => 17, 'I' => 19, 'J' => 21,
        'K' => 2, 'L' => 4, 'M' => 18, 'N' => 20, 'O' => 11, 'P' => 3, 'Q' => 6, 'R' => 8, 'S' => 12, 'T' => 14,
        'U' => 16, 'V' => 10, 'W' => 22, 'X' => 25, 'Y' => 24, 'Z' => 23,
    ];
    private const MONTHS = 'ABCDEHLMPRST';
    private const OMOCODIA = 'LMNPQRSTUV';

    public static function normalize(string $cf): string
    {
        return strtoupper(preg_replace('/\s+/', '', $cf) ?? '');
    }

    public static function checkChar(string $first15): string
    {
        $sum = 0;
        for ($i = 0; $i < 15; $i++) {
            $c = $first15[$i];
            if ($i % 2 === 0) {
                $sum += self::ODD[$c];
            } else {
                $sum += ctype_digit($c) ? (int) $c : ord($c) - 65;
            }
        }
        return chr(65 + $sum % 26);
    }

    public static function isValid(string $cf): bool
    {
        $cf = self::normalize($cf);
        if (!preg_match('/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/', $cf)) {
            return false;
        }
        return self::checkChar(substr($cf, 0, 15)) === $cf[15];
    }

    /** @return array{data:string,sesso:string}|null data di nascita (YYYY-MM-DD) e sesso (M|F) proposti dal codice */
    public static function parse(string $cf, ?string $today = null): ?array
    {
        $cf = self::normalize($cf);
        if (!self::isValid($cf)) {
            return null;
        }
        $digit = static function (string $c): int {
            $p = strpos(self::OMOCODIA, $c);
            return $p === false ? (int) $c : $p;
        };
        $yy = $digit($cf[6]) * 10 + $digit($cf[7]);
        $month = strpos(self::MONTHS, $cf[8]) + 1;
        $day = $digit($cf[9]) * 10 + $digit($cf[10]);
        $sex = $day > 40 ? 'F' : 'M';
        $day = $day > 40 ? $day - 40 : $day;
        $currentYy = (int) substr($today ?? date('Y-m-d'), 2, 2);
        $century = $yy > $currentYy ? 1900 : 2000;
        $year = $century + $yy;
        if (!checkdate($month, $day, $year)) {
            return null;
        }
        return ['data' => sprintf('%04d-%02d-%02d', $year, $month, $day), 'sesso' => $sex];
    }
}
