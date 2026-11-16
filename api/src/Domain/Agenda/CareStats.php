<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Store\Store;
/** Conteggi per paziente e famiglia: una seduta di gruppo vale una presenza per ogni partecipante. */
final class CareStats
{
 public static function summarize(Store $store,array $appointments):array
 {
  $families=[];$patients=[];
  foreach($appointments as $a){
   if($a['tipo']==='nota')continue;$t=$store->get('therapy_types',$a['therapy_type_id']);$family=$t['famiglia']??'altro';
   foreach(array_merge(Appointments::refs($a),$a['cancelled_participants']??[]) as $r){
    $state=$a['stato']==='annullato'?'annullato':$r['stato'];$field=match($state){'eseguito'=>'eseguite','assente'=>'assenze','annullato'=>'cancellazioni',default=>'programmate'};
    $families[$family]??=['famiglia'=>$family,'eseguite'=>0,'assenze'=>0,'cancellazioni'=>0,'programmate'=>0];$families[$family][$field]++;
    $id=$r['patient_id'];if(!isset($patients[$id])){$p=$store->get('patients',$id);$patients[$id]=['patient_id'=>$id,'nome'=>($p['cognome']??'').' '.($p['nome']??''),'eseguite'=>0,'assenze'=>0,'cancellazioni'=>0,'programmate'=>0];}$patients[$id][$field]++;
   }
  }
  return ['famiglie'=>array_values($families),'pazienti'=>array_values($patients)];
 }
}
