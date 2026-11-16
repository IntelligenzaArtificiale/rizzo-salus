<?php
declare(strict_types=1);

namespace App\Domain\Agenda;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Patients\Episodes;
use App\Domain\Patients\Patients;
use App\Store\Store;
use App\Support\Validator as V;

/**
 * Operazioni sull'agenda: crea, sposta, annulla, segna eseguita/assente, gruppi, sostituzioni.
 * Ogni operazione è una transazione: controlli, salvataggio, ricalcolo delle righe e notifica agli ascoltatori
 * (le variazioni da comunicare al paziente) avvengono insieme o non avvengono.
 */
final class Agenda
{
    /** @var list<callable(string,?array,?array):void> */
    private array $listeners = [];

    public function __construct(
        private readonly Store $store,
        private readonly Appointments $appointments,
        private readonly Checker $checker,
        private readonly Patients $patients,
        private readonly Episodes $episodes,
    ) {
    }

    /** @param callable(string,?array,?array):void $fn evento, prima, dopo */
    public function listen(callable $fn): void
    {
        $this->listeners[] = $fn;
    }

    private function emit(string $event, ?array $before, ?array $after): void
    {
        foreach ($this->listeners as $l) {
            $l($event, $before, $after);
        }
    }

    // ------------------------------------------------------------ creazione

    /** @param array<string,mixed> $in */
    public function create(array $in, bool $confirmWarnings = false, string $origin = 'manuale'): array
    {
        return $this->store->transaction(function () use ($in, $confirmWarnings, $origin) {
            $a = $this->build($in, $origin);
            $this->guard($a, null, $confirmWarnings);
            $saved = $this->store->put('appointments', $a);
            $this->afterWrite(null, $saved);
            $this->emit('creato', null, $saved);
            return $saved;
        });
    }

    private function build(array $in,string $origin):array {return (new AppointmentBuilder($this->store,$this->appointments))->build($in,$origin);}
    private function participant(array $p,?string $type=null):array {return (new AppointmentBuilder($this->store,$this->appointments))->participant($p,$type);}

    private function assertLine(string $pid,?string $ep,?string $line,?string $type):void {(new AppointmentBuilder($this->store,$this->appointments))->assertLine($pid,$ep,$line,$type);}

    /** @throws ApiError conflitto | avvisi */
    private function guard(array $a, ?string $ignoreId, bool $confirmWarnings): void
    {
        $r = $this->checker->check($a, $ignoreId);
        if ($r['conflitti'] !== []) {
            throw ApiError::conflict('conflitto', ['conflitti' => $r['conflitti'], 'avvisi' => $r['avvisi']]);
        }
        if ($r['avvisi'] !== [] && !$confirmWarnings) {
            throw ApiError::conflict('avvisi', ['avvisi' => $r['avvisi']]);
        }
    }

    // ------------------------------------------------------------ spostamento

    /** @param array<string,mixed> $to start, professional_id?, resource_id? */
    public function move(string $id, array $to, ?int $revision, bool $confirmWarnings = false): array
    {
        return $this->store->transaction(function () use ($id, $to, $revision, $confirmWarnings) {
            $cur = $this->store->get('appointments', $id) ?? throw ApiError::notFound();
            if ($cur['stato'] === 'annullato') {
                throw new ApiError('appuntamento_annullato', 409);
            }
            if (AgendaHistory::performed($cur) && $cur['tipo'] !== 'nota') {
                throw new ApiError('seduta_gia_eseguita', 409);
            }
            $duration = Clock::diffMinutes($cur['start'], $cur['end']);
            $start = V::stamp($to, 'start', true);
            $new = array_replace($cur, [
                'start' => $start, 'end' => Clock::addMinutes($start, $duration),
                'professional_id' => V::id($to, 'professional_id', 'pro') ?? $cur['professional_id'] ?? null,
                'resource_id' => array_key_exists('resource_id', $to) ? V::id($to, 'resource_id', 'ris') : ($cur['resource_id'] ?? null),
            ]);
            if ($new['start'] === $cur['start'] && ($new['professional_id'] ?? null) === ($cur['professional_id'] ?? null) && ($new['resource_id'] ?? null) === ($cur['resource_id'] ?? null)) {
                return $cur;
            }
            if (!empty($new['professional_id'])) {
                $pro=$this->store->get('professionals', $new['professional_id']) ?? throw new ApiError('professionista_non_trovato', 422);
                if(empty($pro['attivo'])||!in_array($pro['tipo'],['medico','fisioterapista'],true))throw new ApiError('professionista_non_disponibile',422);
            }
            $new['version'] = (int) $cur['version'] + 1;
            $this->guard($new, $id, $confirmWarnings);
            $saved = $this->store->put('appointments', $new, $revision);
            $this->afterWrite($cur, $saved);
            $this->emit('spostato', $cur, $saved);
            return $saved;
        });
    }

