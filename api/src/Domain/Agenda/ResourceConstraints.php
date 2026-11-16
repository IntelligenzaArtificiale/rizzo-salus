<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Domain\Calendar\Hours;
use App\Core\Clock;
use App\Store\Store;
/** Verifica contemporanea di sala e attrezzature; nessun bypass per risorsa mancante o inattiva. */
final class ResourceConstraints
{
 public static function check(Store $store,Hours $hours,array $a,array $near,?string $ignore):array
 {
  $conflicts=[];$warnings=[];$date=substr($a['start'],0,10);$s=Clock::minutes($a['start']);$e=$s+Clock::diffMinutes($a['start'],$a['end']);
  foreach(TherapyRules::resources($a,$store) as $id){
   $r=$store->get('resources',$id);
   if(!$r||empty($r['attivo'])){$conflicts[]=['codice'=>'risorsa_non_disponibile'];continue;}
   foreach($r['fermi']??[] as $f)if($date>=$f['da']&&$date<=$f['a'])$conflicts[]=['codice'=>'risorsa_ferma','risorsa'=>$r['nome']];
   if(!Hours::fits($hours->resourceWindows($r,$date),$s,$e))$warnings[]=['codice'=>'fuori_orario_risorsa','risorsa'=>$r['nome']];
   $people=fn($x)=>max(1,count(array_filter(Appointments::refs($x),fn($v)=>!in_array($v['stato'],['assente','annullato'],true))));
   $own=$r['tipo']==='apparecchio'?1:$people($a);$ranges=[];
   foreach($near as $other)if(($other['id']??null)!==$ignore&&$other['tipo']!=='nota'&&!in_array($other['stato'],['assente','annullato'],true)&&Checker::overlap($a,$other)&&in_array($id,TherapyRules::resources($other,$store),true))$ranges[]=[Clock::diffMinutes($date.'T00:00:00',$other['start']),Clock::diffMinutes($date.'T00:00:00',$other['end']),$r['tipo']==='apparecchio'?1:$people($other)];
   $used=CapacityPeak::count($s,$e,$own,$ranges);
   if($used>(int)$r['capienza'])$conflicts[]=['codice'=>$r['capienza']>1?'risorsa_piena':'risorsa_occupata','risorsa'=>$r['nome']];
  }
  return ['conflitti'=>$conflicts,'avvisi'=>$warnings];
 }
}
