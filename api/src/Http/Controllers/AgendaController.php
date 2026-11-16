<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Core\Clock;
use App\Http\Context;
use App\Support\Validator as V;

final class AgendaController
{
    /** Agenda di un intervallo. Chi ha solo «agenda propria» vede soltanto i suoi appuntamenti. */
    public function vista(Context $c): array
    {
        $c->need('agenda.vedi_tutto', 'agenda.vedi_propria');
        $b = $c->body();
        $from = V::date($b, 'da', true);
        $to = V::date($b, 'a', true);
        if ($to < $from || Clock::diffMinutes($from . 'T00:00:00', $to . 'T00:00:00') > 62 * 1440) {
            throw new ApiError('intervallo_non_valido', 422);
        }
        $filters = ['professional_id' => V::id($b, 'professional_id', 'pro'), 'resource_id' => V::id($b, 'resource_id', 'ris'), 'categoria' => V::str($b, 'categoria', false, 30)];
        if (!$c->can('agenda.vedi_tutto')) {
            $own = $c->user()['professional_id'] ?? null;
            if ($own === null) {
                throw ApiError::forbidden();
            }
            $filters['professional_id'] = $own;
        }
        $rows = $c->svc->agenda()->view($from, Clock::addDays($to, 1), $filters, V::bool($b, 'annullati'));
        return ['appuntamenti' => $this->decorate($c, $rows)];
    }

    public function crea(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $r = $c->svc->agenda()->create($b, V::bool($b, 'conferma_avvisi'));
        $c->svc->audit()->log('agenda.crea', 'appointments', $r['id'], null, ['start' => $r['start'], 'tipo' => $r['tipo']]);
        return $this->one($c, $r);
    }

    public function sposta(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $id = V::id($b, 'id', 'app', true);
        $r = $c->svc->agenda()->move($id, $b, V::int($b, 'revision'), V::bool($b, 'conferma_avvisi'));
        $c->svc->audit()->log('agenda.sposta', 'appointments', $id, null, ['start' => $r['start']]);
        return $this->one($c, $r);
    }

    public function sostituisci(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $id = V::id($b, 'id', 'app', true);
        $r = $c->svc->agenda()->substitute($id, V::id($b, 'professional_id', 'pro', true), V::str($b, 'motivo', false, 200));
        $c->svc->audit()->log('agenda.sostituisci', 'appointments', $id, null, ['professional_id' => $r['professional_id']]);
        return $this->one($c, $r);
    }

    /** Eseguita / assente: è consentito anche a chi segna le proprie sedute, ma solo sulle proprie. */
    public function stato(Context $c): array
    {
        $c->need('agenda.modifica', 'agenda.segna_eseguita');
        $b = $c->body();
        $id = V::id($b, 'id', 'app', true);
        $cur = $c->svc->store->get('appointments', $id) ?? throw ApiError::notFound();
        if (!$c->can('agenda.modifica') && ($cur['professional_id'] ?? null) !== ($c->user()['professional_id'] ?? '-')) {
            throw ApiError::forbidden();
        }
        $r = $c->svc->agenda()->setStatus($id, V::enum($b, 'stato', ['programmato', 'confermato', 'eseguito', 'assente'], true), V::id($b, 'patient_id', 'paz'));
        $c->svc->audit()->log('agenda.stato', 'appointments', $id, null, ['stato' => $r['stato']]);
        return $this->one($c, $r);
    }

    public function annulla(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $id = V::id($b, 'id', 'app', true);
        $r = $c->svc->agenda()->cancel($id, V::id($b, 'patient_id', 'paz'), V::enum($b, 'ambito', ['occorrenza', 'future'], false, 'occorrenza'));
        $c->svc->audit()->log('agenda.annulla', 'appointments', $id);
        return $this->one($c, $r);
    }

    public function ripristina(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $id = V::id($b, 'id', 'app', true);
        $r = $c->svc->agenda()->restore($id, V::bool($b, 'conferma_avvisi'));
        $c->svc->audit()->log('agenda.ripristina', 'appointments', $id);
        return $this->one($c, $r);
    }

