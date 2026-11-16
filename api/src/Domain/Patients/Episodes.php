<?php
declare(strict_types=1);

namespace App\Domain\Patients;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Agenda\Appointments;
use App\Store\Store;
use App\Support\Validator as V;

/** Episodi clinici: cicli di terapia, disponibilità del paziente, avanzamento delle sedute. */
final class Episodes
{
    public function __construct(private readonly Store $store, private readonly Appointments $appointments, private readonly Patients $patients)
    {
    }

    public function save(array $d, ?string $id, ?int $revision): array
    {
        return $this->store->transaction(function () use ($d, $id, $revision) {
            $patientId = V::id($d, 'patient_id', 'paz', true);
            $this->store->get('patients', $patientId) ?? throw new ApiError('paziente_non_trovato', 422);
            $current = $id ? ($this->store->get('episodes', $id) ?? throw ApiError::notFound()) : null;
            if ($current !== null && $current['patient_id'] !== $patientId) {
                throw new ApiError('paziente_non_modificabile', 422);
            }
            $lines = $this->lines(V::arr($d, 'terapie', true), $current['therapies'] ?? []);
            if ($current !== null) $this->protectHistory($current, $lines);
            if ($lines === []) {
                throw new ApiError('terapie_mancanti', 422, ['campo' => 'terapie']);
            }
            $start = V::date($d, 'data_inizio') ?? Clock::today();
            $end = V::date($d, 'data_fine_prevista');
            if ($end !== null && $end < $start) {
                throw new ApiError('intervallo_non_valido', 422);
            }
            $prescriber = V::id($d, 'prescrittore_id', 'pro');
            $rec = [
                'patient_id' => $patientId, 'titolo' => V::str($d, 'titolo', true, 160), 'diagnosi' => V::str($d, 'diagnosi', false, 4000),
                'note_terapeutiche' => V::str($d, 'note_terapeutiche', false, 4000), 'prescrittore_id' => $prescriber,
                'data_inizio' => $start, 'data_fine_prevista' => $end, 'stato' => $current['stato'] ?? 'aperto',
                'therapies' => $lines, 'availability' => Availability::clean(V::arr($d, 'disponibilita')),
                'profilo_gruppo'=>V::enum($d,'profilo_gruppo',['standard','complesso','neurologico'],false,$current['profilo_gruppo']??'standard'),
                'followup_giorni' => V::int($d, 'followup_giorni', false, 1, 365),
                'vincoli' => [
                    'no_giorni_consecutivi' => V::bool((array) ($d['vincoli'] ?? []), 'no_giorni_consecutivi'),
                    'max_al_giorno' => V::int((array) ($d['vincoli'] ?? []), 'max_al_giorno', false, 1, 10),
                    'sedute_contigue' => V::bool((array) ($d['vincoli'] ?? []), 'sedute_contigue', true),
                ],
                'preventivo_id' => $current['preventivo_id'] ?? V::id($d, 'preventivo_id', 'doc'),
            ];
            $saved = $this->store->put('episodes', array_replace($current ?? [], $rec), $revision);
            $this->patients->attachProfessional($patientId, $prescriber);
            foreach ($lines as $l) {
                $this->patients->attachProfessional($patientId, $l['professional_preferito_id']);
            }
            return $saved;
        });
    }

