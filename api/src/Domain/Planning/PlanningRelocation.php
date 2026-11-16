<?php
declare(strict_types=1);
namespace App\Domain\Planning;
use App\Core\{ApiError,Clock};
use App\Domain\Calendar\Hours;
use App\Domain\Agenda\Appointments;
/** Parte del motore di proposta: responsabilità separata, nessuna scrittura autonoma. */
trait PlanningRelocation
{
    private function relocate(string $id, array $target, int $depth, array $reserved, string $from, string $to): bool
    {
        if (str_starts_with($id, 'nuovo:') || $depth <= 0) {
            return false;
        }
        [$date, $idx, $entry] = $this->find($id);
        if ($entry === null || $entry['tipo'] !== 'terapia' || !in_array($entry['stato'], ['programmato', 'confermato'], true) || $entry['start'] <= $this->now || $entry['ep'] === null) {
            return false;
        }
        foreach ($this->moves as $m) {
            if ($m['appointment_id'] === $id) {
                return false;   // già spostato una volta
            }
        }
        $ep = $this->store->get('episodes', $entry['ep'], false);
        $line = null;
        foreach ($ep['therapies'] ?? [] as $l) {
            if ($l['line_id'] === $entry['line']) {
                $line = $l;
            }
        }
        $type = $line ? ($this->types[$line['therapy_type_id']] ?? null) : null;
        if ($ep === null || $line === null || $type === null || !empty($type['di_gruppo']) || count($entry['pat']) !== 1) {
            return false;
        }
        $this->episodes[$entry['ep']] = $ep;
        $dm = ['episode_id' => $entry['ep'], 'patient_id' => $entry['pat'][0], 'line_id' => $entry['line'], 'line' => ['professional_preferito_id' => $entry['pro']] + $line, 'type' => $type, 'weeks' => [],
            'rules' => ['no_consecutivi' => (bool) ($ep['vincoli']['no_giorni_consecutivi'] ?? false), 'max_giorno' => (int) ($ep['vincoli']['max_al_giorno'] ?? 2), 'contigue' => (bool) ($ep['vincoli']['sedute_contigue'] ?? true)]];
        // La frequenza settimanale della riga spostata: conta le altre sedute vive della stessa riga, tolta questa.
        foreach ($this->busy as $dt => $rows) {
            foreach ($rows as $b) {
                if ($b['id'] !== $id && $b['ep'] === $entry['ep'] && $b['line'] === $entry['line']) {
                    $dm['weeks'][Clock::weekStart($dt)] = ($dm['weeks'][Clock::weekStart($dt)] ?? 0) + 1;
                }
            }
        }
        $lo = max($from, Clock::addDays($date, -3));
        $hi = min($to, Clock::addDays($date, 3));
        $dm['line']['frequenza_max'] = max((int) $line['frequenza_max'], 1);
        $ignore = [$id => true];
        // Stesso terapista, durata del tipo di terapia (l'appuntamento esistente può avere durata diversa: si usa quella reale)
        $realDur = $entry['e'] - $entry['s'];
        $dm['type']['durata_min'] = $realDur;
        $cands = array_values(array_filter($this->candidates($dm, $lo, $hi, false, $ignore), static fn ($c) => $c['pro'] === $entry['pro']));
        foreach ($this->rank($cands, $dm) as $c) {
            if ($c['date'] === $date && $c['s'] === $entry['s']) {
                continue;
            }
            if ($c['date'] === $target['date'] && $c['s'] < $target['e'] && $target['s'] < $c['e'] && $c['pro'] === $target['pro']) {
                continue;
            }
            $bl = $this->blockers($c, $dm, $ignore, $reserved);
            if ($bl === []) {
                $this->applyMove($id, $date, $idx, $entry, $c);
                return true;
            }
            if (!in_array('*', $bl, true) && count($bl) === 1 && $depth > 1 && microtime(true) < $this->deadline) {
                $snap = [$this->busy, $this->moves];
                if ($this->relocate($bl[0], $c, $depth - 1, array_merge($reserved, [$c]), $from, $to) && $this->blockers($c, $dm, $ignore, $reserved) === []) {
                    [$date2, $idx2, $entry2] = $this->find($id);
                    $this->applyMove($id, $date2, $idx2, $entry2, $c);
                    return true;
                }
                [$this->busy, $this->moves] = $snap;
            }
        }
        return false;
    }

    private function find(string $id): array
    {
        foreach ($this->busy as $date => $rows) {
            foreach ($rows as $i => $b) {
                if ($b['id'] === $id) {
                    return [$date, $i, $b];
                }
            }
        }
        return ['', -1, null];
    }

    private function applyMove(string $id, string $date, int $idx, array $entry, array $c): void
    {
        unset($this->busy[$date][$idx]);
        $this->busy[$date] = array_values($this->busy[$date]);
        $operatorDuration=max(0,($entry['op_end']??$entry['e'])-$entry['s']);
        $entry['op_end']=$c['s']+$operatorDuration;
        $entry['s'] = $c['s'];
        $entry['e'] = $c['e'];
        $this->busy[$c['date']][] = $entry;
        $this->moves[] = [
            'appointment_id' => $id, 'revision' => $entry['rev'], 'paziente_id' => $entry['pat'][0],
            'da' => $entry['start'], 'a' => sprintf('%sT%02d:%02d:00', $c['date'], intdiv($c['s'], 60), $c['s'] % 60), 'professional_id' => $entry['pro'],
        ];
    }

    private function whyNot(array $d, string $from, string $to): string
    {
        if ($this->candidates($d, $from, $to, false) === []) {
            return 'nessuna_fascia_compatibile';
        }
        return 'agenda_piena';
    }
}
