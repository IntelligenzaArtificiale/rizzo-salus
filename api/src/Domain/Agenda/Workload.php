<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Core\Clock;
/** Conta persone e prestazioni separatamente dai minuti dell'operatore, unendo gli intervalli. */
final class Workload
{
 public static function summarize(array $appointments,string $pro):array
 {
  $planned=[];$performed=[];$patients=[];$services=0;$slots=0;
  foreach($appointments as $a){
   if(($a['professional_id']??null)!==$pro||$a['tipo']==='nota'||$a['stato']==='annullato')continue;
   $refs=array_filter(Appointments::refs($a),fn($r)=>in_array($r['stato'],Appointments::LIVE,true));if(!$refs)continue;$slots++;
   $end=TherapyRules::operatorEnd($a);$done=false;
   foreach($refs as $r)if($r['stato']==='eseguito'){$patients[$r['patient_id']]=true;$services++;$done=true;}
   if($end!==null){$planned[]=[$a['start'],$end];if($done)$performed[]=[$a['start'],$end];}
  }
  return ['appuntamenti'=>$slots,'pazienti_trattati'=>count($patients),'prestazioni_eseguite'=>$services,'minuti_programmati'=>self::minutes($planned),'minuti_eseguiti'=>self::minutes($performed)];
 }
 private static function minutes(array $ranges):int
 {
  usort($ranges,fn($a,$b)=>strcmp($a[0],$b[0]));$end=null;$total=0;
  foreach($ranges as [$s,$e]){if($end!==null&&$s<$end)$s=$end;if($s<$e)$total+=Clock::diffMinutes($s,$e);if($end===null||$e>$end)$end=$e;}return $total;
 }
}
