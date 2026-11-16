<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Http\Context;
use App\Core\{ApiError,Clock};
use App\Support\Validator as V;
/** Appunti non occupanti: stessa agenda, fuori dalla griglia delle terapie. */
final class AgendaNotesController
{
 public function list(Context $c):array
 {
  $c->need('agenda.vedi_tutto','agenda.vedi_propria');$from=V::date($c->body(),'da',true);$to=V::date($c->body(),'a',true);if($to<$from||Clock::diffMinutes($from.'T00:00:00',$to.'T00:00:00')>62*1440)throw new ApiError('intervallo_non_valido',422);
  return ['note'=>array_values(array_filter($c->svc->appointments()->between($from,Clock::addDays($to,1)),fn($a)=>$a['tipo']==='nota'&&($c->can('agenda.vedi_tutto')||($a['professional_id']??null)===($c->user()['professional_id']??'-'))))];
 }
 public function save(Context $c):array
 {
  $c->need('agenda.modifica');$b=$c->body();$start=V::stamp($b,'start',true);$title=V::str($b,'titolo',true,200);
  if(empty($b['id']))$r=$c->svc->agenda()->create(['tipo'=>'nota','start'=>$start,'titolo'=>$title,'nota'=>V::str($b,'nota',false,500),'professional_id'=>V::id($b,'professional_id','pro')]);
  else $r=$c->svc->store->transaction(function()use($c,$b,$start,$title){$r=$c->svc->store->get('appointments',V::id($b,'id','app',true))??throw ApiError::notFound();if($r['tipo']!=='nota')throw ApiError::forbidden();$r=array_replace($r,['start'=>$start,'end'=>Clock::addMinutes($start,15),'titolo'=>$title,'nota'=>V::str($b,'nota',false,500),'stato'=>V::bool($b,'completata')?'annullato':'programmato']);return $c->svc->store->put('appointments',$r,V::int($b,'revision',true));});
  $c->svc->audit()->log('agenda.nota','appointments',$r['id']);return $r;
 }
}
