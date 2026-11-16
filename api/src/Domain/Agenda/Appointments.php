<?php
declare(strict_types=1);

namespace App\Domain\Agenda;

use App\Core\Clock;
use App\Store\Store;

/** Letture sugli appuntamenti: per intervallo, per episodio, per paziente; numerazione delle sedute. */
final class Appointments
{
    public const LIVE = ['programmato', 'confermato', 'eseguito'];

    public function __construct(private readonly Store $store)
    {
    }

    /** @return list<array<string,mixed>> ordinati per inizio; intervallo [from, to) di date YYYY-MM-DD */
    public function between(string $from, string $toExclusive, bool $withCancelled = false): array
    {
        $parts = $this->store->partsBetween('appointments', $from, Clock::addDays($toExclusive, -1));
        $rows = $this->store->all('appointments', static function ($a) use ($from, $toExclusive, $withCancelled) {
            $d = substr($a['start'], 0, 10);
            return $d >= $from && $d < $toExclusive && ($withCancelled || $a['stato'] !== 'annullato');
        }, $parts);
        usort($rows, static fn ($x, $y) => strcmp($x['start'], $y['start']) ?: strcmp($x['id'], $y['id']));
        return $rows;
    }

    /** Tutti gli appuntamenti di un paziente (individuali e come partecipante di gruppo). */
    public function forPatient(string $patientId, bool $withCancelled = true): array
    {
        $rows = $this->store->all('appointments', static function ($a) use ($patientId, $withCancelled) {
            if (!$withCancelled && $a['stato'] === 'annullato') {
                return false;
            }
            if (($a['patient_id'] ?? null) === $patientId) {
                return true;
            }
            foreach ($a['participants'] ?? [] as $p) {
                if ($p['patient_id'] === $patientId) {
                    return true;
                }
            }
            return false;
        });
        usort($rows, static fn ($x, $y) => strcmp($x['start'], $y['start']));
        return $rows;
    }

    /** @param list<string> $episodeIds @return list<array<string,mixed>> */
    public function forEpisodes(array $episodeIds): array
    {
        $set = array_flip($episodeIds);
        $rows = $this->store->all('appointments', static function ($a) use ($set) {
            if (isset($set[$a['episode_id'] ?? ''])) {
                return true;
            }
            foreach ($a['participants'] ?? [] as $p) {
                if (isset($set[$p['episode_id'] ?? ''])) {
                    return true;
                }
            }
            return false;
        });
        usort($rows, static fn ($x, $y) => strcmp($x['start'], $y['start']) ?: strcmp($x['id'], $y['id']));
        return $rows;
    }

    /**
     * Riferimenti (paziente, episodio, riga) di un appuntamento: uno per l'individuale, uno per partecipante nei gruppi.
     * @return list<array{patient_id:string,episode_id:?string,line_id:?string,stato:string,prima_manuale:bool,ultima_manuale:bool,participant:bool}>
     */
    public static function refs(array $a): array
    {
        if (($a['tipo'] ?? '') === 'gruppo') {
            return array_map(static fn ($p) => [
                'patient_id' => $p['patient_id'], 'episode_id' => $p['episode_id'] ?? null, 'line_id' => $p['line_id'] ?? null,
                'stato' => $p['stato'] ?? $a['stato'], 'prima_manuale' => (bool) ($p['prima_manuale'] ?? false), 'ultima_manuale' => (bool) ($p['ultima_manuale'] ?? false), 'participant' => true,
            ], $a['participants'] ?? []);
        }
        if (empty($a['patient_id'])) {
            return [];
        }
        return [[
            'patient_id' => $a['patient_id'], 'episode_id' => $a['episode_id'] ?? null, 'line_id' => $a['line_id'] ?? null,
            'stato' => $a['stato'], 'prima_manuale' => (bool) ($a['prima_manuale'] ?? false), 'ultima_manuale' => (bool) ($a['ultima_manuale'] ?? false), 'participant' => false,
        ]];
    }

    /**
     * Numero progressivo di ogni seduta nel ciclo (episodio + riga). Le sedute annullate o assenti non contano:
     * una seduta persa si recupera e il contatore resta coerente dopo spostamenti e cancellazioni.
     * @param list<array<string,mixed>> $all tutti gli appuntamenti degli episodi coinvolti
     * @return array<string,int> chiave "appId|patientId" => numero
     */
    public static function numbering(array $all): array
    {
        $byLine = [];
        foreach ($all as $a) {
            if ($a['stato'] === 'annullato' || ($a['tipo'] ?? '') === 'nota') {
                continue;
            }
            foreach (self::refs($a) as $r) {
                if ($r['episode_id'] === null || $r['line_id'] === null || !in_array($r['stato'], self::LIVE, true)) {
                    continue;
                }
                $byLine[$r['episode_id'] . '|' . $r['line_id']][] = [$a['start'], $a['id'], $r['patient_id']];
            }
        }
        $out = [];
        foreach ($byLine as $items) {
            usort($items, static fn ($x, $y) => strcmp($x[0], $y[0]) ?: strcmp($x[1], $y[1]));
            foreach ($items as $i => [$start, $id, $pid]) {
                $out["$id|$pid"] = $i + 1;
            }
        }
        return $out;
    }
}
