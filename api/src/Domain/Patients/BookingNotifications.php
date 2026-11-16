<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\Clock;
use App\Services\Services;
final class BookingNotifications
{
 public static function agenda(Services $s,string $event,?array $before,?array $after):void
 {
  if(!$before||($before['tipo']??'')!=='visita'||$before['start']<Clock::stamp()||!in_array($event,['annullato','spostato'],true))return;
  if($event==='spostato'&&$before['start']===($after['start']??null)&&$before['professional_id']===($after['professional_id']??null))return;
  $s->store->put('notifications',['tipo'=>'slot_liberato','stato'=>'aperta','titolo'=>'Si è liberato uno spazio per una visita','start'=>$before['start'],'therapy_type_id'=>$before['therapy_type_id'],'professional_id'=>$before['professional_id'],'appointment_id'=>$before['id']]);
 }
 public static function candidates(Services $s,array $notification,array $waiting):array
 {
  $type=$notification['therapy_type_id']??null;$pro=$notification['professional_id']??null;
  if(!empty($notification['window_id'])){$w=$s->store->get('booking_windows',$notification['window_id']);$type=$w['therapy_type_id']??null;$pro=$w['professional_id']??$pro;}
  if(!$type)return [];
  return array_values(array_filter($waiting,fn($w)=>$w['stato']==='in_attesa'&&$w['therapy_type_id']===$type&&(empty($w['professional_id'])||$w['professional_id']===$pro)));
 }
}
