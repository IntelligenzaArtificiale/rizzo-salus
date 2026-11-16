<?php
declare(strict_types=1);

namespace App\Domain\Agenda;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Calendar\Hours;
use App\Store\Store;

/**
 * Copia della programmazione di una settimana nella successiva.
 * L'esclusione vale per la singola riga di terapia (e per il singolo partecipante dei gruppi), non per il paziente.
 * L'operazione è idempotente: ogni copia ricorda l'appuntamento d'origine, quindi ripeterla non crea doppioni.
 */
final class CopyWeek
{
    public const REASONS = ['episodio_chiuso', 'episodio_sospeso', 'riga_completata', 'sedute_esaurite', 'disponibilita_scaduta', 'festivo_o_chiusura', 'professionista_assente', 'gia_copiato', 'nessun_partecipante', 'episodio_mancante'];

    public function __construct(
        private readonly Store $store,
        private readonly Appointments $appointments,
        private readonly Checker $checker,
        private readonly Hours $hours,
        private readonly Agenda $agenda,
    ) {
    }

    /**
     * @param array{includi_visite?:bool,includi_note?:bool,escludi?:list<string>} $opt  «escludi»: chiavi "idAppuntamento|idRiga" o "idAppuntamento|idPaziente" scelte a mano
     * @return array{settimana_origine:string,settimana_destinazione:string,copiati:list<array>,esclusi:list<array>,conflitti:list<array>,avvisi:list<array>}
     */
    public function preview(string $weekStart, array $opt = []): array
    {
        $weekStart = Clock::weekStart($weekStart);
        $target = Clock::addDays($weekStart, 7);
        $source = $this->appointments->between($weekStart, $target);
        if (isset($opt['selezionati'])) $source=array_values(array_filter($source,static fn($a)=>in_array($a['id'],$opt['selezionati'],true)));
        $existingTarget = $this->appointments->between($target, Clock::addDays($target, 7), true);
        $alreadyCopied = [];
        foreach ($existingTarget as $t) {
            if (!empty($t['copy_of']) && $t['stato'] !== 'annullato') {
                $alreadyCopied[$t['copy_of']] = true;
            }
        }
        $manualExclude = array_flip($opt['escludi'] ?? []);

        $epIds = [];
        foreach ($source as $a) {
            foreach (Appointments::refs($a) as $r) {
                if ($r['episode_id']) {
                    $epIds[$r['episode_id']] = true;
                }
            }
        }
        $live = $this->liveCounts(array_keys($epIds));
        $episodes = [];
        foreach (array_keys($epIds) as $id) {
            $episodes[$id] = $this->store->get('episodes', $id, false);
        }

        $copied = [];
        $excluded = [];
        $conflicts = [];
        $warnings = [];
        $added = [];
        $pending = [];   // appuntamenti già accettati in questa anteprima, per i controlli fra copie

        foreach ($source as $a) {
            $tipo = $a['tipo'];
            if (($tipo === 'visita' && empty($opt['includi_visite'])) || ($tipo === 'nota' && empty($opt['includi_note']))) {
                continue;
            }
            if (isset($alreadyCopied[$a['id']])) {
                $excluded[] = ['appointment_id' => $a['id'], 'start' => $a['start'], 'paziente' => null, 'motivo' => 'gia_copiato'];
                continue;
            }
            $newStart = Clock::addDays(substr($a['start'], 0, 10), 7) . substr($a['start'], 10);
            $date = substr($newStart, 0, 10);
            if ($this->hours->closedReason($date) !== null) {
                $excluded[] = ['appointment_id' => $a['id'], 'start' => $newStart, 'paziente' => null, 'motivo' => 'festivo_o_chiusura'];
                continue;
            }
            $pro = !empty($a['professional_id']) ? $this->store->get('professionals', $a['professional_id'], false) : null;
            if ($pro !== null && $tipo !== 'nota' && $this->hours->absenceReason($pro, $date) !== null) {
                $excluded[] = ['appointment_id' => $a['id'], 'start' => $newStart, 'paziente' => null, 'motivo' => 'professionista_assente'];
                continue;
            }
            if ($tipo === 'nota') {
                $copied[] = ['source_id' => $a['id'], 'start' => $newStart, 'end' => Clock::addMinutes($newStart, Clock::diffMinutes($a['start'], $a['end'])), 'tipo' => 'nota', 'pazienti' => []];
                continue;
            }

            $keep = [];
            foreach (Appointments::refs($a) as $r) {
                $key = $a['id'] . '|' . ($tipo === 'gruppo' ? $r['patient_id'] : ($r['line_id'] ?? $r['patient_id']));
                $why = $this->refReason($r, $episodes, $live, $added, $date, isset($manualExclude[$key]));
                if ($why !== null) {
                    $excluded[] = ['appointment_id' => $a['id'], 'start' => $newStart, 'paziente' => $r['patient_id'], 'riga' => $r['line_id'], 'motivo' => $why, 'chiave' => $key];
                    continue;
                }
                $keep[] = $r;
            }
            if ($keep === [] && Appointments::refs($a) !== []) {
                continue;
            }
            $candidate = array_replace($a, ['start' => $newStart, 'end' => Clock::addMinutes($newStart, Clock::diffMinutes($a['start'], $a['end'])), 'stato' => 'programmato']);
            if ($tipo === 'gruppo') {
                $candidate['participants'] = array_map(static fn ($r) => ['patient_id' => $r['patient_id'], 'episode_id' => $r['episode_id'], 'line_id' => $r['line_id'], 'stato' => 'programmato'], $keep);
            }
            $check = $this->checkAgainst($candidate, $pending);
            if ($check['conflitti'] !== []) {
                $conflicts[] = ['appointment_id' => $a['id'], 'start' => $newStart, 'conflitti' => $check['conflitti']];
                // non ho copiato nulla: libero il conteggio delle sedute riservate
                foreach ($keep as $r) {
                    $k = $r['episode_id'] . '|' . $r['line_id'];
                    $added[$k] = max(0, ($added[$k] ?? 0) - 1);
                }
                continue;
            }
            foreach ($check['avvisi'] as $w) {
                $warnings[] = ['appointment_id' => $a['id'], 'start' => $newStart] + $w;
            }
            $pending[] = $candidate + ['id' => 'pending_' . $a['id']];
            $copied[] = [
                'source_id' => $a['id'], 'start' => $newStart, 'end' => $candidate['end'], 'tipo' => $tipo,
                'pazienti' => array_column($keep, 'patient_id'), 'professional_id' => $a['professional_id'] ?? null,
            ];
        }
        return ['settimana_origine' => $weekStart, 'settimana_destinazione' => $target, 'copiati' => $copied, 'esclusi' => $excluded, 'conflitti' => $conflicts, 'avvisi' => $warnings];
    }

