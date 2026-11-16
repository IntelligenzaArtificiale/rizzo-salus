<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\ApiError;
use App\Core\Clock;
use App\Services\Settings;
use App\Store\Store;

/**
 * Comunicazione dei cambi di agenda ai pazienti già avvisati.
 *  - automatica: il messaggio parte da solo; con controllo: va in «Da inviare» e lo rivede la segreteria; manuale: «da comunicare», si spunta dopo la telefonata.
 *  - Più modifiche vicine nel tempo si raccolgono in un solo messaggio (attesa configurabile, 10 minuti).
 *  - Non si avvisa di un cambio che riporta allo stato già comunicato.
 */
final class Variations
{
    private const HORIZON_DAYS = 28;

    public function __construct(
        private readonly Store $store,
        private readonly Settings $settings,
        private readonly MessageGateway $gateway,
        private readonly Notified $notified,
        private readonly Lines $lines,
    ) {
    }

    /** Ascolta l'agenda: chiamato a ogni evento dentro la stessa transazione. */
    public function onEvent(string $event, ?array $before, ?array $after): void
    {
        if (!in_array($event, ['creato', 'spostato', 'modificato', 'annullato', 'ripristinato', 'partecipante_aggiunto', 'partecipante_tolto'], true)) {
            return;   // «eseguito» e «assente» non sono variazioni di agenda
        }
        $a = $after ?? $before;
        if ($a === null || ($a['tipo'] ?? '') === 'nota' || $a['start'] < Clock::stamp() || substr($a['start'], 0, 10) > Clock::addDays(Clock::today(), self::HORIZON_DAYS)) {
            return;
        }
        $people = array_unique(array_merge(
            array_column(Notified::people($a), 'patient_id'),
            $before ? array_column(Notified::people($before), 'patient_id') : [],
        ));
        foreach ($people as $pid) {
            if ($this->wasCommunicated($a, $pid) || $this->notified->get($a['id'], $pid) !== null) {
                $this->collect($pid, $a['id']);
            }
        }
    }

    /** Il paziente ha già ricevuto il promemoria della settimana di questo appuntamento? */
    private function wasCommunicated(array $a, string $patientId): bool
    {
        $key = WeeklyReminder::key($patientId, \App\Core\Clock::weekStart(substr($a['start'], 0, 10)));
        foreach ($this->store->all('messages', static fn ($m) => ($m['idempotency_key'] ?? null) === $key) as $m) {
            return !in_array($m['status'], ['errore', 'annullato'], true);
        }
        return false;
    }

    private function collect(string $patientId, string $appointmentId): void
    {
        $open = null;
        foreach ($this->store->all('changes', static fn ($c) => $c['patient_id'] === $patientId && $c['stato'] === 'raccolta') as $c) {
            $open = $c;
        }
        if ($open === null) {
            $this->store->put('changes', ['patient_id' => $patientId, 'appointment_ids' => [$appointmentId], 'stato' => 'raccolta', 'primo_at' => Clock::stamp(), 'ultimo_at' => Clock::stamp(), 'modalita' => null, 'righe' => [], 'message_id' => null]);
            return;
        }
        $open['appointment_ids'] = array_values(array_unique(array_merge($open['appointment_ids'], [$appointmentId])));
        $open['ultimo_at'] = Clock::stamp();
        $this->store->put('changes', $open);
    }

    /** Cambia la modalità solo per questo gruppo di modifiche. */
    public function setMode(string $changeId, string $mode): array
    {
        if (!in_array($mode, ['automatica', 'controllo', 'manuale'], true)) {
            throw new ApiError('modalita_non_valida', 422);
        }
        return $this->store->transaction(function () use ($changeId, $mode) {
            $c = $this->store->get('changes', $changeId) ?? throw ApiError::notFound();
            if ($c['stato'] !== 'raccolta') {
                throw new ApiError('variazione_gia_gestita', 409);
            }
            return $this->store->put('changes', array_replace($c, ['modalita' => $mode]));
        });
    }