    /** @param list<array> $existing */
    private function lines(array $in, array $existing): array
    {
        $out = [];
        $known = array_column($existing, null, 'line_id');
        foreach ($in as $l) {
            $l = (array) $l;
            $type = V::id($l, 'therapy_type_id', 'ter', true);
            $tt = $this->store->get('therapy_types', $type) ?? throw new ApiError('terapia_non_trovata', 422);
            $lineId = V::str($l, 'line_id', false, 40);
            if ($lineId !== null && !preg_match('/^lin_[a-f0-9]{16}$/', $lineId)) {
                throw new ApiError('riga_non_valida', 422);
            }
            if ($lineId !== null && (!isset($known[$lineId]) || in_array($lineId, array_column($out, 'line_id'), true))) throw new ApiError('riga_non_valida', 422);
            $lineId ??= 'lin_' . bin2hex(random_bytes(8));
            $fMin = V::int($l, 'frequenza_min', false, 1, 14) ?? 1;
            $fMax = V::int($l, 'frequenza_max', false, 1, 14) ?? max($fMin, 3);
            if ($fMax < $fMin) {
                throw new ApiError('frequenza_non_valida', 422);
            }
            $preferred=V::id($l,'professional_preferito_id','pro');
            if($preferred!==null&&!$this->store->get('professionals',$preferred))throw new ApiError('professionista_non_trovato',422);
            if(V::bool($l,'vincolo_professionista')&&$preferred===null)throw new ApiError('professionista_obbligatorio',422);
            $out[] = [
                'line_id' => $lineId, 'therapy_type_id' => $type, 'categoria' => $tt['categoria'],
                'sedute_previste' => V::int($l, 'sedute_previste', true, 1, 200),
                'frequenza_min' => $fMin, 'frequenza_max' => $fMax, 'intervallo_min_giorni' => V::int($l,'intervallo_min_giorni',false,0,30) ?? 0,
                'professional_preferito_id' => V::id($l, 'professional_preferito_id', 'pro'), 'vincolo_professionista'=>V::bool($l,'vincolo_professionista'),
                'stato' => ($known[$lineId]['stato'] ?? 'attiva'), 'followup_giorni' => V::int($l, 'followup_giorni', false, 1, 365),
            ];
        }
        return $out;
    }

    /** Le prescrizioni possono crescere, senza riscrivere lo storico già assegnato. */
    private function protectHistory(array $episode, array $lines): void
    {
        $next = array_column($lines, null, 'line_id');
        $old = array_column($episode['therapies'], null, 'line_id');
        $counts = [];
        foreach ($this->appointments->forEpisodes([$episode['id']]) as $a) {
            foreach (Appointments::refs($a) as $ref) {
                if ($ref['episode_id'] !== $episode['id'] || empty($ref['line_id'])) continue;
                $id = $ref['line_id'];
                if (!isset($next[$id]) || $next[$id]['therapy_type_id'] !== $old[$id]['therapy_type_id']) throw new ApiError('terapia_con_storico', 409);
                if ($a['stato'] !== 'annullato' && in_array($ref['stato'], Appointments::LIVE, true)) $counts[$id] = ($counts[$id] ?? 0) + 1;
            }
        }
        foreach ($counts as $id => $count) if ($next[$id]['sedute_previste'] < $count) throw new ApiError('sedute_inferiori_alle_assegnate', 409);
    }

    private function availability(array $in): array
    {
        $out = [];
        foreach ($in as $a) {
            $a = (array) $a;
            $row = [
                'giorno' => V::int($a, 'giorno', true, 1, 7), 'da' => V::time($a, 'da', true), 'a' => V::time($a, 'a', true),
                'preferenza' => V::enum($a, 'preferenza', ['alta', 'media', 'bassa'], false, 'media'),
                'valida_dal' => V::date($a, 'valida_dal'), 'valida_al' => V::date($a, 'valida_al'),
            ];
            if ($row['da'] >= $row['a']) {
                throw new ApiError('fascia_non_valida', 422);
            }
            $out[] = $row;
        }
        return $out;
    }

