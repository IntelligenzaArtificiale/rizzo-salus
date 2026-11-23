<?php
declare(strict_types=1);

namespace App\Domain\Planning;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Agenda\Agenda;
use App\Domain\Agenda\Appointments;
use App\Domain\Calendar\Hours;
use App\Services\Settings;
use App\Store\Store;

/**
 * Pianificatore deterministico. Non usa l'AI: a parità di dati produce sempre la stessa proposta.
 *
 * Metodo: le richieste (una per riga di terapia con sedute residue) si ordinano dalla più vincolata;
 * ogni seduta prende la candidata migliore (fascia preferita, continuità del terapista, contiguità, frequenza).
 * Se non c'è posto, prova a spostare appuntamenti di altri pazienti dentro le loro stesse fasce (profondità limitata,
 * tempo massimo da impostazioni). Niente viene scritto in agenda finché una persona non approva la proposta.
 */
final class Planner
{
    use PlanningCandidates, PlanningAvailability, PlanningRelocation;
    private const STEP = 15;

    /** @var array<string,list<array<string,mixed>>> data → impegni */
    private array $busy = [];
    private array $moves = [];
    private array $pros = [];
    private array $resources = [];
    private array $types = [];
    private array $episodes = [];
    private float $deadline = 0.0;
    private int $maxDepth = 2;
    private string $now = '';
    private bool $compact = false;
    private int $seq = 0;
    private bool $timedOut = false;

    public function __construct(
        private readonly Store $store,
        private readonly Appointments $appointments,
        private readonly Hours $hours,
        private readonly Agenda $agenda,
        private readonly Settings $settings,
    ) {
    }

    /**
     * @param list<string> $episodeIds
     * @param array{ricalcola?:bool} $opt
     * @return array<string,mixed> proposta salvata
     */
    public function propose(array $episodeIds, string $from, string $to, string $userId, array $opt = []): array
    {
        if ($to < $from || Clock::diffMinutes($from . 'T00:00:00', $to . 'T00:00:00') > 120 * 1440) {
            throw new ApiError('intervallo_non_valido', 422);
        }
        $t0 = microtime(true);
        $this->deadline = $t0 + max(200, (int) $this->settings->get('ai.tempo_max_ms', 2000)) / 1000;
        $this->maxDepth = max(0, min(3, (int) $this->settings->get('ai.spostamenti_profondita', 2)));
        $this->now = Clock::stamp();
        $this->compact = ($opt['priorita'] ?? '') === 'continuita';
        $this->moves = [];
        $this->timedOut = false;
        $this->seq = 0;
        $this->load($from, $to);

        $demands = $this->demands($episodeIds, $from, $to);
        $unplanned = [];
        $news = [];
        usort($demands, fn ($a, $b) => [$a['tightness'], $a['patient_id'], $a['line_id']] <=> [$b['tightness'], $b['patient_id'], $b['line_id']]);

        foreach ($demands as &$d) {
            for ($i = 0; $i < $d['residue']; $i++) {
                $placed = $this->place($d, $from, $to);
                if ($placed === null) {
                    $unplanned[] = ['episode_id' => $d['episode_id'], 'patient_id' => $d['patient_id'], 'line_id' => $d['line_id'],
                        'therapy_type_id' => $d['type']['id'], 'mancanti' => $d['residue'] - $i, 'motivo' => $this->timedOut ? 'tempo_scaduto' : $this->whyNot($d, $from, $to)];
                    break;
                }
                $news[] = $placed;
            }
        }
        unset($d);

        $ids = [];
        foreach ($this->moves as $m) {
            $ids[] = $m['appointment_id'];
        }
        $proposal = $this->store->transaction(fn () => $this->store->put('proposals', [
            'stato' => 'proposta', 'creata_da' => $userId, 'creata_il' => Clock::stamp(), 'dal' => $from, 'al' => $to,
            'priorita' => $this->compact ? 'continuita' : 'paziente', 'episodi' => array_values($episodeIds), 'nuove' => $news, 'spostamenti' => $this->moves, 'non_pianificate' => $unplanned,
            'riepilogo' => [
                'sedute_nuove' => count($news), 'spostamenti' => count($this->moves), 'non_pianificate' => array_sum(array_column($unplanned, 'mancanti')),
                'tempo_ms' => (int) round((microtime(true) - $t0) * 1000),
            ],
        ]));
        return $proposal;
    }

    // ------------------------------------------------------------ approvazione

