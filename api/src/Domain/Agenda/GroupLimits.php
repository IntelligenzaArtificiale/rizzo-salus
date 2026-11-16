<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Store\Store;
use App\Services\Settings;
/** Limiti organizzativi del documento: 5 standard, 4 complessi, un solo neurologico. */
final class GroupLimits
{
 public static function inspect(Store $s,array $refs,int $capacity):array
 {
  $cfg=(new Settings($s))->get('agenda.gruppi',[]);$neuro=0;$complex=0;$seen=[];
  foreach($refs as $r){
   if(in_array($r['stato']??'programmato',['assente','annullato'],true))continue;
   if(isset($seen[$r['patient_id']]))return ['capienza'=>0,'conflitti'=>[['codice'=>'paziente_duplicato_gruppo']]];
   $seen[$r['patient_id']]=true;$ep=$s->get('episodes',$r['episode_id']??'')??[];
   $kind=$ep['profilo_gruppo']??'standard';$neuro+=(int)($kind==='neurologico');$complex+=(int)in_array($kind,['neurologico','complesso'],true);
  }
  $limit=min($capacity,(int)($cfg['max_standard']??5),$complex>0?(int)($cfg['max_complesso']??4):PHP_INT_MAX);$out=[];
  if(count($seen)>$limit)$out[]=['codice'=>'gruppo_pieno','capienza'=>$limit];
  if($neuro>(int)($cfg['max_neurologici']??1))$out[]=['codice'=>'limite_neurologici_gruppo','massimo'=>(int)($cfg['max_neurologici']??1)];
  return ['capienza'=>$limit,'neurologici'=>$neuro,'complessi'=>$complex,'conflitti'=>$out];
 }
}