    /** Sostituzione del terapista su un appuntamento: le ore passano al sostituto, resta la traccia. */
    public function substitute(string $id, string $professionalId, ?string $reason): array
    {
        return $this->store->transaction(function () use ($id, $professionalId, $reason) {
            $cur = $this->store->get('appointments', $id) ?? throw ApiError::notFound();
            if(AgendaHistory::performed($cur))throw new ApiError('seduta_gia_eseguita',409);
            $this->store->get('professionals', $professionalId) ?? throw new ApiError('professionista_non_trovato', 422);
            $new = array_replace($cur, [
                'professional_id' => $professionalId,
                'sostituzione' => ['da' => $cur['professional_id'], 'a' => $professionalId, 'motivo' => $reason, 'quando' => Clock::stamp()],
                'version' => (int) $cur['version'] + 1,
            ]);
            $this->guard($new, $id, true);
            $saved = $this->store->put('appointments', $new);
            $this->afterWrite($cur, $saved);
            $this->emit('modificato', $cur, $saved);
            return $saved;
        });
    }

    // ------------------------------------------------------------ stato

    /** Segna una seduta eseguita, assente, confermata o di nuovo programmata. Per i gruppi serve il paziente (o null = tutti). */
    public function setStatus(string $id, string $status, ?string $patientId = null): array
    {
        if (!in_array($status, ['programmato', 'confermato', 'eseguito', 'assente'], true)) {
            throw new ApiError('stato_non_valido', 422);
        }
        return $this->store->transaction(function () use ($id, $status, $patientId) {
            $cur = $this->store->get('appointments', $id) ?? throw ApiError::notFound();
            if ($cur['stato'] === 'annullato' || $cur['tipo'] === 'nota') {
                throw new ApiError('appuntamento_non_modificabile', 409);
            }
            AgendaHistory::status($this->store,$cur,$status,$patientId);
            $new = $cur;
            if ($cur['tipo'] === 'gruppo') {
                $hit = 0;
                foreach ($new['participants'] as $i => $p) {
                    if ($patientId === null || $p['patient_id'] === $patientId) {
                        $new['participants'][$i]['stato'] = $status;
                        $hit++;
                    }
                }
                if ($hit === 0) {
                    throw ApiError::notFound('partecipante_non_trovato');
                }
                $states = array_unique(array_column($new['participants'], 'stato'));
                $new['stato'] = count($states) === 1 ? $states[0] : 'programmato';
            } else {
                $new['stato'] = $status;
            }
            if ($status === 'eseguito' && $new['start'] > Clock::stamp(Clock::now()->modify('+1 day'))) {
                throw new ApiError('seduta_nel_futuro', 409);
            }
            $saved = $this->store->put('appointments', $new);
            $this->afterWrite($cur, $saved);
            $this->syncAbsences($cur, $saved);
            $this->emit('stato', $cur, $saved);
            return $saved;
        });
    }

    private function syncAbsences(array $before, array $after): void
    {
        $count = static function (array $a): array {
            $c = [];
            foreach (Appointments::refs($a) as $r) {
                $c[$r['patient_id']] = ($c[$r['patient_id']] ?? 0) + ($r['stato'] === 'assente' ? 1 : 0);
            }
            return $c;
        };
        $b = $count($before);
        $a = $count($after);
        foreach ($a as $pid => $n) {
            $delta = $n - ($b[$pid] ?? 0);
            if ($delta !== 0 && ($p = $this->store->get('patients', $pid, false)) !== null) {
                $p['assenze'] = max(0, (int) ($p['assenze'] ?? 0) + $delta);
                $this->store->put('patients', $p);
            }
        }
    }

    // ------------------------------------------------------------ annullamento e ripristino

