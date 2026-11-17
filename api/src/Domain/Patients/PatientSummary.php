<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\Clock;
use App\Domain\Agenda\Appointments;
use App\Http\Context;
/** Riepiloghi della directory, senza diagnosi o informazioni fuori dal perimetro del ruolo. */
final class PatientSummary
{
    public static function enrich(Context $c,array $rows): array
    {
        $summary=[];
        foreach ($rows as $p) $summary[$p['id']]=['percorsi_attivi'=>0,'prossimo'=>null];
        foreach ($c->svc->store->all('episodes') as $e) {
            if (isset($summary[$e['patient_id']]) && ($e['stato']??'')==='aperto') $summary[$e['patient_id']]['percorsi_attivi']++;
        }
        $all=$c->can('agenda.vedi_tutto');$mine=$c->user()['professional_id']??null;
        if ($all||$c->can('agenda.vedi_propria')) foreach ($c->svc->appointments()->between(Clock::today(),Clock::addDays(Clock::today(),90)) as $a) {
            if ((!$all&&($a['professional_id']??null)!==$mine)||$a['tipo']==='nota'||in_array($a['stato'],['eseguito','assente','annullato'],true)) continue;
            if ($a['start']<Clock::stamp()) continue;
            foreach (Appointments::refs($a) as $ref) {
                $pid=$ref['patient_id'];
                if (!isset($summary[$pid])||in_array($ref['stato'],['assente','annullato','eseguito'],true)) continue;
                if (!$summary[$pid]['prossimo']||$a['start']<$summary[$pid]['prossimo']['start']) {
                    $t=$c->svc->store->get('therapy_types',$a['therapy_type_id']??'');
                    $summary[$pid]['prossimo']=['start'=>$a['start'],'prestazione'=>$t['nome']??'Appuntamento'];
                }
            }
        }
        return array_map(fn($p)=>$p+['riepilogo'=>$summary[$p['id']]],$rows);
    }
}
