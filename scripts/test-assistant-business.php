<?php
/** Contesto mensile e isolamento dei dati personale, senza provider o dati della demo. */
require dirname(__DIR__).'/api/vendor/autoload.php';
use App\Core\{Env,Clock};use App\Services\Services;use App\Http\{Context,Request,Session};use App\Domain\Assistant\OperatorBusinessContext;
Env::set('APP_ENV','test');Env::set('DATA_ENCRYPTION_KEY',base64_encode(random_bytes(32)));Clock::fix('2026-11-17T12:00:00');
$s=new Services(dirname(__DIR__).'/.runtime/qa/business-'.bin2hex(random_bytes(4)));
$pro=$s->store->put('professionals',['nome'=>'QA','cognome'=>'Proprio','tipo'=>'fisioterapista']);$other=$s->store->put('professionals',['nome'=>'QA','cognome'=>'Altro','tipo'=>'fisioterapista']);
foreach (['2026-10-18','2026-11-18','2026-12-18'] as $date)$s->store->put('staff_attendance',['professional_id'=>$pro['id'],'date'=>$date,'tipo'=>'ferie','minuti'=>0]);
$s->store->put('staff_attendance',['professional_id'=>$other['id'],'date'=>'2026-11-19','tipo'=>'ferie','minuti'=>0]);
$c=new Context(new Request('POST','/test'),$s,Session::open($s->dataDir.'/_sessions',null,60),['id'=>'usr_qa','role'=>'fisioterapista','professional_id'=>$pro['id']],['personale.propria_scheda']);$out=OperatorBusinessContext::describe($c);
assert(str_contains($out,'2026-11-18'));if(str_contains($out,'2026-12-18')||str_contains($out,'2026-10-18'))throw new RuntimeException('Periodo non filtrato');echo "PASS solo presenze del mese corrente\n";
if(str_contains($out,'2026-11-19'))throw new RuntimeException('Personale altrui esposto');echo "PASS personale altrui escluso\n";
