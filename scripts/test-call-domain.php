<?php
declare(strict_types=1);
require dirname(__DIR__).'/api/vendor/autoload.php';
use App\Core\{Env,Clock,ApiError};
use App\Services\Services;
use App\Http\{Context,Request,Session};
use App\Auth\Permissions;
use App\Domain\Patients\{Documents,Bookings,BookingSlots,PatientPortal};
use App\Domain\Management\{Stock,Staff,Expenses};
Env::set('APP_ENV','test');Env::set('DATA_ENCRYPTION_KEY',base64_encode(random_bytes(32)));Env::set('APP_URL','http://127.0.0.1:8082');
Clock::fix('2026-11-09T10:00:00');
$dir=dirname(__DIR__).'/.runtime/qa/call-domain-'.bin2hex(random_bytes(4));$s=new Services($dir);$checks=0;
function ok(bool $b,string $name):void{global $checks;if(!$b)throw new RuntimeException('FAIL '.$name);$checks++;echo "PASS $name\n";}
function fails(callable $f,string $code):void{try{$f();}catch(ApiError $e){ok($e->errorCode===$code,'rifiuto '.$code.' ('.$e->errorCode.')');return;}throw new RuntimeException('Mancato rifiuto '.$code);}
function context(Services $s,array $u):Context{return new Context(new Request('POST','/test',[],[],[],'127.0.0.1'),$s,Session::open($s->dataDir.'/_sessions',null,60),$u,Permissions::effective($u['role'],Permissions::defaultRoles()));}
function code(Services $s,string $challenge):string{foreach($s->store->all('messages') as $m)if($m['idempotency_key']==='otp:'.$challenge){preg_match('/\b(\d{6})\b/',$m['body'],$hit);return $hit[1];}throw new RuntimeException('OTP non trovato');}
$u=$s->users()->create(['nome'=>'Titolare','cognome'=>'Test','email'=>'owner@example.test','role'=>'titolare','password'=>'TestPassword2026']);$c=context($s,$u);
$s->settings()->update(['festivita_nazionali'=>false,'orari'=>['1'=>[['08:00','20:00']],'2'=>[['08:00','20:00']],'3'=>[['08:00','20:00']],'4'=>[['08:00','20:00']],'5'=>[['08:00','20:00']]],'ai'=>['attiva'=>false],'messaggi'=>['modalita'=>'test'],'prenotazioni'=>['attive'=>true,'informativa'=>'Informativa di prova','anticipo_minimo_ore'=>0]]);
$pro=$s->catalog()->saveProfessional(['nome'=>'Medico','cognome'=>'Test','tipo'=>'medico','specialita'=>['Fisiatria'],'prenotabile_online'=>true,'percentuale_compenso'=>70]);
$t=$s->catalog()->saveTherapyType(['nome'=>'Visita di prova','categoria'=>'visita','durata_min'=>30,'tariffa'=>100,'prenotabile_online'=>true]);
$pt=$s->patients()->create(['nome'=>'Paziente','cognome'=>'Test','telefono'=>'+393330000001','data_nascita'=>'1990-01-01','allergie'=>'Test allergia','disponibilita'=>[['giorno'=>1,'da'=>'09:00','a'=>'12:00']]]);
ok($pt['disponibilita'][0]['giorno']===1,'disponibilità anagrafica');
$d=new Documents($s);ok(!$d->releaseAllowed($pt['id']),'consensi obbligatori non sostituiti da spunte');
foreach(['privacy','trattamento'] as $type){
 $tpl=$d->saveTemplate(['nome'=>$type,'tipo'=>$type,'testo'=>'Documento {{nome}} {{cognome}}','versione'=>'1','attivo'=>true]);
 $doc=$d->save($c,['patient_id'=>$pt['id'],'titolo'=>$type,'modello_id'=>$tpl['id'],'tipo'=>$type]);
 ok(str_contains($doc['contenuto'],'Paziente Test'),'precompilazione '.$type);
 $link=$d->link($c,$doc['id']);fails(fn()=>$d->requestOtp($link['token'],'127.0.0.1'),'lettura_richiesta');
 $d->evidence($link['token'],'127.0.0.1',true);$otp=$d->requestOtp($link['token'],'127.0.0.1');
 fails(fn()=>$d->accept($link['token'],$otp['challenge'],'000000','127.0.0.1'),'otp_non_valido');
 ok($s->store->get('otp_challenges',$otp['challenge'])['attempts']===1,'tentativi OTP persistono');
 $d->accept($link['token'],$otp['challenge'],code($s,$otp['challenge']),'127.0.0.1');
 fails(fn()=>$d->publicDocument($link['token']),'link_scaduto');
 ok($s->store->get('documents',$doc['id'])['firma']['sha256']===$doc['sha256'],'evidenza immutabile '.$type);
}
ok($d->releaseAllowed($pt['id']),'rilascio dopo entrambi i consensi');
$slots=new BookingSlots($s);$w=$slots->saveWindow($c,['professional_id'=>$pro['id'],'therapy_type_id'=>$t['id'],'date'=>'2026-11-10','da'=>'09:00','a'=>'11:00','pubblicata'=>true]);
ok(count($slots->slots($t['id'],'2026-11-10'))>0,'slot medici pubblicati');
$b=new Bookings($s);$req=['nome'=>'Nuovo','cognome'=>'Paziente','telefono'=>'+393330000002','data_nascita'=>'1991-01-01','privacy_letta'=>true,'therapy_type_id'=>$t['id'],'window_id'=>$w['id'],'start'=>'2026-11-10T09:00:00'];
$first=$b->request($req,'127.0.0.2');$second=$b->request(array_replace($req,['nome'=>'Altro','telefono'=>'+393330000003']),'127.0.0.3');
$b->confirm($first+['codice'=>code($s,$first['challenge'])]);ok(count($s->store->all('appointments'))===1,'prenotazione automatica dopo OTP');
fails(fn()=>$b->confirm($second+['codice'=>code($s,$second['challenge'])]),'slot_non_disponibile');
ok(count($s->store->all('appointments'))===1,'concorrenza non duplica slot');
$booking=$s->store->get('bookings_online',$first['id']);$portal=new PatientPortal($s);$tok=$s->tokens()->issue('portale',$booking['patient_id'],60,[],false);
ok(!$portal->view($tok)['appuntamenti'],'portale nasconde agenda futura senza consensi');
$portal->cancellation($tok,$booking['appointment_id'],'Prova');$portal->cancellation($tok,$booking['appointment_id'],'Prova');
ok($s->store->get('appointments',$booking['appointment_id'])['stato']==='confermato','disdetta non cancella');
ok(count($s->store->all('notifications',fn($n)=>$n['tipo']==='disdetta'))===1,'disdetta idempotente');
$stock=new Stock($s);$item=$stock->item(['nome'=>'Guanti','unita'=>'pezzi','costo'=>1,'soglia_minima'=>5]);
$move=['articolo_id'=>$item['id'],'quantita'=>10,'motivo'=>'Carico test'];$stock->move($move,'same');$stock->move($move,'same');
ok($stock->list()['articoli'][0]['giacenza']===10.0,'carico idempotente');fails(fn()=>$stock->move(array_replace($move,['quantita'=>-11]),'over'),'scorta_insufficiente');
$therapy=$s->catalog()->saveTherapyType(['nome'=>'Individuale','categoria'=>'strumentale','durata_min'=>15,'tariffa'=>30,'consumi_standard'=>[['articolo_id'=>$item['id'],'quantita'=>2]]]);
$ap=$s->agenda()->create(['tipo'=>'terapia','patient_id'=>$pt['id'],'professional_id'=>$pro['id'],'therapy_type_id'=>$therapy['id'],'start'=>'2026-11-09T11:00:00']);
$s->agenda()->setStatus($ap['id'],'eseguito');$s->agenda()->setStatus($ap['id'],'eseguito');ok($stock->list()['articoli'][0]['giacenza']===8.0,'consumo automatico una sola volta');
$s->agenda()->setStatus($ap['id'],'programmato');ok($stock->list()['articoli'][0]['giacenza']===10.0,'ripristino esito riaccredita scorta');
$staff=new Staff($s);$staff->save($c,['professional_id'=>$pro['id'],'date'=>'2026-11-09','tipo'=>'presenza','da'=>'08:00','a'=>'13:00','pausa_minuti'=>30]);
ok($staff->summary($c,'2026-11')['righe'][0]['effettive_min']===270,'presenze escluse pause e preparazione');
fails(fn()=>$staff->save($c,['professional_id'=>$pro['id'],'date'=>'2026-11-09','tipo'=>'presenza','da'=>'10:00','a'=>'12:00']),'presenza_sovrapposta');
$exp=new Expenses($s);$exp->save(['descrizione'=>'Licenza','date'=>'2026-11-09','importo'=>100,'categoria'=>'abbonamenti','pagata'=>false,'ricorrenza'=>'mensile']);$r=$exp->period('2026-11-01','2027-01-31');ok($r['costi_competenza_cents']===10000&&$r['ricorrenze_previste_cents']===20000,'ricorrenze distinte da uscite reali');
$s->secrets()->save(['composio_api_key'=>'secret-test']);ok($s->secrets()->status()['composio_api_key']===true,'stato segreto senza contenuto');$raw=file_get_contents($dir.'/integration_secrets.json');ok(!str_contains($raw,'secret-test'),'credenziali cifrate su disco');

