<?php
use App\Core\{Clock,ApiError};
use App\Services\Services;
use App\Http\{Context,Request};
use App\Domain\Patients\Bookings;
// Solo dati fittizi e coda locale in modalità test.
Clock::fix('2026-11-10T12:00:00');
$gType=$s->store->get('therapy_types',$group['id']);$gType['followup_giorni']=40;$s->store->put('therapy_types',$gType);
foreach($groupApps as $groupA){$current=$s->store->get('appointments',$groupA['id']);foreach($current['participants'] as $p)$s->agenda()->setStatus($groupA['id'],'eseguito',$p['patient_id']);}
$care=new App\Domain\Messaging\CareCommunications($s);Clock::fix('2026-12-19T10:00:00');$care->refresh();ok(!$care->tasks(),'ricontatto da 40 giorni non anticipato al giorno 39');
Clock::fix('2026-12-20T10:00:00');$messagesBefore=count($s->store->all('messages'));$tasks=$care->tasks();ok(count($tasks)===7,'ricontatti proposti dopo l’ultima terapia e conclusione effettiva');ok(count($s->store->all('messages'))===$messagesBefore,'ricontatti manuali non inviano messaggi da soli');
$care->complete(['id'=>$tasks[0]['id']]);Clock::fix('2026-12-22T10:00:00');ok(!array_filter($care->tasks(),fn($r)=>$r['tipo']==='recensione'),'recensione separata dal contatto e non anticipata');
Clock::fix('2026-12-23T10:00:00');ok(count(array_filter($care->tasks(),fn($r)=>!empty($r['errore_configurazione'])))===1,'link recensione mancante non blocca il registro dei ricontatti');$s->settings()->update(['struttura'=>['link_recensione'=>'https://example.test/recensione']]);ok(count(array_filter($care->tasks(),fn($r)=>$r['tipo']==='recensione'))===1,'recensione proposta tre giorni dopo il contatto registrato');
$person=$s->store->get('patients',$pt['id']);$person['consensi']['marketing']=['valore'=>true];$s->store->put('patients',$person);$campaign=$care->campaign(['testo'=>'Novità di prova','canale'=>'sms','assicurazione'=>'tutte','approva'=>true,'chiave'=>'camp-test']);
ok(count($campaign['destinatari'])===1,'campagna include soltanto consenzienti');
$person['consensi']['marketing']=['valore'=>false];$s->store->put('patients',$person);$msgs=$s->store->all('messages',fn($m)=>($m['campaign_id']??null)===$campaign['id']);$s->gateway()->deliver($msgs[0]['id']);ok($s->store->get('messages',$msgs[0]['id'])['error']==='consenso_revocato','consenso ricontrollato prima dell’invio in coda');
$quiet=$s->gateway()->enqueueRaw('sms','+393330000001','prova_orario','Test silenzio','', 'quiet-test',['tecnico'=>false]);Clock::fix('2026-12-23T22:00:00');$s->gateway()->deliver($quiet['id']);$quiet=$s->store->get('messages',$quiet['id']);ok($quiet['status']==='in_coda'&&str_contains($quiet['next_attempt_at'],'08:00:00'),'silenzio 21-08 rinvia anche i messaggi tecnici non urgenti');
// Richiesta di conferma visita e riepilogo al medico soltanto dopo risposta personale.
Clock::fix('2026-12-23T10:00:00');$doctor=$s->store->get('professionals',$pro['id']);$doctor['email']='medico@example.test';$s->store->put('professionals',$doctor);
$visit=$s->agenda()->create(['tipo'=>'visita','patient_id'=>$pt['id'],'therapy_type_id'=>$t['id'],'professional_id'=>$pro['id'],'start'=>'2026-12-24T10:00:00']);$care->visitReminders();$beforeDigest=$care->doctorDigest();ok($beforeDigest['professionisti']===0,'nessun riepilogo medico senza conferma paziente');
$reminders=$s->store->all('messages',fn($m)=>$m['idempotency_key']==='visit-confirm:'.$visit['id'].':1');preg_match('~conferma-visita/([A-Za-z0-9_-]+)~',$reminders[0]['body'],$match);$care->confirmVisit($match[1],true);$digest=$care->doctorDigest();ok($digest['professionisti']===1,'riepilogo medico dopo conferma verificata');
// Limite AI prima della richiesta e bozza clinica compilata soltanto in locale.
$s->secrets()->save(['openai_api_key'=>'offline-ai-key']);$s->settings()->update(['ai'=>['attiva'=>true,'modello'=>'offline-model','tetto_giornaliero_eur'=>5,'tetto_mensile_eur'=>0.0001]]);$calls=0;
$ai=new App\Domain\Planning\AiClient($s->store,$s->settings(),function()use(&$calls){$calls++;return ['status'=>200,'body'=>'{}'];});fails(fn()=>$ai->complete('test','test','dato anonimo'),'tetto_ai_raggiunto');ok($calls===0,'limite mensile blocca la chiamata prima di sostenere costi');
$noteBody=['id'=>$ind['id'],'testo'=>'Annotazione clinica di prova','chiave'=>'note-test'];$noteContext=new Context(new Request('POST','/percorsi/nota-salva',$noteBody),$s,$c->session,$c->user,$c->perms);$controller=new App\Http\Controllers\EpisodesController();$controller->notaSalva($noteContext);$noted=$controller->notaSalva($noteContext);ok(count($noted['diario'])===1,'diario terapeutico salva una sola annotazione per invio');
$draft=App\Domain\Patients\ClinicalDraft::build($c,['episode_id'=>$ind['id']]);ok(str_contains($draft['contenuto'],'Annotazione clinica di prova')&&$calls===0,'bozza referto compilata localmente senza trasmettere dati clinici');