    public function aggiungiAlGruppo(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $id = V::id($b, 'id', 'app', true);
        $r = $c->svc->agenda()->addToGroup($id, (array) ($b['partecipante'] ?? []), V::enum($b, 'ambito', ['occorrenza', 'future'], false, 'occorrenza'), V::bool($b, 'conferma_avvisi'));
        $c->svc->audit()->log('agenda.gruppo_aggiungi', 'appointments', $id);
        return $this->one($c, $r);
    }

    public function segnale(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $id = V::id($b, 'id', 'app', true);
        $r = $c->svc->agenda()->setManualFlag($id, V::enum($b, 'segnale', ['prima', 'ultima'], true).'_manuale', V::bool($b, 'valore', true), V::id($b, 'patient_id', 'paz'));
        return $this->one($c, $r);
    }

    public function copiaAnteprima(Context $c): array
    {
        $c->need('agenda.modifica');
        return $c->svc->copyWeek()->preview(V::date($c->body(), 'settimana', true), $this->copyOptions($c->body()));
    }

    public function copiaApplica(Context $c): array
    {
        $c->need('agenda.modifica');
        $b = $c->body();
        $r = $c->svc->copyWeek()->apply(V::date($b, 'settimana', true), $this->copyOptions($b));
        $c->svc->audit()->log('agenda.copia_settimana', 'appointments', null, null, ['settimana' => $b['settimana'], 'creati' => $r['creati']]);
        return $r;
    }

    public function proposteSpostamento(Context $c):array {$c->need('agenda.modifica');$b=$c->body();return (new \App\Domain\Agenda\MoveSuggestions($c->svc))->propose(V::id($b,'id','app',true),V::date($b,'da',true),V::date($b,'a',true));}

    public function avvisiCiclo(Context $c):array {$c->need('agenda.vedi_tutto');$b=$c->body();$from=V::date($b,'da',true);$to=V::date($b,'a',true);if($to<$from||\App\Core\Clock::diffMinutes($from.'T00:00:00',$to.'T00:00:00')>62*1440)throw new ApiError('intervallo_non_valido',422);return ['avvisi'=>\App\Domain\Agenda\CycleAlerts::list($c->svc,$from,Clock::addDays($to,1))];}

    public function statistiche(Context $c): array
    {
        $c->need('agenda.vedi_tutto');
        $b = $c->body();
        $from = V::date($b, 'da', true);
        $to = V::date($b, 'a', true);
        if ($to < $from || Clock::diffMinutes($from.'T00:00:00',$to.'T00:00:00')>366*1440) {
            throw new ApiError('intervallo_non_valido', 422);
        }
        return $c->svc->agendaStats()->period($from, $to);
    }

    private function copyOptions(array $b): array
    {
        return (isset($b['selezionati']) ? ['selezionati'=>array_values(array_filter(V::arr($b,'selezionati'),static fn($id)=>is_string($id)&&preg_match('/^app_[a-z0-9]+$/',$id)))] : []) + ['includi_visite' => V::bool($b, 'includi_visite'), 'includi_note' => V::bool($b, 'includi_note'),
            'escludi' => array_values(array_filter(array_map('strval', V::arr($b, 'escludi')), static fn ($k) => preg_match('/^[a-z0-9_]+\|[a-z0-9_]+$/', $k) === 1))];
    }

    private function one(Context $c, array $a): array
    {
        return $this->decorate($c, $c->svc->agenda()->view(substr($a['start'], 0, 10), Clock::addDays(substr($a['start'], 0, 10), 1), [], true), $a['id'])[0] ?? $a;
    }

    /** Aggiunge il nome dei pazienti (l'agenda deve mostrarli); filtra per id se richiesto. */
    private function decorate(Context $c, array $rows, ?string $only = null): array
    {
        $names = [];
        $out = [];
        foreach ($rows as $a) {
            if ($only !== null && $a['id'] !== $only) {
                continue;
            }
            $mine = [];
            foreach (\App\Domain\Agenda\Appointments::refs($a) as $r) {
                $pid = $r['patient_id'];
                if (!isset($names[$pid])) {
                    $p = $c->svc->store->get('patients', $pid, false);
                    $names[$pid] = $p ? trim($p['cognome'] . ' ' . $p['nome']) : '—';
                }
                $mine[$pid] = $names[$pid];
            }
            $a['pazienti_nomi'] = $mine;
            $out[] = $a;
        }
        return $out;
    }
}
