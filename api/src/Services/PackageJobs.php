<?php
declare(strict_types=1);
namespace App\Services;
use App\Auth\Permissions;
use App\Core\Clock;
use App\Domain\Management\ReviewExports;
use App\Http\{Context,Request,Session};
final class PackageJobs
{
 public static function register(Scheduler $scheduler,Services $svc):void
 {
  $cfg=$svc->settings();
  $make=static function(string $kind,string $from,string $to)use($svc):array{
   foreach($svc->store->all('review_exports',fn($r)=>$r['tipo']===$kind&&$r['da']===$from&&$r['a']===$to) as $r)return ['pacchetto'=>$r['id'],'gia_preparato'=>true];
   // Contesto di servizio limitato alla preparazione: nessuna identità umana né approvazione simulata.
   $ctx=new Context(new Request('POST','/cron/tick'),$svc,Session::open($svc->dataDir.'/_sessions',null,1),null,['fatture.gestisci','personale.presenze']);
   $r=(new ReviewExports($svc))->prepare($ctx,['tipo'=>$kind,'da'=>$from,'a'=>$to]);return ['pacchetto'=>$r['id'],'stato'=>'da_approvare'];
  };
  $scheduler->register('compensi_mensili','Compensi mensili da verificare','Calcola il mese precedente; non approva, paga o invia comunicazioni.',
   ['mensile'=>[(int)$cfg->get('compensi.giorno',1),(string)$cfg->get('compensi.ora','08:30')]],
   function()use($svc){
    $month=Clock::now()->modify('first day of last month');$from=$month->format('Y-m-01');$to=$month->format('Y-m-t');$n=0;
    foreach($svc->store->all('professionals',fn($p)=>!empty($p['attivo'])&&in_array($p['tipo'],['medico','fisioterapista'],true)) as $p){
     foreach($svc->compensations()->list($p['id'],$from,$to) as $old)if($old['da']===$from&&$old['a']===$to&&$old['stato']!=='calcolato')continue 2;
     $has=false;foreach($svc->appointments()->between($from,Clock::addDays($to,1)) as $a)if(($a['professional_id']??null)===$p['id'])foreach(\App\Domain\Agenda\Appointments::refs($a) as $ref)if($ref['stato']==='eseguito')$has=true;
     if($has){$svc->compensations()->calculate($p['id'],$from,$to);$n++;}
    }
    return ['prospetti_da_verificare'=>$n];
   },recuperoOre:168,attivaSe:fn()=>(bool)$cfg->get('compensi.prepara_mensile',true));
  $scheduler->register('pacchetto_commercialista','Documenti settimanali commercialista','Prepara PDF, XML di archivio e riepilogo; attende sempre approvazione umana.',
   ['settimanale'=>[(int)$cfg->get('fatturazione.invio_commercialista.giorno',1),(string)$cfg->get('fatturazione.invio_commercialista.ora','08:00')]],
   fn()=>$make('commercialista',Clock::addDays(Clock::weekStart(Clock::today()),-7),Clock::addDays(Clock::weekStart(Clock::today()),-1)),recuperoOre:72,
   attivaSe:fn()=>(bool)$cfg->get('fatturazione.invio_commercialista.attivo',false));
  $scheduler->register('pacchetto_personale','Presenze mensili per consulente','Prepara il mese precedente senza inviare documenti prima della revisione.',
   ['mensile'=>[(int)$cfg->get('personale.invio_mensile.giorno',1),(string)$cfg->get('personale.invio_mensile.ora','09:00')]],
   function()use($make){$date=Clock::now()->modify('first day of last month');return $make('personale',$date->format('Y-m-01'),$date->format('Y-m-t'));},recuperoOre:168,
   attivaSe:fn()=>(bool)$cfg->get('personale.invio_mensile.attivo',false));
 }
}