    /** Applica la copia in una sola transazione, ricalcolando l'anteprima sotto lock. @return array{creati:int,anteprima:array} */
    public function apply(string $weekStart, array $opt = []): array
    {
        return $this->store->transaction(function () use ($weekStart, $opt) {
            $pv = $this->preview($weekStart, $opt);
            $n = 0;
            foreach ($pv['copiati'] as $c) {
                $src = $this->store->get('appointments', $c['source_id']) ?? throw ApiError::notFound();
                $in = [
                    'tipo' => $src['tipo'], 'start' => $c['start'], 'end' => $c['end'], 'professional_id' => $src['professional_id'] ?? null,
                    'therapy_type_id' => $src['therapy_type_id'] ?? null, 'resource_id' => $src['resource_id'] ?? null, 'durata_min' => Clock::diffMinutes($src['start'], $src['end']),
                    'patient_id' => $src['patient_id'] ?? null, 'episode_id' => $src['episode_id'] ?? null, 'line_id' => $src['line_id'] ?? null, 'nota' => $src['nota'] ?? null,
                    'titolo' => $src['titolo'] ?? null, 'group_id' => $src['group_id'] ?? null, 'origine' => 'copia_settimana',
                    'participants' => $src['tipo'] === 'gruppo' ? array_values(array_filter($src['participants'], static fn ($p) => in_array($p['patient_id'], $c['pazienti'], true))) : [],
                ];
                $saved = $this->agenda->create($in, true, 'copia_settimana');
                $this->store->put('appointments', array_replace($saved, ['copy_of' => $src['id'], 'copy_week' => $pv['settimana_destinazione']]));
                $n++;
            }
            return ['creati' => $n, 'anteprima' => $pv];
        });
    }

    /** @return array<string,int> "episodio|riga" => sedute vive (programmate, confermate, eseguite) */
    private function liveCounts(array $episodeIds): array
    {
        $count = [];
        foreach ($this->appointments->forEpisodes($episodeIds) as $a) {
            if ($a['stato'] === 'annullato') {
                continue;
            }
            foreach (Appointments::refs($a) as $r) {
                if ($r['episode_id'] && $r['line_id'] && in_array($r['stato'], Appointments::LIVE, true)) {
                    $k = $r['episode_id'] . '|' . $r['line_id'];
                    $count[$k] = ($count[$k] ?? 0) + 1;
                }
            }
        }
        return $count;
    }

    private function refReason(array $r, array $episodes, array $live, array &$added, string $date, bool $manual): ?string
    {
        if ($manual) {
            return 'escluso_a_mano';
        }
        if ($r['episode_id'] === null) {
            return null; // visita o seduta senza episodio: si copia come è
        }
        $ep = $episodes[$r['episode_id']] ?? null;
        if ($ep === null) {
            return 'episodio_mancante';
        }
        if ($ep['stato'] === 'concluso') {
            return 'episodio_chiuso';
        }
        if ($ep['stato'] === 'sospeso') {
            return 'episodio_sospeso';
        }
        $line = null;
        foreach ($ep['therapies'] as $l) {
            if ($l['line_id'] === $r['line_id']) {
                $line = $l;
            }
        }
        if ($line === null) {
            return null;
        }
        if ($line['stato'] === 'completata') {
            return 'riga_completata';
        }
        $k = $r['episode_id'] . '|' . $r['line_id'];
        if (($live[$k] ?? 0) + ($added[$k] ?? 0) >= (int) $line['sedute_previste']) {
            return 'sedute_esaurite';
        }
        $slots = $ep['availability'] ?? [];
        if ($slots !== [] && array_filter($slots, static fn ($s) => !empty($s['valida_al'])) === $slots && min(array_column($slots, 'valida_al')) < $date && max(array_column($slots, 'valida_al')) < $date) {
            return 'disponibilita_scaduta';
        }
        $added[$k] = ($added[$k] ?? 0) + 1;
        return null;
    }

    /** Controlli di un candidato rispetto al calendario reale e alle copie già accettate in questa anteprima. */
    private function checkAgainst(array $candidate, array $pending): array
    {
        return $this->checker->check($candidate,null,$pending);
    }
}