    /**
     * Annulla un appuntamento. Per i gruppi: con $patientId toglie solo quel partecipante, senza annulla l'intero gruppo.
     * $scope 'occorrenza' = solo questa; 'future' = questa e tutte le successive dello stesso gruppo.
     */
    public function cancel(string $id, ?string $patientId = null, string $scope = 'occorrenza'): array
    {
        return $this->store->transaction(function () use ($id, $patientId, $scope) {
            $cur = $this->store->get('appointments', $id) ?? throw ApiError::notFound();
            if (AgendaHistory::performed($cur,$patientId)) {
                throw new ApiError('seduta_gia_eseguita', 409);
            }
            $targets = [$cur];
            if ($cur['tipo'] === 'gruppo' && $scope === 'future' && !empty($cur['group_id'])) {
                $targets = $this->store->all('appointments', static fn ($a) => ($a['group_id'] ?? null) === $cur['group_id'] && $a['start'] >= $cur['start'] && $a['stato'] !== 'annullato');
                $this->closeGroupFrom($cur['group_id'], $patientId, substr($cur['start'], 0, 10));
            }
            $out = [];
            foreach ($targets as $t) {
                $out[] = $this->cancelOne($t, $patientId);
            }
            return $out[0];
        });
    }

    private function cancelOne(array $cur, ?string $patientId): array
    {
        if(AgendaHistory::performed($cur,$patientId))throw new ApiError('seduta_gia_eseguita',409);
        $new = $cur;
        if ($cur['tipo'] === 'gruppo' && $patientId !== null) {
            foreach($new['participants'] as $p)if($p['patient_id']===$patientId)$new['cancelled_participants'][]=array_replace($p,['stato'=>'annullato','annullato_at'=>Clock::stamp()]);
            $before = count($new['participants']);
            $new['participants'] = array_values(array_filter($new['participants'], static fn ($p) => $p['patient_id'] !== $patientId));
            if (count($new['participants']) === $before) {
                throw ApiError::notFound('partecipante_non_trovato');
            }
            $new['version'] = (int) $cur['version'] + 1;
            $event = 'partecipante_tolto';
        } else {
            $new['stato'] = 'annullato';
            $new['annullato_il'] = Clock::stamp();
            $new['version'] = (int) $cur['version'] + 1;
            $event = 'annullato';
        }
        $saved = $this->store->put('appointments', $new);
        $this->afterWrite($cur, $saved);
        $this->emit($event, $cur, $saved);
        return $saved;
    }

    public function restore(string $id, bool $confirmWarnings = false): array
    {
        return $this->store->transaction(function () use ($id, $confirmWarnings) {
            $cur = $this->store->get('appointments', $id) ?? throw ApiError::notFound();
            if ($cur['stato'] !== 'annullato') {
                return $cur;
            }
            $new = array_replace($cur, ['stato' => 'programmato', 'annullato_il' => null, 'version' => (int) $cur['version'] + 1]);
            $this->guard($new, $id, $confirmWarnings);
            $saved = $this->store->put('appointments', $new);
            $this->afterWrite($cur, $saved);
            $this->emit('ripristinato', $cur, $saved);
            return $saved;
        });
    }

    // ------------------------------------------------------------ gruppi

    public function saveGroup(array $d): array
    {
        return $this->store->transaction(function () use ($d) {
            $id = V::id($d, 'id', 'grp');
            $tt = $this->store->get('therapy_types', V::id($d, 'therapy_type_id', 'ter', true)) ?? throw new ApiError('terapia_non_trovata', 422);
            if (empty($tt['di_gruppo'])) {
                throw new ApiError('terapia_non_di_gruppo', 422);
            }
            $slots = [];
            foreach (V::arr($d, 'slot', true) as $s) {
                $s = (array) $s;
                $slots[] = ['giorno' => V::int($s, 'giorno', true, 1, 7), 'ora' => V::time($s, 'ora', true)];
            }
            $rec = [
                'nome' => V::str($d, 'nome', true, 80), 'therapy_type_id' => $tt['id'], 'professional_id' => V::id($d, 'professional_id', 'pro', true),
                'resource_id' => V::id($d, 'resource_id', 'ris') ?? $tt['risorsa_id'], 'capienza' => V::int($d, 'capienza', false, 2, 50) ?? (int) $tt['capienza'],
                'slot' => $slots, 'attivo' => V::bool($d, 'attivo', true),
            ];
            $cur = $id ? ($this->store->get('groups', $id) ?? throw ApiError::notFound()) : ['partecipanti' => []];
            return $this->store->put('groups', array_replace($cur, $rec), V::int($d, 'revision'));
        });
    }

