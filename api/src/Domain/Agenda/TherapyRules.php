<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Core\Clock;
use App\Store\Store;
/** Risorse e occupazione dell'operatore, con snapshot per non riscrivere lo storico. */
final class TherapyRules
{
 public static function resources(array $a,Store $s):array
 {
  $t=$s->get('therapy_types',$a['therapy_type_id']??'')??[];
  return array_values(array_unique(array_filter(array_merge([$a['resource_id']??null],$a['resource_ids']??$t['risorse_aggiuntive']??[]))));
 }
 public static function operatorEnd(array $a):?string
 {
  if(($a['impegna_operatore']??true)===true)return $a['end'];
  $min=(int)($a['durata_operatore_minuti']??0);
  return $min>0?min($a['end'],Clock::addMinutes($a['start'],$min)):null;
 }
 public static function operatorOverlap(array $a,array $b):bool
 {
  $ae=self::operatorEnd($a);$be=self::operatorEnd($b);
  return $ae!==null&&$be!==null&&$a['start']<$be&&$b['start']<$ae;
 }
 public static function snapshot(array $type):array
 {
  return ['impegna_operatore'=>$type['impegna_operatore']??true,'durata_operatore_minuti'=>(int)($type['durata_operatore_minuti']??0),'resource_ids'=>$type['risorse_aggiuntive']??[]];
 }
}
