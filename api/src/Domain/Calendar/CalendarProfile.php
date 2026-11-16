<?php
declare(strict_types=1);
namespace App\Domain\Calendar;
use App\Core\ApiError;
use App\Services\Services;
/** Import idempotente delle sole regole confermate dal PDF 10/11, senza riscrivere appuntamenti o tariffe. */
final class CalendarProfile
{
 public const HOURS=['1'=>[['08:30','12:30'],['16:00','20:00']],'2'=>[['08:30','12:30'],['16:00','18:30']],'3'=>[['08:30','12:30'],['15:30','20:00']],'4'=>[['08:30','12:30'],['15:30','20:00']],'5'=>[['08:00','12:30']],'6'=>[],'7'=>[]];
 public function __construct(private readonly Services $svc){}
 public function apply():array
 {
  return $this->svc->store->transaction(function(){
   if($this->svc->settings()->get('agenda.profilo_specifiche')==='2026-11-10')return ['gia_applicato'=>true];
   $catalog=$this->svc->catalog();$pros=[];
   foreach(['Marco','Chiara','Antonio'] as $name){
    $matches=$this->svc->store->all('professionals',fn($p)=>mb_strtolower($p['nome'])===mb_strtolower($name));
    if(count($matches)>1)throw new ApiError('professionista_da_associare',409,['nome'=>$name]);
    $p=$matches[0]??['nome'=>$name,'cognome'=>'','tipo'=>$name==='Antonio'?'medico':'fisioterapista','specialita'=>$name==='Antonio'?['Fisiatria']:[]];
    $p['orari']=$name==='Marco'?null:($name==='Chiara'?[]:['1'=>[['08:30','11:00'],['16:00','19:00']],'2'=>[['08:30','11:00']],'3'=>[['08:30','11:00'],['16:00','19:00']],'4'=>[['08:30','11:00'],['16:00','19:00']],'5'=>[]]);
    $p['preferenze_assegnazione']=$name==='Antonio'?[]:[['categoria'=>'piscina_gruppo','da'=>$name==='Chiara'?'08:00':'12:30','a'=>$name==='Chiara'?'12:45':'20:30','peso'=>80]];
    if($name==='Antonio')$p['titolare']=true;$pros[$name]=$catalog->saveProfessional($p)['id'];
   }
   $resources=[];
   foreach([['Palestra','palestra',5],['Piscina','piscina',5],['Tecar','apparecchio',1],['Laser','apparecchio',1],['Onde d’urto','apparecchio',1],['Camera iperbarica','apparecchio',1],['Pompa diamagnetica','apparecchio',1],['Tesla QR','apparecchio',1],['Kinetrac','apparecchio',1]] as [$name,$kind,$capacity]){
    $current=[];foreach($this->svc->store->all('resources') as $v)if($v['nome']===$name)$current=$v;
    $resources[$name]=$catalog->saveResource(array_replace($current,['nome'=>$name,'tipo'=>$kind,'capienza'=>$capacity]))['id'];
   }
   $items=[['Terapia manuale','manuale',30,'TS',null,true],['Linfodrenaggio','manuale',45,'TS',null,true],['Tecarterapia','strumentale',15,'TS','Tecar',true],['Pompa diamagnetica (assistita)','strumentale',15,'TS','Pompa diamagnetica',true],['Onde d’urto','strumentale',15,'TS','Onde d’urto',true],['Laserterapia','strumentale',15,'TS','Laser',true],['Camera iperbarica','strumentale',60,'TSF','Camera iperbarica',false],['Pompa diamagnetica (non assistita)','strumentale',15,'TSF','Pompa diamagnetica',false],['Tesla QR','strumentale',15,'TSF','Tesla QR',false],['Kinetrac','strumentale',15,'TSF','Kinetrac',false],['Rieducazione motoria','palestra_gruppo',60,'palestra','Palestra',true],['Idrokinesiterapia','piscina_gruppo',60,'piscina','Piscina',true]];
   foreach($items as [$name,$cat,$duration,$family,$resource,$operator]){
    $cur=[];foreach($this->svc->store->all('therapy_types') as $t)if($t['nome']===$name)$cur=$t;
    $params=['nome'=>$name,'categoria'=>$cat,'durata_min'=>$duration,'famiglia'=>$family,'impegna_operatore'=>$operator,'capienza'=>5,'risorsa_id'=>$resource?$resources[$resource]:null];
    if($name==='Pompa diamagnetica (non assistita)')$params['attivo']=false;
    $saved=$catalog->saveTherapyType(array_replace($cur,$params));if(!$cur){$saved['tariffa_da_confermare']=true;$this->svc->store->put('therapy_types',$saved);}
   }
   $this->svc->settings()->update(['orari'=>self::HOURS,'agenda'=>['profilo_specifiche'=>'2026-11-10','professionisti_riabilitazione'=>array_values($pros),'gruppi'=>['max_standard'=>5,'max_complesso'=>4,'max_neurologici'=>1]]]);
   $this->svc->audit()->log('calendar.profilo_applicato','settings',null);return ['professionisti'=>$pros,'terapie'=>count($items),'orari'=>self::HOURS];
  });
 }
}
