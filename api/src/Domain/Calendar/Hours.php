<?php
declare(strict_types=1);

namespace App\Domain\Calendar;

use App\Core\Clock;
use App\Services\Settings;

/**
 * Fasce lavorabili: orari della struttura, chiusure e festività, orari settimanali del professionista,
 * ferie e assenze. Le fasce sono coppie di minuti dalla mezzanotte (locali).
 */
final class Hours
{
    public function __construct(private readonly Settings $settings)
    {
    }

    public function closedReason(string $date): ?string
    {
        foreach ($this->settings->get('chiusure', []) as $c) {
            if ($date >= $c['da'] && $date <= ($c['a'] ?? $c['da'])) {
                return $c['motivo'] ?? 'Chiusura della struttura';
            }
        }
        if ($this->settings->get('festivita_nazionali', true)) {
            return Holidays::name($date);
        }
        return null;
    }

    /** @return list<array{0:int,1:int}> */
    public function structureWindows(string $date): array
    {
        if ($this->closedReason($date) !== null) {
            return [];
        }
        $dow = (string) Clock::dow($date);
        if ($dow === '7' && !$this->settings->get('agenda.mostra_domenica', false) && ($this->settings->get('orari.7', []) === [])) {
            return [];
        }
        return self::toMinutes($this->settings->get("orari.$dow", []));
    }

    /** @return list<array{0:int,1:int}> */
    public function professionalWindows(array $professional, string $date): array
    {
        foreach ($professional['eccezioni'] ?? [] as $e) {
            if (($e['tipo']??'')!=='straordinario'&&$date >= $e['da'] && $date <= ($e['a'] ?? $e['da'])) {
                return [];
            }
        }
        $weekly = $professional['orari'] ?? null;
        $own = $weekly === null ? null : self::toMinutes($weekly[(string) Clock::dow($date)] ?? []);
        $struct = $this->structureWindows($date);
        foreach($professional['eccezioni']??[] as $e)if(($e['tipo']??'')==='straordinario'&&$date>=$e['da']&&$date<=($e['a']??$e['da']))$own=array_merge($own??$struct,[[Clock::minutes($e['dalle']),Clock::minutes($e['alle'])]]);
        return $own === null ? $struct : self::intersect($struct, $own);
    }

    public function resourceWindows(array $resource,string $date):array
    {
        $own=$resource['orari']??null;$struct=$this->structureWindows($date);
        return $own===null?$struct:self::intersect($struct,self::toMinutes($own[(string)Clock::dow($date)]??[]));
    }

    public function absenceReason(array $professional, string $date): ?string
    {
        foreach ($professional['eccezioni'] ?? [] as $e) {
            if (($e['tipo']??'')!=='straordinario'&&$date >= $e['da'] && $date <= ($e['a'] ?? $e['da'])) {
                return $e['tipo'] ?? 'assenza';
            }
        }
        return null;
    }

    /** True se [start,end) sta interamente dentro una delle fasce. */
    public static function fits(array $windows, int $start, int $end): bool
    {
        foreach ($windows as [$a, $b]) {
            if ($start >= $a && $end <= $b) {
                return true;
            }
        }
        return false;
    }

    /** @return list<array{0:int,1:int}> */
    public static function toMinutes(array $slots): array
    {
        $out = [];
        foreach ($slots as $s) {
            $out[] = [Clock::minutes($s[0]), Clock::minutes($s[1])];
        }
        usort($out, static fn ($x, $y) => $x[0] <=> $y[0]);
        return $out;
    }

    /** @param list<array{0:int,1:int}> $a @param list<array{0:int,1:int}> $b @return list<array{0:int,1:int}> */
    public static function intersect(array $a, array $b): array
    {
        $out = [];
        foreach ($a as [$a1, $a2]) {
            foreach ($b as [$b1, $b2]) {
                $s = max($a1, $b1);
                $e = min($a2, $b2);
                if ($s < $e) {
                    $out[] = [$s, $e];
                }
            }
        }
        usort($out, static fn ($x, $y) => $x[0] <=> $y[0]);
        return $out;
    }

    public static function hhmm(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }
}