    /** Aggiunge un partecipante al gruppo: da questa occorrenza in poi ($scope 'future') o solo a questa. */
    public function addToGroup(string $appointmentId, array $participant, string $scope, bool $confirmWarnings = false): array
    {
        return $this->store->transaction(function () use ($appointmentId, $participant, $scope, $confirmWarnings) {
            $cur = $this->store->get('appointments', $appointmentId) ?? throw ApiError::notFound();
            if ($cur['tipo'] !== 'gruppo') {
                throw new ApiError('non_e_un_gruppo', 422);
            }
            $p = $this->participant($participant, $cur['therapy_type_id']);
            $targets = [$cur];
            if ($scope === 'future' && !empty($cur['group_id'])) {
                $targets = $this->store->all('appointments', static fn ($a) => $a['group_id'] === $cur['group_id'] && $a['start'] >= $cur['start'] && $a['stato'] === 'programmato');
                $g = $this->store->get('groups', $cur['group_id']);
                if ($g !== null) {
                    $g['partecipanti'][] = $p + ['ingresso' => substr($cur['start'], 0, 10), 'uscita' => null];
                    $this->store->put('groups', $g);
                }
            }
            usort($targets,static fn($a,$b)=>strcmp($a['start'],$b['start']));
            $first = null;
            foreach ($targets as $t) {
                if (in_array($p['patient_id'], array_column($t['participants'], 'patient_id'), true)) {
                    continue;
                }
                try{$this->assertLine($p['patient_id'],$p['episode_id'],$p['line_id'],$cur['therapy_type_id']);}catch(ApiError $e){if($scope==='future'&&$e->errorCode==='sedute_esaurite')break;throw $e;}
                $new = $t;
                $new['participants'][] = $p;
                $new['version'] = (int) $t['version'] + 1;
                $this->guard($new, $t['id'], $confirmWarnings);
                $saved = $this->store->put('appointments', $new);
                $this->afterWrite($t, $saved);
                $this->emit('partecipante_aggiunto', $t, $saved);
                $first ??= $saved;
            }
            return $first ?? $cur;
        });
    }

    private function closeGroupFrom(string $groupId, ?string $patientId, string $date): void
    {
        $g = $this->store->get('groups', $groupId);
        if ($g === null) {
            return;
        }
        if ($patientId === null) {
            $g['attivo'] = false;
            $g['chiuso_il'] = $date;
        } else {
            foreach ($g['partecipanti'] as $i => $p) {
                if ($p['patient_id'] === $patientId && empty($p['uscita'])) {
                    $g['partecipanti'][$i]['uscita'] = $date;
                }
            }
        }
        $this->store->put('groups', $g);
    }

    /** Prima/ultima seduta impostate a mano (valgono accanto al calcolo automatico). */
    public function setManualFlag(string $id, string $flag, bool $value, ?string $patientId = null): array
    {
        if (!in_array($flag, ['prima_manuale', 'ultima_manuale'], true)) {
            throw new ApiError('indicatore_non_valido', 422);
        }
        return $this->store->transaction(function () use ($id, $flag, $value, $patientId) {
            $cur = $this->store->get('appointments', $id) ?? throw ApiError::notFound();
            $new = $cur;
            if ($cur['tipo'] === 'gruppo') {
                foreach ($new['participants'] as $i => $p) {
                    if ($p['patient_id'] === $patientId) {
                        $new['participants'][$i][$flag] = $value;
                    }
                }
            } else {
                $new[$flag] = $value;
            }
            return $this->store->put('appointments', $new);
        });
    }

    // ------------------------------------------------------------ comuni

    private function afterWrite(?array $before, array $after): void
    {
        if ($after['tipo'] === 'nota') {
            return;
        }
        $patients = array_unique(array_merge(array_column(Appointments::refs($after), 'patient_id'), $before ? array_column(Appointments::refs($before), 'patient_id') : []));
        foreach ($patients as $pid) {
            $this->patients->attachProfessional($pid, $after['professional_id'] ?? null);
        }
        $eps = [];
        foreach (array_merge($before ? Appointments::refs($before) : [], Appointments::refs($after)) as $r) {
            if ($r['episode_id']) {
                $eps[$r['episode_id']] = true;
            }
        }
        foreach (array_keys($eps) as $ep) {
            $this->episodes->refreshLines($ep);
        }
    }

    /**
     * Vista per l'agenda: appuntamenti dell'intervallo con prima/ultima seduta calcolate.
     * @param array{professional_id?:?string,resource_id?:?string,categoria?:?string} $filters
     * @return list<array<string,mixed>>
     */
    public function view(string $from,string $toExclusive,array $filters=[],bool $withCancelled=false):array {return (new AgendaView($this->store,$this->appointments))->view($from,$toExclusive,$filters,$withCancelled);}
}
