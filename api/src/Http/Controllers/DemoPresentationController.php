<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\{ApiError,Clock,Env};
use App\Http\Context;
/** Esempi aggiuntivi richiesti per la presentazione: mai reset o sovrascrittura di appuntamenti. */
final class DemoPresentationController
{
    public function prepare(Context $c): array
    {
        if ($c->role()!=='titolare'||Env::get('APP_ENV')!=='demo') throw ApiError::forbidden();
        $svc=$c->svc;$added=[];
        if (!empty($c->body()['abilita_formazione'])) {
            $roles=$svc->settings()->get('ruoli');unset($roles['titolare']);$changed=false;
            foreach (['medico','fisioterapista'] as $role) { if (!in_array('ai.assistente',$roles[$role]??[],true)) $changed=true; $roles[$role]=array_values(array_unique(array_merge($roles[$role]??[],['ai.assistente']))); }
            if ($changed) { $svc->settings()->update(['ruoli'=>$roles]);$svc->audit()->log('demo.formazione_abilitata','settings','ruoli'); }
        }
        if (!$svc->store->all('training_documents')) {
            $svc->store->put('training_documents',['titolo'=>'Esempio · Spostamento appuntamenti',
                'testo'=>"Procedura dimostrativa da confermare con il titolare. Per cambiare un appuntamento, il medico o il fisioterapista segnala la richiesta alla segreteria. La segreteria contatta il paziente, concorda il nuovo orario e aggiorna l’agenda dopo aver controllato disponibilità e risorse. Solo dopo la conferma telefonica si prepara il riepilogo al paziente, con il servizio messaggi se attivato. Le modifiche dell’agenda sono riservate al titolare e alla segreteria.",
                'ruoli'=>['segreteria','medico','fisioterapista','amministrazione'],'attivo'=>true,'aggiornato'=>Clock::stamp()]);
        }
        $patients=[];
        foreach ([['Elena','Marini'],['Luca','Serra'],['Sofia','Conti'],['Paolo','Greco']] as [$first,$last]) {
            $found=$svc->store->all('patients',fn($p)=>($p['note_amministrative']??'')==='Esempio gruppo presentazione'&&$p['nome']===$first&&$p['cognome']===$last);
            $patients[]= $found[0]??$svc->patients()->create(['nome'=>$first,'cognome'=>$last,'note_amministrative'=>'Esempio gruppo presentazione']);
        }
        foreach (['palestra_gruppo','piscina_gruppo'] as $category) {
            $types=$svc->store->all('therapy_types',fn($t)=>$t['categoria']===$category&&!empty($t['attivo']));
            if (!$types) continue;$t=$types[0];$existing=$svc->appointments()->between(Clock::weekStart(Clock::today()),Clock::addDays(Clock::weekStart(Clock::today()),7));
            foreach ($existing as $a) if (($a['nota']??'')==='Gruppo dimostrativo presentazione'&&($a['therapy_type_id']??null)===$t['id']) { $added[]=$a['id'];continue 2; }
            foreach (range(0,4) as $offset) {
                $day=Clock::addDays(Clock::weekStart(Clock::today()),$offset);
                foreach ($svc->store->all('professionals',fn($p)=>$p['tipo']==='fisioterapista'&&!empty($p['attivo'])) as $pro) {
                    foreach ($svc->hours()->professionalWindows($pro,$day) as [$from,$to]) {
                        for ($m=$from;$m+60<=$to;$m+=60) {
                            $start=$day.'T'.sprintf('%02d:%02d:00',intdiv($m,60),$m%60);
                            try {
                                $row=$svc->agenda()->create(['tipo'=>'gruppo','professional_id'=>$pro['id'],'therapy_type_id'=>$t['id'],'start'=>$start,'durata_min'=>60,
                                    'participants'=>array_map(fn($p)=>['patient_id'=>$p['id']],array_slice($patients,$category==='palestra_gruppo'?0:1,3)),
                                    'nota'=>'Gruppo dimostrativo presentazione'],false,'manuale');
                                $added[]=$row['id'];continue 5;
                            } catch (ApiError $e) {
                                if (!in_array($e->errorCode,['conflitto','professionista_occupato','paziente_occupato','risorsa_occupata','fuori_orario','risorsa_piena'],true)) continue;
                            }
                        }
                    }
                }
            }
        }
        $svc->audit()->log('demo.esempi_agenda','appointments',null,null,['gruppi'=>$added]);
        return ['gruppi'=>$added,'numero'=>count($added)];
    }
}
