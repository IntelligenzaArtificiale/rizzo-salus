<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Services\Services;
use App\Core\{ApiError,Clock};
use App\Domain\Calendar\Hours;
/** Alternative di spostamento separate dall'inserimento: sola lettura e controlli su tutti i partecipanti. */
final class MoveSuggestions
{
 public function __construct(private readonly Services $svc){}
 public function propose(string $id,string $from,string $to):array
 {
  if($to<$from||Clock::diffMinutes($from.'T00:00:00',$to.'T00:00:00')>31*1440)throw new ApiError('intervallo_non_valido',422);
  $a=$this->svc->store->get('appointments',$id)??throw ApiError::notFound();
  if($a['tipo']==='nota'||!in_array($a['stato'],['programmato','confermato'],true)||AgendaHistory::performed($a))throw new ApiError('appuntamento_non_modificabile',409);
  $duration=Clock::diffMinutes($a['start'],$a['end']);$slots=[];
  for($day=max($from,Clock::today());$day<=$to;$day=Clock::addDays($day,1)){
   foreach($this->svc->hours()->structureWindows($day) as [$s,$e])for($m=(int)(ceil($s/15)*15);$m+$duration<=$e;$m+=15){
    $start=$day.'T'.Hours::hhmm($m).':00';if($start<=Clock::stamp()||$start===$a['start'])continue;
    $new=array_replace($a,['start'=>$start,'end'=>Clock::addMinutes($start,$duration)]);$check=$this->svc->checker()->check($new,$id);
    if(!$check['conflitti']&&!$check['avvisi'])$slots[]=['start'=>$start,'end'=>$new['end']];
    if(count($slots)>=20)break 3;
   }
  }
  return ['id'=>$id,'revision'=>$a['revision'],'start_attuale'=>$a['start'],'alternative'=>$slots];
 }
}
