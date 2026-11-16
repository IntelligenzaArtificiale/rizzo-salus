<?php
use App\Core\{Clock,ApiError};
use App\Services\Services;
use App\Http\{Context,Request};
use App\Domain\Patients\Bookings;
// Richiede la fixture test-call-domain.php.
$g=$groupApps[0];$firstPid=$g['participants'][0]['patient_id'];$otherPid=$g['participants'][1]['patient_id'];
$s->agenda()->setStatus($g['id'],'eseguito',$firstPid);
fails(fn()=>$s->agenda()->move($g['id'],['start'=>'2026-11-11T09:00:00'],null),'seduta_gia_eseguita');
fails(fn()=>$s->agenda()->cancel($g['id']),'seduta_gia_eseguita');
$s->agenda()->cancel($g['id'],$otherPid);
$updated=$s->store->get('appointments',$g['id']);ok(count($updated['cancelled_participants'])===1&&App\Domain\Agenda\AgendaHistory::performed($updated,$firstPid),'cancellazione singola preserva eseguite e storico del gruppo');
$s->agenda()->setManualFlag($ap['id'],'prima_manuale',true,$pt['id']);ok(true,'segnali manuali prima seduta senza alterare esito');
$expiredPatient=$s->patients()->create(['nome'=>'Fasce','cognome'=>'Scadute','disponibilita'=>[['giorno'=>2,'da'=>'09:00','a'=>'11:00','valida_al'=>'2026-11-08']]]);
$expiredEpisode=$s->episodes()->save(['patient_id'=>$expiredPatient['id'],'titolo'=>'Fasce scadute','terapie'=>[['therapy_type_id'=>$therapy['id'],'sedute_previste'=>1,'professional_preferito_id'=>$fisio['id']]]],null,null);
$expiredPlan=$s->planner()->propose([$expiredEpisode['id']],'2026-11-10','2026-11-10',$u['id']);ok(!$expiredPlan['nuove'],'disponibilità scadute non diventano illimitate');
$copy=$s->copyWeek()->apply('2026-11-09',['selezionati'=>[$appt['id']]]);ok($copy['creati']===1,'copia selettiva della sola seduta scelta');
$again=$s->copyWeek()->apply('2026-11-09',['selezionati'=>[$appt['id']]]);ok($again['creati']===0,'copia selettiva ripetuta non duplica');
// Due processi condividono realmente il lock dello store e cercano lo stesso slot.
if(function_exists('pcntl_fork')){
 $slot=$slots->slots($t['id'],'2026-11-10')[0];$raceInput=$req+[];$raceInput['start']=$slot['start'];$raceInput['window_id']=$slot['window_id'];
 $one=$b->request(array_replace($raceInput,['nome'=>'ConcorrenzaUno','telefono'=>'+393330000004']),'127.0.0.4');$two=$b->request(array_replace($raceInput,['nome'=>'ConcorrenzaDue','telefono'=>'+393330000005']),'127.0.0.5');
 $payloads=[$one+['codice'=>code($s,$one['challenge'])],$two+['codice'=>code($s,$two['challenge'])]];$barrier=$dir.'/race-start';$children=[];
 foreach($payloads as $i=>$payload){$pid=pcntl_fork();if($pid===0){while(!file_exists($barrier))usleep(1000);try{(new Bookings(new Services($dir)))->confirm($payload);$result='ok';}catch(ApiError $e){$result=$e->errorCode;}file_put_contents($dir.'/race-'.$i,$result);exit(0);}$children[]=$pid;}
 file_put_contents($barrier,'go');foreach($children as $pid)pcntl_waitpid($pid,$status);$s->store->refresh();$results=[file_get_contents($dir.'/race-0'),file_get_contents($dir.'/race-1')];sort($results);ok($results===['ok','slot_non_disponibile'],'conferme OTP simultanee: un solo appuntamento creato');
}
// XLSX reale con data seriale e stili; nessuna formula viene eseguita.
$tmp=tempnam(sys_get_temp_dir(),'testxlsx');$xlsx=new ZipArchive();$xlsx->open($tmp,ZipArchive::OVERWRITE);
$xlsx->addFromString('xl/styles.xml','<styleSheet><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>');
$xlsx->addFromString('xl/worksheets/sheet1.xml','<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>Data</t></is></c></row><row><c r="A2" s="1"><v>46335</v></c></row></sheetData></worksheet>');$xlsx->close();$parsed=App\Domain\Management\TabularFile::read(file_get_contents($tmp),'prova.xlsx');unlink($tmp);ok($parsed['righe'][0]['Data']==='2026-11-09','date Excel riconosciute dagli stili');
fails(fn()=>App\Domain\Management\TabularFile::read('non è uno zip','prova.xlsx'),'foglio_non_valido');

// I vincoli del ciclo valgono anche per modifiche manuali e storico della prescrizione.
$cycle=$s->store->get('episodes',$ind['id']);$apps=$s->appointments()->forEpisodes([$ind['id']]);$base=$apps[0];
$candidate=array_replace($base,['stato'=>'programmato','start'=>'2026-11-11T10:00:00','end'=>'2026-11-11T10:15:00']);$pending=array_replace($candidate,['id'=>'candidate-pending','start'=>'2026-11-10T10:00:00','end'=>'2026-11-10T10:15:00']);
$codes=array_column(App\Domain\Agenda\CycleConstraints::check($s->store,$candidate,null,[$pending]),'codice');ok(in_array('intervallo_minimo_non_rispettato',$codes,true),'vincolo intervallo anche per proposta modificata manualmente');
$edit=['patient_id'=>$cycle['patient_id'],'titolo'=>$cycle['titolo'],'terapie'=>$cycle['therapies']];$edit['terapie'][0]['therapy_type_id']=$group['id'];fails(fn()=>$s->episodes()->save($edit,$cycle['id'],$cycle['revision']),'terapia_con_storico');
$edit['terapie']=$cycle['therapies'];$edit['terapie'][]=$edit['terapie'][0];fails(fn()=>$s->episodes()->save($edit,$cycle['id'],$cycle['revision']),'riga_non_valida');
$staff->save($c,['professional_id'=>$pro['id'],'date'=>'2026-11-30','tipo'=>'ferie']);ok(true,'assenza futura pianificabile senza registrare ore lavorate');
fails(fn()=>$staff->save($c,['professional_id'=>$pro['id'],'date'=>'2026-11-30','tipo'=>'presenza','da'=>'09:00','a'=>'10:00']),'presenza_futura');
