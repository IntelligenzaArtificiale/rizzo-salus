<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Core\Clock;
use App\Http\Context;
use App\Support\Validator as V;

/** Messaggi: registro, coda, modelli, promemoria, variazioni. */
final class CommsController
{
    public function messaggi(Context $c): array
    {
        $b = $c->body();
        $status = V::str($b, 'stato', false, 20);
        $pid = V::id($b, 'paziente_id', 'paz');
        $rows = $c->svc->store->all('messages', static fn ($m) => ($status === null || $m['status'] === $status) && ($pid === null || ($m['patient_id'] ?? null) === $pid));
        usort($rows, static fn ($a, $b) => strcmp($b['created_at'], $a['created_at']));
        $names = [];
        foreach (array_slice($rows, 0, 100) as &$m) {
            if (!empty($m['patient_id'])) {
                $names[$m['patient_id']] ??= (($p = $c->svc->store->get('patients', $m['patient_id'], false)) ? $p['cognome'] . ' ' . $p['nome'] : '—');
                $m['paziente'] = $names[$m['patient_id']];
            }
            $out[] = $m;
        }
        return ['messaggi' => $out ?? [], 'totale' => count($rows), 'modalita' => $c->svc->settings()->get('messaggi.modalita', 'test')];
    }

    public function elabora(Context $c): array
    {
        return $c->svc->gateway()->process();
    }

    public function approva(Context $c): array
    {
        return $c->svc->gateway()->approve(V::id($c->body(), 'id', 'msg', true));
    }

    public function annulla(Context $c): array
    {
        return $c->svc->gateway()->cancel(V::id($c->body(), 'id', 'msg', true));
    }

    public function riprova(Context $c): array
    {
        return $c->svc->gateway()->retry(V::id($c->body(), 'id', 'msg', true));
    }

    public function modelli(Context $c): array
    {
        return ['modelli' => $c->svc->templates()->all()];
    }

    public function modelloSalva(Context $c): array
    {
        $r = $c->svc->templates()->save($c->body());
        $c->svc->audit()->log('modello_messaggio.salva', 'message_templates', $r['id']);
        return $r;
    }

    public function anteprima(Context $c): array
    {
        return $c->svc->gateway()->preview(V::str($c->body(), 'chiave', true, 40));
    }

    public function invioProva(Context $c): array
    {
        $b = $c->body();
        return $c->svc->gateway()->sendTest(V::enum($b, 'canale', ['whatsapp', 'sms', 'email'], true), V::str($b, 'chiave', true, 40));
    }

    public function promemoriaEsegui(Context $c): array
    {
        $b = $c->body();
        $week = V::date($b, 'settimana');
        $r = $week ? $c->svc->weeklyReminder()->forWeek(\App\Core\Clock::weekStart($week)) : $c->svc->weeklyReminder()->run();
        $c->svc->audit()->log('promemoria.esegui', 'messages', null, null, $r);
        return $r;
    }

    public function revocaLink(Context $c): array
    {
        return ['revocati' => $c->svc->weeklyReminder()->revoke(V::id($c->body(), 'paziente_id', 'paz', true))];
    }

    public function variazioni(Context $c): array
    {
        $c->svc->variations()->flush();
        return ['variazioni' => $c->svc->variations()->open()];
    }

    public function variazioniApprova(Context $c): array
    {
        return ['inviati' => $c->svc->variations()->approve(array_map('strval', V::arr($c->body(), 'ids', true)))];
    }

    public function variazioneScarta(Context $c): array
    {
        return $c->svc->variations()->discard(V::id($c->body(), 'id', 'var', true));
    }

    public function variazioneSpunta(Context $c): array
    {
        return $c->svc->variations()->markDone(V::id($c->body(), 'id', 'var', true));
    }

    public function variazioneModalita(Context $c): array
    {
        return $c->svc->variations()->setMode(V::id($c->body(), 'id', 'var', true), (string) V::str($c->body(), 'modalita', true, 12));
    }

    /** Pagina pubblica del promemoria. */
    public function settimanaPubblica(Context $c): array
    {
        return $c->svc->weeklyReminder()->publicView((string) V::str($c->body(), 'token', true, 80));
    }
}