    /** Applica tutta la proposta o niente. @return array<string,mixed> */
    public function approve(string $proposalId, string $userId, ?array $selected = null, array $edits = [], bool $moves = false): array
    {
        return (new ProposalApproval($this->store,$this->agenda))->apply($proposalId,$userId,$selected,$edits,$moves);
    }

    public function discard(string $proposalId, string $userId): array
    {
        return $this->store->transaction(function () use ($proposalId, $userId) {
            $p = $this->store->get('proposals', $proposalId) ?? throw ApiError::notFound();
            if ($p['stato'] !== 'proposta') {
                throw new ApiError('proposta_gia_chiusa', 409);
            }
            return $this->store->put('proposals', array_replace($p, ['stato' => 'scartata', 'scartata_da' => $userId, 'scartata_il' => Clock::stamp()]));
        });
    }

    // ------------------------------------------------------------ caricamento

    private function load(string $from, string $to): void
    {
        $this->pros = [];
        foreach ($this->store->all('professionals') as $p) {
            if (($p['attivo'] ?? true) !== false) {
                $this->pros[$p['id']] = $p;
            }
        }
        $this->resources = array_column($this->store->all('resources'), null, 'id');
        $allowed=$this->settings->get('agenda.professionisti_riabilitazione',[]);if($allowed)$this->pros=array_filter($this->pros,fn($p)=>in_array($p['id'],$allowed,true));
        $this->types = array_column($this->store->all('therapy_types'), null, 'id');
        $this->busy = [];
        foreach ($this->appointments->between(Clock::addDays($from, -31), Clock::addDays($to, 32)) as $a) {
            if (($a['tipo'] ?? '') === 'nota' || $a['stato'] === 'assente') {
                continue;
            }
            $refs = array_values(array_filter(Appointments::refs($a), static fn ($r) => $r['stato'] !== 'assente'));
            $this->busy[substr($a['start'], 0, 10)][] = [
                'id' => $a['id'], 's' => Clock::minutes(substr($a['start'], 11, 5)), 'e' => Clock::minutes(substr($a['start'], 11, 5)) + Clock::diffMinutes($a['start'], $a['end']),
                'op_end'=>PlanningRules::operatorEnd($a,Clock::minutes($a['start']),Clock::minutes($a['start'])+Clock::diffMinutes($a['start'],$a['end'])),
                'resources'=>\App\Domain\Agenda\TherapyRules::resources($a,$this->store),
                'pro' => $a['professional_id'] ?? null, 'res' => $a['resource_id'] ?? null, 'n' => max(1, count($refs)),
                'pat' => array_column($refs, 'patient_id'), 'ep' => $refs[0]['episode_id'] ?? null, 'line' => $refs[0]['line_id'] ?? null,
                'rev' => (int) ($a['revision'] ?? 1), 'start' => $a['start'], 'tipo' => $a['tipo'], 'stato' => $a['stato'], 'cat' => $a['categoria'] ?? null, 'type' => $a['therapy_type_id'] ?? null, 'cap' => $a['capienza'] ?? 1, 'refs' => $refs,
            ];
        }
    }

    /** @return list<array<string,mixed>> */
    private function demands(array $episodeIds, string $from, string $to): array
    {
        $out = [];
        $live = [];
        foreach ($this->appointments->forEpisodes($episodeIds) as $a) {
            if ($a['stato'] === 'annullato') {
                continue;
            }
            foreach (Appointments::refs($a) as $r) {
                if ($r['episode_id'] && $r['line_id'] && in_array($r['stato'], Appointments::LIVE, true)) {
                    $live[$r['episode_id'] . '|' . $r['line_id']][] = substr($a['start'], 0, 10);
                }
            }
        }
        foreach ($episodeIds as $eid) {
            $ep = $this->store->get('episodes', $eid, false);
            if ($ep === null || $ep['stato'] !== 'aperto') {
                continue;
            }
            $this->episodes[$eid] = $ep;
            foreach ($ep['therapies'] as $line) {
                $type = $this->types[$line['therapy_type_id']] ?? null;
                if ($type === null || $line['stato'] === 'completata' || $type['categoria'] === 'visita') {
                    continue;
                }
                $dates = $live[$eid . '|' . $line['line_id']] ?? [];
                $residue = (int) $line['sedute_previste'] - count($dates);
                if ($residue <= 0) {
                    continue;
                }
                $weeks = [];
                foreach ($dates as $dt) {
                    $weeks[Clock::weekStart($dt)] = ($weeks[Clock::weekStart($dt)] ?? 0) + 1;
                }
                $d = ['episode_id' => $eid, 'patient_id' => $ep['patient_id'], 'line_id' => $line['line_id'], 'line' => $line, 'type' => $type,
                    'residue' => $residue, 'weeks' => $weeks, 'tightness' => 0,
                    'rules' => [
                        'no_consecutivi' => (bool) ($ep['vincoli']['no_giorni_consecutivi'] ?? $this->settings->get('pianificazione.no_giorni_consecutivi', false)),
                        'max_giorno' => (int) ($ep['vincoli']['max_al_giorno'] ?? $this->settings->get('pianificazione.max_al_giorno', 2)),
                        'contigue' => (bool) ($ep['vincoli']['sedute_contigue'] ?? $this->settings->get('pianificazione.sedute_contigue', true)),
                    ]];
                $d['tightness'] = count($this->candidates($d, $from, $to, false)) / max(1, $residue);
                $out[] = $d;
            }
        }
        return $out;
    }