    /**
     * Avanzamento per riga: eseguite, programmate (future, non annullate), residue da pianificare.
     * @param list<array>|null $appointments appuntamenti dell'episodio già caricati
     * @return list<array<string,mixed>>
     */
    public function progress(array $episode, ?array $appointments = null): array
    {
        $appointments ??= $this->appointments->forEpisodes([$episode['id']]);
        $now = Clock::stamp();
        $count = [];
        foreach ($appointments as $a) {
            if ($a['stato'] === 'annullato' || ($a['tipo'] ?? '') === 'nota') {
                continue;
            }
            foreach (Appointments::refs($a) as $r) {
                if ($r['episode_id'] !== $episode['id'] || $r['line_id'] === null) {
                    continue;
                }
                $c = &$count[$r['line_id']];
                $c ??= ['eseguite' => 0, 'programmate' => 0, 'assenti' => 0, 'prossima' => null, 'ultima' => null];
                if ($r['stato'] === 'eseguito') {
                    $c['eseguite']++;
                    $c['ultima'] = $c['ultima']===null || $a['start']>$c['ultima'] ? $a['start'] : $c['ultima'];
                } elseif ($r['stato'] === 'assente') {
                    $c['assenti']++;
                } elseif (in_array($r['stato'], ['programmato', 'confermato'], true)) {
                    $c['programmate']++;
                    $c['prossima'] = $c['prossima'] === null || $a['start'] < $c['prossima'] ? $a['start'] : $c['prossima'];
                }
                unset($c);
            }
        }
        $out = [];
        foreach ($episode['therapies'] as $line) {
            $c = $count[$line['line_id']] ?? ['eseguite' => 0, 'programmate' => 0, 'assenti' => 0, 'prossima' => null, 'ultima' => null];
            $out[] = $line + $c + [
                'da_eseguire' => max(0, $line['sedute_previste'] - $c['eseguite']),
                'residue' => max(0, $line['sedute_previste'] - $c['eseguite'] - $c['programmate']),
                'eccedenti' => max(0, $c['eseguite'] + $c['programmate'] - $line['sedute_previste']),
            ];
        }
        return $out;
    }

    /** Aggiorna lo stato delle righe (attiva/completata) dopo che una seduta è stata eseguita o annullata. */
    public function refreshLines(string $episodeId): ?array
    {
        return $this->store->transaction(function () use ($episodeId) {
            $ep = $this->store->get('episodes', $episodeId);
            if ($ep === null) {
                return null;
            }
            $progress = $this->progress($ep);
            $changed = false;
            foreach ($ep['therapies'] as $i => $line) {
                $done = $progress[$i]['eseguite'] >= $line['sedute_previste'];
                $new = $done ? 'completata' : 'attiva';
                if ($line['stato'] !== $new) {
                    $ep['therapies'][$i]['stato'] = $new;
                    $changed = true;
                }
            }
            return $changed ? $this->store->put('episodes', $ep) : $ep;
        });
    }

    /** Sedute programmate oltre quelle previste: la segreteria conferma se cancellarle. */
    public function surplus(array $episode): array
    {
        $apps = $this->appointments->forEpisodes([$episode['id']]);
        $out = [];
        foreach ($episode['therapies'] as $line) {
            $mine = [];
            foreach ($apps as $a) {
                foreach (Appointments::refs($a) as $r) {
                    if ($r['episode_id'] === $episode['id'] && $r['line_id'] === $line['line_id'] && in_array($r['stato'], Appointments::LIVE, true) && $a['stato'] !== 'annullato') {
                        $mine[] = [$a['start'], $a['id'], $r['stato']];
                    }
                }
            }
            usort($mine, static fn ($x, $y) => strcmp($x[0], $y[0]));
            foreach (array_slice($mine, $line['sedute_previste']) as [$start, $id, $stato]) {
                if ($stato !== 'eseguito') {
                    $out[] = ['appointment_id' => $id, 'line_id' => $line['line_id'], 'inizio' => $start];
                }
            }
        }
        return $out;
    }

    public function setState(string $id, string $state): array
    {
        if (!in_array($state, ['aperto', 'concluso', 'sospeso'], true)) {
            throw new ApiError('stato_non_valido', 422);
        }
        return $this->store->transaction(function () use ($id, $state) {
            $ep = $this->store->get('episodes', $id) ?? throw ApiError::notFound();
            $ep['stato'] = $state;
            $ep['concluso_il'] = $state === 'concluso' ? Clock::today() : null;
            return $this->store->put('episodes', $ep);
        });
    }
}
