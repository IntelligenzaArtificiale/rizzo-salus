<?php
declare(strict_types=1);
namespace App\Domain\Assistant;

use App\Core\Clock;
use App\Domain\Agenda\Appointments;

/** Contatori deterministici dai soli appuntamenti già filtrati per il ruolo. */
final class AgendaSummary
{
    public static function describe(array $rows, string $today): string
    {
        $week = Clock::weekStart($today);
        $ranges = [
            'OGGI' => [$today, $today],
            'DOMANI' => [Clock::addDays($today, 1), Clock::addDays($today, 1)],
            'SETTIMANA CORRENTE' => [$week, Clock::addDays($week, 6)],
        ];
        $out = "CONTATORI UFFICIALI AGENDA (prioritari rispetto al conteggio del testo):\n";
        foreach ($ranges as $label => [$from, $to]) {
            $totals = self::count($rows, $from, $to);
            $out .= $label . " dal $from al $to: " . json_encode($totals, JSON_UNESCAPED_UNICODE) . "\n";
        }
        return $out . "Gli appunti sono separati e non sono appuntamenti. Gli appuntamenti attivi comprendono quelli da eseguire e quelli eseguiti; annullati e assenti sono separati.\n\n";
    }

    public static function count(array $rows, string $from, string $to): array
    {
        $out = ['appuntamenti_attivi' => 0, 'da_eseguire' => 0, 'eseguiti' => 0, 'assenti' => 0, 'annullati' => 0, 'appunti' => 0];
        foreach ($rows as $a) {
            $day = substr($a['start'], 0, 10);
            if ($day < $from || $day > $to) continue;
            if ($a['tipo'] === 'nota') { $out['appunti']++; continue; }
            if ($a['stato'] === 'annullato') { $out['annullati']++; continue; }
            $refs = Appointments::refs($a);
            $absent = count(array_filter($refs, static fn ($r) => $r['stato'] === 'assente'));
            if ($a['stato'] === 'assente' || ($refs && $absent === count($refs))) { $out['assenti']++; continue; }
            $out['appuntamenti_attivi']++;
            $out[$a['stato'] === 'eseguito' ? 'eseguiti' : 'da_eseguire']++;
        }
        return $out;
    }
}