    /** Chiude le raccolte scadute: confronta con quanto già comunicato e decide che cosa fare. @return array{inviate:int,da_rivedere:int,da_comunicare:int,nulle:int} */
    public function flush(): array
    {
        $wait = (int) $this->settings->get('messaggi.variazioni.attesa_minuti', 10);
        $limit = Clock::addMinutes(Clock::stamp(), -$wait);
        $res = ['inviate' => 0, 'da_rivedere' => 0, 'da_comunicare' => 0, 'nulle' => 0];
        foreach ($this->store->all('changes', static fn ($c) => $c['stato'] === 'raccolta' && $c['ultimo_at'] <= $limit) as $c) {
            $k = $this->close($c);
            $res[$k]++;
        }
        return $res;
    }

    /** @return 'inviate'|'da_rivedere'|'da_comunicare'|'nulle' */
    private function close(array $c): string
    {
        return $this->store->transaction(function () use ($c) {
            $c = $this->store->get('changes', $c['id']) ?? $c;
            if ($c['stato'] !== 'raccolta') {
                return 'nulle';
            }
            $patient = $this->store->get('patients', $c['patient_id'], false);
            $rows = [];
            $items = [];
            foreach ($c['appointment_ids'] as $id) {
                $a = $this->store->get('appointments', $id, false);
                if ($a === null) {
                    continue;
                }
                $still = in_array($c['patient_id'], array_column(Notified::people($a), 'patient_id'), true);
                $note = $this->notified->get($id, $c['patient_id']);
                $cancelled = $a['stato'] === 'annullato' || !$still;
                if ($note === null) {
                    if (!$cancelled) {
                        $rows[] = 'Nuovo: ' . $this->lines->line($a);
                        $items[] = $id;
                    }
                    continue;
                }
                $probe = $cancelled ? array_replace($a, ['stato' => 'annullato']) : $a;
                if (Notified::same($note, $probe)) {
                    continue;
                }
                if ($cancelled) {
                    $rows[] = 'Annullato: ' . self::oldLine($note, $this->lines, $a);
                } elseif ($note['stato']['start'] === $a['start']) {
                    $rows[] = 'Stesso orario (' . Lines::when($a['start']) . ', ' . $this->lines->typeName($a) . '), cambia il terapista';
                } else {
                    $rows[] = 'Spostato: ora ' . $this->lines->line($a) . ' (prima: ' . Lines::when($note['stato']['start']) . ')';
                }
                $items[] = $id;
            }
            if ($rows === [] || $patient === null) {
                $this->store->put('changes', array_replace($c, ['stato' => 'nulla', 'chiuso_at' => Clock::stamp(), 'righe' => []]));
                return 'nulle';
            }
            $mode = 'manuale'; // Decisione call: telefonata obbligatoria prima del riepilogo.
            $base = array_replace($c, ['righe' => $rows, 'appointment_ids' => $items, 'chiuso_at' => Clock::stamp()]);
            if ($mode === 'manuale') {
                $this->store->put('changes', array_replace($base, ['stato' => 'da_comunicare', 'modalita' => $mode]));
                return 'da_comunicare';
            }
            $msg = $this->gateway->enqueue($patient, 'variazione', ['elenco_variazioni' => implode("\n", $rows)], 'variazione:' . $c['id'],
                ['paziente_id' => $patient['id'], 'bozza' => $mode === 'controllo']);
            if ($msg['status'] === 'errore') {   // nessun canale utile: resta da comunicare a mano
                $this->store->put('changes', array_replace($base, ['stato' => 'da_comunicare', 'modalita' => $mode, 'message_id' => $msg['id'], 'nota' => $msg['error']]));
                return 'da_comunicare';
            }
            if ($mode === 'controllo') {
                $this->store->put('changes', array_replace($base, ['stato' => 'da_inviare', 'modalita' => $mode, 'message_id' => $msg['id']]));
                return 'da_rivedere';
            }
            $this->store->put('changes', array_replace($base, ['stato' => 'inviata', 'modalita' => $mode, 'message_id' => $msg['id']]));
            $this->applyNotified($base['appointment_ids'], $c['patient_id'], 'variazione');
            return 'inviate';
        });
    }

    private static function oldLine(array $note, Lines $lines, array $a): string
    {
        return Lines::when($note['stato']['start']) . ' — ' . $lines->typeName($a);
    }