// Gruppi: soltanto proposte, capienza e approvazione selettiva.
$fisio=$s->catalog()->saveProfessional(['nome'=>'Fisio','cognome'=>'Test','tipo'=>'fisioterapista','orari'=>['2'=>[['09:00','11:00']]]]);
$room=$s->catalog()->saveResource(['nome'=>'Palestra','tipo'=>'palestra','capienza'=>6]);
$group=$s->catalog()->saveTherapyType(['nome'=>'Palestra gruppo','categoria'=>'palestra_gruppo','durata_min'=>60,'capienza'=>6,'risorsa_id'=>$room['id'],'tariffa'=>20]);
$eps=[];for($i=0;$i<8;$i++){$pp=$s->patients()->create(['nome'=>'Gruppo'.$i,'cognome'=>'Test','disponibilita'=>[['giorno'=>2,'da'=>'09:00','a'=>'11:00']]]);$eps[]=$s->episodes()->save(['patient_id'=>$pp['id'],'titolo'=>'Percorso gruppo','terapie'=>[['therapy_type_id'=>$group['id'],'sedute_previste'=>1,'frequenza_min'=>1,'frequenza_max'=>1,'professional_preferito_id'=>$fisio['id']]]],null,null)['id'];}
$before=count($s->store->all('appointments'));$proposal=$s->planner()->propose($eps,'2026-11-10','2026-11-10',$u['id']);
ok(count($s->store->all('appointments'))===$before,'pianificatore non modifica autonomamente');
ok(count($proposal['nuove'])===8,'pianificatore include gruppi e disponibilità anagrafiche');
$approved=$s->planner()->approve($proposal['id'],$u['id'],[0,1,2,3,4,5,6,7]);
$groupApps=$s->store->all('appointments',fn($a)=>$a['tipo']==='gruppo');
ok(count($groupApps)===2,'otto pazienti distribuiti su due gruppi');
$counts=array_map(fn($a)=>count($a['participants']),$groupApps);ok(max($counts)<=6&&max($counts)-min($counts)<=2,'gruppi con capienza e bilanciamento');
$ep=$s->store->get('episodes',$eps[0]);ok($s->episodes()->progress($ep)[0]['programmate']===1,'avanzamento del paziente nel gruppo');
fails(fn()=>$s->planner()->approve($proposal['id'],$u['id']),'proposta_gia_chiusa');
$ind=$s->episodes()->save(['patient_id'=>$pt['id'],'titolo'=>'Intervalli','disponibilita'=>[['giorno'=>1,'da'=>'14:00','a'=>'18:00'],['giorno'=>2,'da'=>'14:00','a'=>'18:00'],['giorno'=>3,'da'=>'14:00','a'=>'18:00'],['giorno'=>4,'da'=>'14:00','a'=>'18:00'],['giorno'=>5,'da'=>'14:00','a'=>'18:00']],
 'terapie'=>[['therapy_type_id'=>$therapy['id'],'sedute_previste'=>3,'frequenza_min'=>1,'frequenza_max'=>3,'intervallo_min_giorni'=>2,'professional_preferito_id'=>$pro['id']]]],null,null);