    // ------------------------------------------------------------ candidati

    /**
     * Tutte le posizioni ammesse dalle fasce (paziente, terapista, struttura), con punteggio. Non guarda l'occupazione se $freeOnly è falso.
     * @return list<array<string,mixed>> ordinate per punteggio crescente
     */
    /** Occupazione e regole del paziente su una candidata. */
    private function isFree(array $c, array $d, array $ignore, array $extraBlock): bool
    {
        return $this->blockers($c, $d, $ignore, $extraBlock) === [];
    }

    /**
     * Impegni che impediscono la candidata. Una regola del paziente (max al giorno, giorni consecutivi, frequenza) non si risolve spostando altri: ritorna ['*'].
     * @return list<string> id impegni bloccanti, oppure ['*'] se bloccata in modo definitivo
     */
    // ------------------------------------------------------------ posizionamento

    /** @return array<string,mixed>|null */
    private function place(array &$d, string $from, string $to): ?array
    {
        $cands = $this->candidates($d, $from, $to, false);
        $free = [];
        foreach ($cands as $c) {
            if ($this->isFree($c, $d, [], [])) {
                $free[] = $c;
            }
        }
        $free = $this->rank($free, $d);
        $chosen = $free[0] ?? null;
        $alternatives = array_slice($free, 1, 3);
        $moved = [];

        if ($chosen === null && $this->maxDepth > 0 && microtime(true) < $this->deadline) {
            $snapshot = [$this->busy, $this->moves];
            foreach ($this->rank($cands, $d) as $c) {
                if (microtime(true) >= $this->deadline) {
                    $this->timedOut = true;
                    break;
                }
                $bl = $this->blockers($c, $d, [], []);
                if ($bl === [] || in_array('*', $bl, true) || count($bl) > 2) {
                    continue;
                }
                $ok = true;
                $before = count($this->moves);
                foreach ($bl as $id) {
                    if (!$this->relocate($id, $c, $this->maxDepth, [$c], $from, $to)) {
                        $ok = false;
                        break;
                    }
                }
                if ($ok && $this->isFree($c, $d, [], [])) {
                    $chosen = $c;
                    $moved = array_slice($this->moves, $before);
                    break;
                }
                [$this->busy, $this->moves] = $snapshot;
            }
        }
        if ($chosen === null) {
            return null;
        }
        $groupId = null;
        if (!empty($d['type']['di_gruppo'])) foreach($this->busy[$chosen['date']]??[] as $b) {
            if($b['tipo']==='gruppo'&&$b['pro']===$chosen['pro']&&($b['type']??null)===$d['type']['id']&&$b['s']===$chosen['s']&&$b['e']===$chosen['e']) $groupId=$b['id'];
        }
        $this->commit($d, $chosen);
        $motivi = [];
        $motivi[] = $chosen['pref'] === 0 ? 'fascia_preferita' : ($chosen['pref'] === 1 ? 'fascia_indicata' : 'fascia_meno_gradita');
        $motivi[] = $chosen['preferred_pro'] ? 'terapista_del_percorso' : 'altro_terapista';
        if (!empty($chosen['contiguous'])) {
            $motivi[] = 'seduta_contigua';
        }
        if ($moved !== []) {
            $motivi[] = 'ha_richiesto_spostamenti';
        }
        return [
            'episode_id' => $d['episode_id'], 'patient_id' => $d['patient_id'], 'line_id' => $d['line_id'], 'therapy_type_id' => $d['type']['id'],
            'start' => sprintf('%sT%02d:%02d:00', $chosen['date'], intdiv($chosen['s'], 60), $chosen['s'] % 60),
            'end' => sprintf('%sT%02d:%02d:00', $chosen['date'], intdiv($chosen['e'], 60), $chosen['e'] % 60),
            'group_target' => $groupId, 'di_gruppo' => !empty($d['type']['di_gruppo']),
            'professional_id' => $chosen['pro'], 'resource_id' => $chosen['res'], 'motivi' => $motivi,
            'alternative' => array_map(fn ($a) => ['start' => sprintf('%sT%02d:%02d:00', $a['date'], intdiv($a['s'], 60), $a['s'] % 60), 'professional_id' => $a['pro']], $alternatives),
        ];
    }

