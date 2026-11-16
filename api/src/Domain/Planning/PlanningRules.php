<?php
declare(strict_types=1);
namespace App\Domain\Planning;
use App\Domain\Agenda\{GroupLimits,TherapyRules};
use App\Domain\Calendar\Hours;
use App\Store\Store;
use App\Core\Clock;
/** Vincoli aggiunti al motore: gruppi clinici, risorse e preferenze operative. */
final class PlanningRules
{
 public static function canJoin(Store $s,array $b,array $d):bool
 {
  $refs=array_merge($b['refs']??[],[['patient_id'=>$d['patient_id'],'episode_id'=>$d['episode_id'],'stato'=>'programmato']]);
  return GroupLimits::inspect($s,$refs,(int)$d['type']['capienza'])['conflitti']===[];
 }
 public static function operatorEnd(array $type,int $start,int $end):int
 {
  return ($type['impegna_operatore']??true)?$end:min($end,$start+(int)($type['durata_operatore_minuti']??0));
 }
 public static function resources(Store $store,Hours $hours,array $c,array $d,array $entries,array $ignore):array
 {
  $ids=array_values(array_unique(array_filter(array_merge([$c['res']],$d['type']['risorse_aggiuntive']??[]))));$blocked=[];
  foreach($ids as $id){
   $r=$store->get('resources',$id);if(!$r||empty($r['attivo'])||!Hours::fits($hours->resourceWindows($r,$c['date']),$c['s'],$c['e']))return ['*'];
   foreach($r['fermi']??[] as $f)if($c['date']>=$f['da']&&$c['date']<=$f['a'])return ['*'];
   $ranges=[];$idsBlocked=[];
   foreach($entries as $b){
    if(isset($ignore[$b['id']])||$c['s']>=$b['e']||$b['s']>=$c['e']||!in_array($id,$b['resources']??[$b['res']],true))continue;
    $join=!empty($d['type']['di_gruppo'])&&$b['tipo']==='gruppo'&&$b['pro']===$c['pro']&&($b['type']??null)===$d['type']['id']&&$b['s']===$c['s']&&$b['e']===$c['e'];
    $ranges[]=[$b['s'],$b['e'],$r['tipo']==='apparecchio'?($join?0:1):$b['n']];$idsBlocked[]=$b['id'];
   }
   if(\App\Domain\Agenda\CapacityPeak::count($c['s'],$c['e'],1,$ranges)>(int)$r['capienza'])$blocked=array_merge($blocked,$idsBlocked?:['*']);
  }
  return array_values(array_unique($blocked));
 }
 public static function preference(array $pro,string $category,int $from,int $to):int
 {
  $bonus=0;foreach($pro['preferenze_assegnazione']??[] as $p)if($p['categoria']===$category&&$from>=Clock::minutes($p['da'])&&$to<=Clock::minutes($p['a']))$bonus=max($bonus,(int)$p['peso']);return $bonus;
 }
}