$plan=$s->planner()->propose([$ind['id']],'2026-11-09','2026-11-13',$u['id']);$dates=array_column($plan['nuove'],'start');sort($dates);$gaps=true;for($i=1;$i<count($dates);$i++)$gaps=$gaps&&(strtotime(substr($dates[$i],0,10))-strtotime(substr($dates[$i-1],0,10))>=2*86400);if(count($dates)!==3||!$gaps)echo json_encode(['dates'=>$dates,'plan'=>$plan['non_pianificate']])."\n";ok(count($dates)===3&&$gaps,'intervallo minimo per terapia');
$s->planner()->approve($plan['id'],$u['id'],[0]);ok(count($s->appointments()->forEpisodes([$ind['id']]))===1,'approvazione solo della seduta scelta');
$appt=$s->appointments()->forEpisodes([$ind['id']])[0];$s->agenda()->setStatus($appt['id'],'assente');$progress=$s->episodes()->progress($ind)[0];ok($progress['eseguite']===0&&$progress['da_eseguire']===3&&$progress['residue']===3,'assenza non consuma il ciclo');
$done=$s->agenda()->setStatus($ap['id'],'eseguito');$done['compenso_materiali_cents']=1000;$s->store->put('appointments',$done);$comp=$s->compensations()->calculate($pro['id'],'2026-11-09','2026-11-09');
ok($comp['quota_professionista_cents']===1400,'materiali detratti prima del 70 percento');$s->compensations()->advance($comp['id'],'approvato');fails(fn()=>$s->compensations()->advance($comp['id'],'liquidato'),'ricevuta_richiesta');
// Importazioni: righe duplicate e carichi idempotenti.
$migration=new App\Domain\Management\Migration($s);$csv=['nome_file'=>'pazienti.csv','base64'=>base64_encode("Nome;Cognome;Telefono\nMigrato;Test;+393330000009\n"),'tipo'=>'pazienti','mappa'=>['nome'=>'Nome','cognome'=>'Cognome','telefono'=>'Telefono']];
$preview=$migration->validate($csv);ok(!$preview['righe'][0]['errore'],'CSV validato con mappatura');$result=$migration->apply(['id'=>$preview['id'],'righe'=>[2]]);$migration->apply(['id'=>$preview['id'],'righe'=>[2]]);ok($result['importati']===1,'migrazione idempotente');
$purchase=new App\Domain\Management\PurchaseImport($s);$xml='<FatturaElettronica><DettaglioLinee><Descrizione>Guanti</Descrizione><Quantita>5</Quantita></DettaglioLinee></FatturaElettronica>';
$pv=$purchase->preview(['nome_file'=>'acquisto.xml','base64'=>base64_encode($xml)]);ok($pv['righe'][0]['articolo_id']===$item['id'],'riconoscimento articolo da fattura XML');$purchase->apply(['id'=>$pv['id'],'righe'=>$pv['righe']]);$beforeQty=$stock->list()['articoli'][0]['giacenza'];$purchase->apply(['id'=>$pv['id'],'righe'=>$pv['righe']]);ok($stock->list()['articoli'][0]['giacenza']===$beforeQty,'fattura non carica due volte');
fails(fn()=>App\Domain\Management\TabularFile::xml('<!DOCTYPE x [<!ENTITY xx SYSTEM "file:///etc/passwd">]><x>&xx;</x>'),'documento_non_sicuro');
fails(fn()=>$s->settings()->update(['orari'=>['1'=>[['25:00','26:00']]]]),'orari_non_validi');
fails(fn()=>$s->settings()->update(['personale'=>['preparazione_conta'=>true]]),'preparazione_esclusa');
fails(fn()=>$s->settings()->update(['documenti'=>['consensi_obbligatori'=>[]]]),'consensi_obbligatori');