    /** Aggiunge bonus di contiguità e di equilibrio settimanale e riordina. */
    private function rank(array $cands, array $d): array
    {
        foreach ($cands as &$c) {
            $week = Clock::weekStart($c['date']);
            $inWeek = $d['weeks'][$week] ?? 0;
            $c['score'] += $inWeek >= (int) $d['line']['frequenza_min'] ? 30 : 0;
            $c['contiguous'] = false;
            if(!empty($d['type']['di_gruppo']))foreach($this->busy[$c['date']]??[] as $g)if($g['tipo']==='gruppo'&&($g['type']??null)===$d['type']['id']&&$g['pro']===$c['pro']&&$g['s']===$c['s']) $c['score']+=($g['n']*20-70);
            $nearest = null;
            foreach ($this->busy[$c['date']] ?? [] as $b) {
                if ($this->compact && $b['pro'] === $c['pro'] && $b['tipo'] !== 'nota' && ($b['op_end'] ?? $b['e']) > $b['s']) {
                    $gap = max(0, $b['s'] - $c['op_end'], $c['s'] - ($b['op_end'] ?? $b['e']));
                    $nearest = $nearest === null ? $gap : min($nearest, $gap);
                }
                if (in_array($d['patient_id'], $b['pat'], true)) {
                    if ($d['rules']['contigue'] && ($b['e'] === $c['s'] || $b['s'] === $c['e'])) {
                        $c['score'] -= 50;
                        $c['contiguous'] = true;
                    } elseif ($d['rules']['contigue']) {
                        $c['score'] += 80;
                    }
                }
            }
            if ($this->compact) $c['score'] += min($nearest ?? 240, 240);
        }
        unset($c);
        usort($cands, static fn ($a, $b) => [$a['score'], $a['date'], $a['s'], $a['pro']] <=> [$b['score'], $b['date'], $b['s'], $b['pro']]);
        return $cands;
    }

    private function commit(array &$d, array $c): void
    {
        $group=!empty($d['type']['di_gruppo']);$joined=false;
        $ref=['patient_id'=>$d['patient_id'],'episode_id'=>$d['episode_id'],'line_id'=>$d['line_id'],'stato'=>'programmato'];
        if($group)foreach($this->busy[$c['date']]??[] as $i=>$entry) {
            if($entry['tipo']==='gruppo'&&($entry['type']??null)===$d['type']['id']&&$entry['pro']===$c['pro']&&$entry['s']===$c['s']&&$entry['e']===$c['e']) {
                $this->busy[$c['date']][$i]['n']++;$this->busy[$c['date']][$i]['pat'][]=$d['patient_id'];$this->busy[$c['date']][$i]['refs'][]=$ref;$joined=true;break;
            }
        }
        if(!$joined)$this->busy[$c['date']][] = [
            'op_end'=>PlanningRules::operatorEnd($d['type'],$c['s'],$c['e']),'resources'=>array_values(array_filter(array_merge([$c['res']],$d['type']['risorse_aggiuntive']??[]))),
            'id'=>'nuovo:'.(++$this->seq),'s'=>$c['s'],'e'=>$c['e'],'pro'=>$c['pro'],'res'=>$c['res'],'n'=>1,'pat'=>[$d['patient_id']],
            'ep'=>$d['episode_id'],'line'=>$d['line_id'],'rev'=>0,'start'=>'','tipo'=>$group?'gruppo':'terapia','stato'=>'programmato','cat'=>null,'new'=>true,
            'type'=>$d['type']['id'],'cap'=>$d['type']['capienza']??1,'refs'=>[$ref],
        ];
        $w = Clock::weekStart($c['date']);
        $d['weeks'][$w] = ($d['weeks'][$w] ?? 0) + 1;
    }

    /**
     * Sposta un appuntamento di un altro paziente dentro le sue fasce per liberare la candidata $target.
     * @param list<array> $reserved posizioni già prese da questa operazione
     */

}
