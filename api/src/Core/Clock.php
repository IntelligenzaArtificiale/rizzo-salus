<?php
declare(strict_types=1);

namespace App\Core;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Unica sorgente di tempo. Tutto in Europe/Rome; nei test si può fissare l'ora.
 * Gli istanti sono salvati come stringhe "YYYY-MM-DDTHH:MM:SS" nell'ora locale di Roma
 * (l'offset non serve: il fuso è unico e il cambio dell'ora legale si risolve con DateTimeImmutable).
 */
final class Clock
{
    public const TZ = 'Europe/Rome';
    private static ?DateTimeImmutable $fixed = null;

    public static function tz(): DateTimeZone
    {
        return new DateTimeZone(self::TZ);
    }

    public static function fix(?string $local): void
    {
        self::$fixed = $local === null ? null : new DateTimeImmutable($local, self::tz());
    }

    public static function now(): DateTimeImmutable
    {
        return self::$fixed ?? new DateTimeImmutable('now', self::tz());
    }

    public static function stamp(?DateTimeImmutable $d = null): string
    {
        return ($d ?? self::now())->format('Y-m-d\TH:i:s');
    }

    public static function today(): string
    {
        return self::now()->format('Y-m-d');
    }

    public static function parse(string $s): DateTimeImmutable
    {
        return new DateTimeImmutable($s, self::tz());
    }

    /** Lunedì della settimana che contiene la data. */
    public static function weekStart(string $date): string
    {
        $d = self::parse($date . ' 00:00');
        $dow = (int) $d->format('N');
        return $d->modify('-' . ($dow - 1) . ' days')->format('Y-m-d');
    }

    public static function addDays(string $date, int $days): string
    {
        return self::parse($date . ' 00:00')->modify(($days >= 0 ? '+' : '') . $days . ' days')->format('Y-m-d');
    }

    /** Aggiunge minuti in tempo reale (gestisce il cambio dell'ora legale). */
    public static function addMinutes(string $stamp, int $minutes): string
    {
        $d = self::parse($stamp);
        return self::stamp($d->setTimestamp($d->getTimestamp() + $minutes * 60));
    }

    /** Minuti reali tra due istanti locali. */
    public static function diffMinutes(string $from, string $to): int
    {
        return intdiv(self::parse($to)->getTimestamp() - self::parse($from)->getTimestamp(), 60);
    }

    /** Giorno della settimana ISO: 1 lunedì … 7 domenica. */
    public static function dow(string $date): int
    {
        return (int) self::parse($date . ' 00:00')->format('N');
    }

    /** Minuti dalla mezzanotte locale per "HH:MM" o per un istante. */
    public static function minutes(string $hhmm): int
    {
        $t = str_contains($hhmm, 'T') ? substr($hhmm, 11, 5) : substr($hhmm, 0, 5);
        [$h, $m] = array_map('intval', explode(':', $t));
        return $h * 60 + $m;
    }

    public static function date(string $stamp): string
    {
        return substr($stamp, 0, 10);
    }

    public static function isoWeek(string $date): array
    {
        $d = self::parse($date . ' 00:00');
        return ['year' => (int) $d->format('o'), 'week' => (int) $d->format('W')];
    }
}
