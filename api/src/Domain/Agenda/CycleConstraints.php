<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Core\Clock;
use App\Store\Store;
/** Stessi vincoli anche per creazione manuale, modifica proposta e copia, non soltanto nel pianificatore. */
final class CycleConstraints
{
 public static function check(Store $store,array $candidate,?string $ignore,array $extra=[]):array
 {
  $out=[];$date=substr($candidate['start'],0,10);$week=Clock::weekStart($date);
  foreach(Appointments::refs($candidate) as $ref){
   if(empty($ref['episode_id'])||empty($ref['line_id'])||!in_array($ref['stato'],Appointments::LIVE,true))continue;
   $e=$store->get('episodes',$ref['episode_id']);$line=null;foreach($e['therapies']??[] as $l)if($l['line_id']===$ref['line_id'])$line=$l;
   if(!$line)continue;$total=0;$weekly=0;$daily=0;$min=(int)($line['intervallo_min_giorni']??0);$blocked=[];
   foreach(array_merge($store->all('appointments'),$extra) as $a){
    if(($a['id']??null)===$ignore||$a['stato']==='annullato'||$a['tipo']==='nota')continue;
    $dt=substr($a['start'],0,10);
    foreach(Appointments::refs($a) as $r){
     if($r['patient_id']!==$ref['patient_id']||!in_array($r['stato'],Appointments::LIVE,true))continue;
     if($dt===$date)$daily++;
     if($r['episode_id']!==$ref['episode_id']||$r['line_id']!==$ref['line_id'])continue;
     $total++;if(Clock::weekStart($dt)===$week)$weekly++;
     $gap=abs(strtotime($dt)-strtotime($date))/86400;
     if($min>0&&$gap<$min)$blocked['intervallo_minimo_non_rispettato']=true;
     if(!empty($e['vincoli']['no_giorni_consecutivi'])&&$gap==1)$blocked['giorni_consecutivi_non_ammessi']=true;
    }
   }
   if($total>=(int)$line['sedute_previste'])$blocked['sedute_esaurite']=true;
   if($weekly>=(int)$line['frequenza_max'])$blocked['frequenza_settimanale_superata']=true;
   if(!empty($e['vincoli']['max_al_giorno'])&&$daily>=(int)$e['vincoli']['max_al_giorno'])$blocked['massimo_giornaliero_superato']=true;
   foreach(array_keys($blocked) as $code)$out[]=['codice'=>$code,'paziente'=>$ref['patient_id']];
  }
  return $out;
 }
}
