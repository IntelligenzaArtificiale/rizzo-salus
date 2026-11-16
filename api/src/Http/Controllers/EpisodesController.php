<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Core\Clock;
use App\Http\Context;
use App\Support\Validator as V;

final class EpisodesController
{
    /** Toglie i campi clinici a chi non ne ha diritto e aggiunge l'avanzamento per riga. */
    public static function present(Context $c, array $e): array
    {
        if (!$c->can('pazienti.clinica')) {
            unset($e['diagnosi']);
        }
        if (!$c->can('pazienti.note_terapeutiche')) {
            unset($e['note_terapeutiche'],$e['diario']);
        }
        $e['avanzamento'] = $c->svc->episodes()->progress($e);
        return $e;
    }

    public function dettaglio(Context $c): array
    {
        $e = $this->load($c, V::id($c->body(), 'id', 'epi', true));
        return self::present($c, $e);
    }

    public function salva(Context $c): array
    {
        $c->need('pazienti.anagrafica', 'pazienti.clinica');
        $b = $c->body();
        $svc = $c->svc;
        $id = V::id($b, 'id', 'epi');
        $patient = $svc->store->get('patients', V::id($b, 'patient_id', 'paz', true)) ?? throw ApiError::notFound();
        $svc->patients()->assertCanSee($c, $patient);
        if ($id !== null) {
            $cur = $this->load($c, $id);
            if (!$c->can('pazienti.clinica')) {
                $b['diagnosi'] = $cur['diagnosi'] ?? null;
            }
            if (!$c->can('pazienti.note_terapeutiche')) {
                $b['note_terapeutiche'] = $cur['note_terapeutiche'] ?? null;
            }
        } else {
            if (!$c->can('pazienti.clinica')) {
                unset($b['diagnosi']);
            }
            if (!$c->can('pazienti.note_terapeutiche')) {
                unset($b['note_terapeutiche']);
            }
        }
        $r = $svc->episodes()->save($b, $id, V::int($b, 'revision'));
        $svc->audit()->log($id ? 'percorso.modifica' : 'percorso.crea', 'episodes', $r['id'], null, ['patient_id' => $r['patient_id'], 'titolo' => $r['titolo']]);
        return self::present($c, $r);
    }

    public function notaSalva(Context $c): array
    {
        $c->need('pazienti.note_terapeutiche');$b=$c->body();$id=V::id($b,'id','epi',true);$this->load($c,$id);
        return $c->svc->store->transaction(function()use($c,$b,$id){
            $e=$this->load($c,$id);$key=V::str($b,'chiave',true,80);
            foreach($e['diario']??[] as $n)if($n['chiave']===$key)return self::present($c,$e);
            $e['diario'][]=['chiave'=>$key,'testo'=>V::str($b,'testo',true,4000),'at'=>Clock::stamp(),'autore'=>$c->userId(),'nome_autore'=>$c->user()['nome'].' '.$c->user()['cognome']];
            $e=$c->svc->store->put('episodes',$e,V::int($b,'revision'));$c->svc->audit()->log('percorso.nota','episodes',$id,null,['chiave'=>$key]);return self::present($c,$e);
        });
    }

    public function stato(Context $c): array
    {
        $c->need('pazienti.anagrafica', 'pazienti.clinica');
        $id = V::id($c->body(), 'id', 'epi', true);
        $this->load($c, $id);
        $r = $c->svc->episodes()->setState($id, V::enum($c->body(), 'stato', ['aperto', 'sospeso', 'concluso'], true));
        $c->svc->audit()->log('percorso.stato', 'episodes', $id, null, ['stato' => $r['stato']]);
        return self::present($c, $r);
    }

    /** Sedute in eccedenza rispetto a quelle previste, da proporre al paziente come prosecuzione. */
    public function eccedenze(Context $c): array
    {
        return ['eccedenze' => $c->svc->episodes()->surplus($this->load($c, V::id($c->body(), 'id', 'epi', true)))];
    }

    private function load(Context $c, string $id): array
    {
        $e = $c->svc->store->get('episodes', $id) ?? throw ApiError::notFound();
        $p = $c->svc->store->get('patients', $e['patient_id']) ?? throw ApiError::notFound();
        $c->svc->patients()->assertCanSee($c, $p);
        return $e;
    }
}
