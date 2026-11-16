<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Services\Services;
/** Promemoria interni per il titolare; rigenerati dai segnali correnti senza invii esterni. */
final class CycleAlerts
{
 public static function list(Services $svc,string $from,string $to):array
 {
  $out=[];
  foreach($svc->agenda()->view($from,$to) as $a){if($a['tipo']==='nota'||in_array($a['stato'],['annullato','assente','eseguito'],true))continue;
   foreach($a['segnali']??[] as $signal){if(!$signal['prima']&&!$signal['ultima'])continue;
    $patient=$svc->store->get('patients',$signal['patient_id'])??[];$type=$svc->store->get('therapy_types',$a['therapy_type_id'])??[];
    $out[]=['id'=>$a['id'].'|'.$signal['patient_id'],'appointment_id'=>$a['id'],'patient_id'=>$signal['patient_id'],'paziente'=>trim(($patient['cognome']??'').' '.($patient['nome']??'')),'terapia'=>$type['nome']??'Prestazione','start'=>$a['start'],'prima'=>$signal['prima'],'ultima'=>$signal['ultima'],'indicazione'=>$signal['prima']&&$signal['ultima']?'Indicazioni iniziali al fisioterapista e consigli finali al paziente':($signal['prima']?'Indicazioni iniziali al fisioterapista':'Consigli finali al paziente')];
   }
  }
  return $out;
 }
}
