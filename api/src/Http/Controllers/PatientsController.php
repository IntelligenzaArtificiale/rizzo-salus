<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Http\Context;
use App\Support\Validator as V;

final class PatientsController
{
    public function cerca(Context $c): array
    {
        $c->need('pazienti.anagrafica', 'pazienti.essenziali', 'pazienti.tutti');
        $q = V::str($c->body(), 'q', false, 80) ?? '';
        $rows=$c->svc->patients()->search($q, $c, min(50, max(1, V::int($c->body(), 'limite') ?? 20)));
        return ['risultati' => \App\Domain\Patients\PatientSummary::enrich($c,$rows)];
    }

    public function dettaglio(Context $c): array
    {
        $svc = $c->svc;
        $p = $svc->store->get('patients', V::id($c->body(), 'id', 'paz', true)) ?? throw ApiError::notFound();
        $out = $svc->patients()->present($c, $p);
        if ($c->can('pazienti.clinica')) {
            $svc->audit()->read('patients', $p['id']);
        }
        $out['episodi'] = $this->episodes($c, $p['id']);
        return $out;
    }

    public function appuntamenti(Context $c): array
    {
        $id=V::id($c->body(),'id','paz',true);$p=$c->svc->store->get('patients',$id) ?? throw ApiError::notFound();$c->svc->patients()->assertCanSee($c,$p);
        $c->need('agenda.vedi_tutto','agenda.vedi_propria');$rows=[];
        foreach($c->svc->store->all('appointments') as $a){
            if($a['tipo']==='nota'||(!$c->can('agenda.vedi_tutto')&&($a['professional_id']??null)!==($c->user()['professional_id']??'')))continue;
            foreach(array_merge(\App\Domain\Agenda\Appointments::refs($a),$a['cancelled_participants']??[]) as $ref)if($ref['patient_id']===$id){$a['pazienti_nomi']=[$id=>$p['cognome'].' '.$p['nome']];$a['stato_paziente']=$ref['stato'];$rows[]=$a;break;}
        }
        usort($rows,static fn($a,$b)=>strcmp($b['start'],$a['start']));return ['appuntamenti'=>$rows];
    }

    public function salva(Context $c): array
    {
        $c->need('pazienti.anagrafica');
        $b = $c->body();
        $svc = $c->svc;
        $id = V::id($b, 'id', 'paz');
        $force = V::bool($b, 'conferma_duplicato');
        if ($id === null) {
            if (!$c->can('pazienti.tutti') && empty($c->user()['professional_id'])) {
                throw ApiError::forbidden();
            }
            $r = $svc->patients()->create($this->withoutClinicalIfDenied($c, $b), $force);
            if (!$c->can('pazienti.tutti')) {
                $svc->patients()->attachProfessional($r['id'], $c->user()['professional_id']);
                $r = $svc->store->get('patients', $r['id']);
            }
            $svc->audit()->log('paziente.crea', 'patients', $r['id'], null, ['nome' => $r['nome'], 'cognome' => $r['cognome']]);
        } else {
            $cur = $svc->store->get('patients', $id) ?? throw ApiError::notFound();
            if (!$svc->patients()->canEdit($c, $cur)) {
                throw ApiError::forbidden();
            }
            if (!$c->can('pazienti.clinica')) {
                $b['anamnesi'] = $cur['anamnesi'] ?? null;
                $b['allergie'] = $cur['allergie'] ?? null;
            }
            $r = $svc->patients()->update($id, $b, V::int($b, 'revision'), $force);
            $svc->audit()->log('paziente.modifica', 'patients', $id, null, ['nome' => $r['nome'], 'cognome' => $r['cognome']]);
        }
        return $svc->patients()->present($c, $r);
    }

    public function elimina(Context $c): array
    {
        $c->need('pazienti.tutti');
        $id = V::id($c->body(), 'id', 'paz', true);
        $c->svc->store->softDelete('patients', $id);
        $c->svc->audit()->log('paziente.elimina', 'patients', $id);
        return ['eliminato' => true];
    }

    private function withoutClinicalIfDenied(Context $c, array $b): array
    {
        if (!$c->can('pazienti.clinica')) {
            unset($b['anamnesi'], $b['allergie']);
        }
        return $b;
    }

    /** @return list<array<string,mixed>> */
    private function episodes(Context $c, string $patientId): array
    {
        $svc = $c->svc;
        $eps = $svc->store->all('episodes', static fn ($e) => $e['patient_id'] === $patientId);
        usort($eps, static fn ($a, $b) => strcmp($b['data_inizio'], $a['data_inizio']));
        return array_map(fn ($e) => EpisodesController::present($c, $e), $eps);
    }
}
