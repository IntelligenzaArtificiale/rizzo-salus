<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Core\ApiError;
use App\Store\Store;
final class AgendaHistory
{
 public static function performed(array $a,?string $patient=null):bool
 {
  foreach(Appointments::refs($a) as $ref)if(($patient===null||$patient===$ref['patient_id'])&&$ref['stato']==='eseguito')return true;return false;
 }
 public static function status(Store $store,array $a,string $to,?string $patient):void
 {
  if($to==='eseguito'||!self::performed($a,$patient))return;
  foreach(Appointments::refs($a) as $ref){
   if($ref['stato']!=='eseguito'||($patient!==null&&$ref['patient_id']!==$patient))continue;
   foreach($store->all('invoices',fn($i)=>$i['patient_id']===$ref['patient_id']&&!in_array($i['stato'],['bozza','annullata'],true)) as $i)foreach($i['righe'] as $l)if(($l['appointment_id']??null)===$a['id'])throw new ApiError('prestazione_gia_fatturata',409);
   foreach($store->all('compensations',fn($c)=>$c['stato']!=='calcolato') as $c)foreach($c['righe'] as $l)if($l['appointment_id']===$a['id']&&$l['patient_id']===$ref['patient_id'])throw new ApiError('compenso_bloccato',409);
  }
 }
}