// Connettori: solo trasporti locali controllati, mai dati inviati a servizi esterni.
$s->settings()->update(['struttura'=>['partita_iva'=>'01234567897'],'integrazioni'=>['sts'=>['codice_regione'=>'160','codice_asl'=>'106','codice_struttura'=>'123456','cf_proprietario'=>'RSSMRA80A01H501U','username'=>'offline','attiva'=>true],'aruba'=>['username'=>'offline','ambiente'=>'demo']]]);
$s->secrets()->save(['sts_password'=>'offline-test','sts_pin'=>'1234567890','aruba_password'=>'offline-test']);
$person=$s->store->get('patients',$pt['id']);$person['codice_fiscale']='RSSMRA80A01H501U';$s->store->put('patients',$person);
$type=$s->store->get('therapy_types',$therapy['id']);$type['codice_sts']='SR';$s->store->put('therapy_types',$type);
$inv=$s->store->put('invoices',['tipo'=>'fattura','stato'=>'pagata','date'=>'2026-11-09','numero_testo'=>'A/2026/99','numero'=>99,'patient_id'=>$pt['id'],'sanitaria'=>true,'sts_opposizione'=>false,'righe'=>[['therapy_type_id'=>$therapy['id'],'importo_cents'=>3000,'descrizione'=>'Prestazione','quantita'=>1,'prezzo_cents'=>3000,'sconto_cents'=>0]],'imponibile_cents'=>3000,'totale_cents'=>3000,'bollo_cents'=>0,'bollo_a_carico'=>'paziente','pagamento'=>['data'=>'2026-11-09','tracciabile'=>true,'metodo'=>'carta','importo_cents'=>3000]]);
$gen=new App\Domain\Billing\StsXml($s);$xml=$gen->build([$inv]);ok(!str_contains($xml,'RSSMRA80A01H501U')&&str_contains($xml,'<tipoSpesa>SR</tipoSpesa>'),'tracciato TS validato e codici fiscali cifrati');
$opposed=$inv;$opposed['sts_opposizione']=true;$anonymous=$gen->build([$opposed]);ok(!str_contains($anonymous,'cfCittadino')&&str_contains($anonymous,'<flagOpposizione>1</flagOpposizione>'),'opposizione TS senza codice fiscale cittadino');
$stsTransport=function($url,$headers,$body){ok(str_starts_with($url,'https://invioSS730pTest.sanita.finanze.it/'),'trasporto TS confinato al profilo di prova');if(str_contains($url,'EsitoInvio'))return ['status'=>200,'body'=>'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><r><protocollo>12345678901234567</protocollo><stato>3</stato><descrizione>Elaborato</descrizione><nInviati>1</nInviati><nAccolti>1</nAccolti><nErrori>0</nErrori></r></soap:Body></soap:Envelope>'];ok(str_contains($body,'xop:Include')&&str_contains($body,'Content-Transfer-Encoding: binary'),'invio TS MTOM con allegato binario');return ['status'=>200,'body'=>'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><r><protocollo>12345678901234567</protocollo><codiceEsito>000</codiceEsito></r></soap:Body></soap:Envelope>'];};
$batch=new App\Domain\Billing\StsBatch($s,$stsTransport);$pack=$batch->prepare('2026-11-09','2026-11-09');ok($pack['stato']==='da_approvare','pacchetto TS non invia senza approvazione');$sent=$batch->send($pack['id']);ok($sent['stato']==='accolto_da_elaborare','protocollo TS distinto da esito finale');fails(fn()=>$batch->send($pack['id']),'invio_gia_preso_in_carico');$outcome=$batch->outcome($pack['id']);ok($outcome['elaborazione']['accolti']===1,'consultazione esito TS separata');
$arubaTransport=function($url,$headers,$body){ok(str_contains($url,'demo'),'Aruba usa ambiente demo');if(str_ends_with($url,'/auth/signin')){ok(!str_contains($url,'password')&&str_contains($body,'grant_type=password'),'password Aruba nel corpo');return ['status'=>200,'body'=>'{"access_token":"offline-token"}'];}$data=json_decode($body,true);ok($data['dryRun']===true&&!$data['skipExtraSchema'],'Aruba verifica senza trasmissione allo SdI');return ['status'=>200,'body'=>'{"errorCode":"0000","uploadFileName":"test.xml"}'];};
$aruba=(new App\Domain\Billing\ArubaClient($s,$arubaTransport))->upload('<xml/>',true);ok($aruba['stato']==='validato_senza_invio','stato Aruba non simula consegna fiscale');
// Documenti dei pazienti e azioni amministrative negati ai ruoli non assegnati.
$physioUser=$s->users()->create(['nome'=>'Fisio','cognome'=>'Utente','email'=>'fisio@example.test','role'=>'fisioterapista','professional_id'=>$fisio['id'],'password'=>'TestPassword2026']);$fc=context($s,$physioUser);
ok(!$fc->can('agenda.modifica')&&!$fc->can('agenda.segna_eseguita'),'fisioterapista con agenda sola lettura');fails(fn()=>$d->list($fc,$pt['id']),'non_autorizzato');fails(fn()=>(new Staff($s))->save($fc,['professional_id'=>$fisio['id']]),'non_autorizzato');
require __DIR__.'/tests-call/boundaries.php';
require __DIR__.'/tests-call/finance.php';
require __DIR__.'/tests-call/communications.php';
echo "COMPLETATI $checks controlli\n";
