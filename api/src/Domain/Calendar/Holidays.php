<?php
declare(strict_types=1);

namespace App\Domain\Calendar;

/** Festività nazionali italiane (con Pasqua e Lunedì dell'Angelo calcolati). */
final class Holidays
{
    /** @return array<string,string> data => nome */
    public static function forYear(int $y): array
    {
        $easter = (new \DateTimeImmutable("$y-03-21"))->modify('+' . easter_days($y) . ' days');
        $fixed = [
            '01-01' => 'Capodanno', '01-06' => 'Epifania', '04-25' => 'Festa della Liberazione', '05-01' => 'Festa del Lavoro',
            '06-02' => 'Festa della Repubblica', '08-15' => 'Ferragosto', '11-01' => 'Ognissanti', '12-08' => 'Immacolata Concezione',
            '12-25' => 'Natale', '12-26' => 'Santo Stefano',
        ];
        $out = [];
        foreach ($fixed as $md => $name) {
            $out["$y-$md"] = $name;
        }
        $out[$easter->format('Y-m-d')] = 'Pasqua';
        $out[$easter->modify('+1 day')->format('Y-m-d')] = 'Lunedì dell’Angelo';
        ksort($out);
        return $out;
    }

    public static function name(string $date): ?string
    {
        return self::forYear((int) substr($date, 0, 4))[$date] ?? null;
    }
}
