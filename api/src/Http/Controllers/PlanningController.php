<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Core\Clock;
use App\Http\Context;
use App\Support\Validator as V;

final class PlanningController
{
    public function proponi(Context $c): array
    {
        $b = $c->body();
        $ids = array_values(array_unique(array_map('strval', V::arr($b, 'episodi', true))));
        if ($ids === [] || count($ids) > 60) {
            throw new ApiError('episodi_non_validi', 422, ['campo' => 'episodi']);
        }
        foreach ($ids as $id) {
            $e = $c->svc->store->get('episodes', $id) ?? throw ApiError::notFound();
            $c->svc->patients()->assertCanSee($c, $c->svc->store->get('patients', $e['patient_id']) ?? throw ApiError::notFound());
        }
        $r = $c->svc->planner()->propose($ids, V::date($b, 'da') ?? Clock::today(), V::date($b, 'a', true), $c->userId(), ['priorita' => V::str($b, 'priorita', false, 20)]);
        $c->svc->audit()->log('pianificazione.proposta', 'proposals', $r['id'], null, $r['riepilogo']);
        return $this->show($c, $r);
    }

    public function proposta(Context $c): array
    {
        return $this->show($c, $c->svc->store->get('proposals', V::id($c->body(), 'id', 'prp', true)) ?? throw ApiError::notFound());
    }

    public function approva(Context $c): array
    {
        $id = V::id($c->body(), 'id', 'prp', true);
        $r = $c->svc->planner()->approve($id, $c->userId(), $c->body()['selezionate'] ?? null, $c->body()['modifiche'] ?? [], V::bool($c->body(),'approva_spostamenti'));
        $c->svc->audit()->log('pianificazione.approvata', 'proposals', $id, null, $r['riepilogo']);
        return $this->show($c, $r);
    }

    public function scarta(Context $c): array
    {
        $id = V::id($c->body(), 'id', 'prp', true);
        $r = $c->svc->planner()->discard($id, $c->userId());
        $c->svc->audit()->log('pianificazione.scartata', 'proposals', $id);
        return $this->show($c, $r);
    }

    public function fasce(Context $c): array
    {
        $b = $c->body();
        $ep = $c->svc->store->get('episodes', V::id($b, 'episodio', 'epi', true)) ?? throw ApiError::notFound();
        $patient = $c->svc->store->get('patients', $ep['patient_id']) ?? throw ApiError::notFound();
        $c->svc->patients()->assertCanSee($c, $patient);
        $pro = $c->svc->store->get('professionals', V::id($b, 'professionista', 'pro', true)) ?? throw ApiError::notFound();
        $day = V::date($b, 'da', true);
        $hours = $c->svc->hours();
        $slots = ($ep['availability'] ?? []) ?: ($patient['disponibilita'] ?? []);
        $days = [];
        for ($i = 0; $i < 7; $i++, $day = Clock::addDays($day, 1)) {
            $patientWindows = [];
            foreach ($slots as $slot) {
                if ((int)$slot['giorno'] !== Clock::dow($day) || (!empty($slot['valida_dal']) && $day < $slot['valida_dal'])
                    || (!empty($slot['valida_al']) && $day > $slot['valida_al'])) continue;
                $patientWindows[] = [Clock::minutes($slot['da']), Clock::minutes($slot['a'])];
            }
            $days[$day] = ['paziente' => $patientWindows, 'turno' => $hours->professionalWindows($pro, $day)];
        }
        return ['giorni' => $days, 'preferenze_indicate' => (bool)$slots];
    }

    public function disponibilita(Context $c): array
    {
        return $c->svc->aiAssist()->availability((string) V::str($c->body(), 'testo', true, 600));
    }

    public function riepilogo(Context $c): array
    {
        $c->need('agenda.vedi_tutto');
        return $c->svc->aiAssist()->dailySummary(V::date($c->body(), 'data') ?? Clock::today(), V::bool($c->body(), 'rigenera'));
    }

    public function stato(Context $c): array
    {
        return $c->svc->ai()->status();
    }

    private function show(Context $c, array $p): array
    {
        $p['spiegazione'] = $c->svc->aiAssist()->explain($p);
        return $p;
    }
}