    /** @param list<string> $ids */
    private function applyNotified(array $ids, string $patientId, string $via): void
    {
        foreach ($ids as $id) {
            if (($a = $this->store->get('appointments', $id, false)) !== null) {
                $this->notified->mark($a, $patientId, $via);
            }
        }
    }

    /** La segreteria ha rivisto e approva (anche più messaggi insieme). @param list<string> $changeIds @return int quanti ne sono partiti */
    public function approve(array $changeIds): int
    {
        $n = 0;
        foreach ($changeIds as $id) {
            $this->store->transaction(function () use ($id, &$n) {
                $c = $this->store->get('changes', $id) ?? throw ApiError::notFound();
                if ($c['stato'] !== 'da_inviare') {
                    return;
                }
                if(empty($c['telefonata_at']))throw new ApiError('telefonata_richiesta',422);
                $this->gateway->approve($c['message_id']);
                $this->applyNotified($c['appointment_ids'], $c['patient_id'], 'variazione');
                $this->store->put('changes', array_replace($c, ['stato' => 'inviata', 'inviata_at' => Clock::stamp()]));
                $n++;
            });
        }
        return $n;
    }

    /** Scarta il messaggio: nulla viene comunicato e lo stato «comunicato» non cambia. */
    public function discard(string $changeId): array
    {
        return $this->store->transaction(function () use ($changeId) {
            $c = $this->store->get('changes', $changeId) ?? throw ApiError::notFound();
            if (!in_array($c['stato'], ['da_inviare', 'da_comunicare'], true)) {
                throw new ApiError('variazione_gia_gestita', 409);
            }
            if ($c['message_id']) {
                $m = $this->store->get('messages', $c['message_id']);
                if ($m !== null && in_array($m['status'], ['bozza', 'errore'], true)) {
                    $this->gateway->cancel($m['id']);
                }
            }
            return $this->store->put('changes', array_replace($c, ['stato' => 'scartata']));
        });
    }

    /** «Ho chiamato»: lo stato attuale diventa quello comunicato. */
    public function markDone(string $changeId): array
    {
        return $this->store->transaction(function () use ($changeId) {
            $c = $this->store->get('changes', $changeId) ?? throw ApiError::notFound();
            if (!in_array($c['stato'], ['da_comunicare','da_inviare'],true)) {
                throw new ApiError('variazione_gia_gestita', 409);
            }
            $this->applyNotified($c['appointment_ids'], $c['patient_id'], 'telefonata');
            $patient=$this->store->get('patients',$c['patient_id']);
            if (!(new \App\Domain\Patients\Documents(new \App\Services\Services($this->store)))->releaseAllowed($c['patient_id'])) throw new ApiError('consensi_mancanti',422);
            $msg=$this->gateway->enqueue($patient,'variazione',['elenco_variazioni'=>implode("\n",$c['righe'])],'telefonata-riepilogo:'.$c['id'],['paziente_id'=>$patient['id'],'canale'=>'sms']);
            if($msg['status']==='errore') throw new ApiError('canale_non_configurato',422);
            $c['riepilogo_message_id']=$msg['id'];
            if ($c['message_id'] && ($m = $this->store->get('messages', $c['message_id'])) !== null && in_array($m['status'], ['bozza', 'errore'], true)) {
                $this->gateway->cancel($m['id']);
            }
            return $this->store->put('changes', array_replace($c, ['stato' => 'comunicata', 'comunicata_at' => Clock::stamp()]));
        });
    }

    /** Elenchi per la segreteria. @return list<array<string,mixed>> */
    public function open(): array
    {
        $rows = $this->store->all('changes', static fn ($c) => in_array($c['stato'], ['raccolta', 'da_inviare', 'da_comunicare'], true));
        usort($rows, static fn ($a, $b) => strcmp($a['ultimo_at'], $b['ultimo_at']));
        foreach ($rows as &$r) {
            $p = $this->store->get('patients', $r['patient_id'], false);
            $r['paziente'] = $p ? trim($p['cognome'] . ' ' . $p['nome']) : '—';
            $r['telefono'] = $p['telefono'] ?? null;
            if ($r['message_id'] && ($m = $this->store->get('messages', $r['message_id'])) !== null) {
                $r['anteprima'] = $m['body'];
            }
        }
        return $rows;
    }
}
