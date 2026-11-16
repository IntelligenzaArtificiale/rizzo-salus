<?php
declare(strict_types=1);
require dirname(__DIR__).'/api/vendor/autoload.php';
use App\Core\{Env,Clock,ApiError};
use App\Services\Services;
use App\Domain\Calendar\{CalendarProfile,Hours};
use App\Domain\Agenda\{Workload,GroupLimits,MoveSuggestions,CycleAlerts};
use App\Http\{Context,Request,Session};
use App\Auth\Permissions;
Env::set('APP_ENV','test');Env::set('DATA_ENCRYPTION_KEY',base64_encode(random_bytes(32)));Env::set('APP_URL','http://127.0.0.1:8082');
Clock::fix('2026-11-16T07:00:00');
$s=new Services(dirname(__DIR__).'/.runtime/qa/calendar-domain-'.bin2hex(random_bytes(4)));$checks=0;
function ok(bool $b,string $name):void{global $checks;if(!$b)throw new RuntimeException('FAIL '.$name);$checks++;echo "PASS $name\n";}
function fails(callable $f,string $code):void{try{$f();}catch(ApiError $e){ok($e->errorCode===$code,'rifiuto '.$code.' ('.$e->errorCode.')');return;}throw new RuntimeException('Mancato rifiuto '.$code);}
function person(string $name):array{global $s;return $s->patients()->create(['nome'=>$name,'cognome'=>'Calendar']);}
function episode(array $t,string $profile='standard',?string $pro=null,int $sessions=1,bool $hard=false,array $availability=[]):array{global $s;$p=person('Paziente'.bin2hex(random_bytes(3)));return $s->episodes()->save(['patient_id'=>$p['id'],'titolo'=>'Calendar','profilo_gruppo'=>$profile,'disponibilita'=>$availability,'terapie'=>[['therapy_type_id'=>$t['id'],'sedute_previste'=>$sessions,'frequenza_max'=>7,'professional_preferito_id'=>$pro,'vincolo_professionista'=>$hard]]],null,null);}
function ref(array $ep):array{return ['patient_id'=>$ep['patient_id'],'episode_id'=>$ep['id'],'line_id'=>$ep['therapies'][0]['line_id']];}
function create(array $t,string $pro,string $start,?array $ep=null):array{global $s;return $s->agenda()->create(['tipo'=>$t['di_gruppo']?'gruppo':($t['categoria']==='visita'?'visita':'terapia'),'therapy_type_id'=>$t['id'],'professional_id'=>$pro,'start'=>$start]+($t['di_gruppo']?['participants'=>[ref($ep)]]:($ep?ref($ep):['patient_id'=>person('Libero')['id']])));}
$u=$s->users()->create(['nome'=>'Owner','cognome'=>'Calendar','email'=>'owner@example.test','role'=>'titolare','password'=>'TestPassword2026']);
$profile=new CalendarProfile($s);$setup=$profile->apply();$ids=$setup['professionisti'];$marco=$ids['Marco'];$antonio=$ids['Antonio'];$chiara=$ids['Chiara'];
$types=array_column($s->store->all('therapy_types'),null,'nome');$group=$types['Rieducazione motoria'];$manual=$types['Terapia manuale'];$fixed=$types['Camera iperbarica'];$laser=$types['Laserterapia'];
ok($s->settings()->get('orari')===CalendarProfile::HOURS,'orari esatti del PDF');
ok($profile->apply()['gia_applicato']===true,'profilo idempotente');
ok($manual['durata_min']===30&&$types['Linfodrenaggio']['durata_min']===45&&$fixed['durata_min']===60&&$laser['durata_min']===15,'durate confermate');
ok(!$types['Pompa diamagnetica (non assistita)']['attivo'],'modalità diamagnetica incerta non attivata');
ok($types['Pompa diamagnetica (assistita)']['risorsa_id']===$types['Pompa diamagnetica (non assistita)']['risorsa_id'],'diamagnetica protegge la stessa macchina');
ok($s->hours()->professionalWindows($s->store->get('professionals',$chiara),'2026-11-16')===[],'giorni Chiara da confermare');
ok($s->hours()->professionalWindows($s->store->get('professionals',$antonio),'2026-11-20')===[],'venerdì Antonio da confermare');
ok($s->hours()->professionalWindows($s->store->get('professionals',$antonio),'2026-11-17')===[[510,660]],'Antonio assente martedì pomeriggio');
ok($s->hours()->structureWindows('2026-11-20')===[[480,750]]&&$s->hours()->structureWindows('2026-11-21')===[],'venerdì mattina e sabato note');
$eps=[];for($i=0;$i<6;$i++)$eps[]=episode($group);
$g=$s->agenda()->create(['tipo'=>'gruppo','therapy_type_id'=>$group['id'],'professional_id'=>$marco,'start'=>'2026-11-16T08:30:00','participants'=>array_map('ref',array_slice($eps,0,5))]);
ok(count($g['participants'])===5,'cinque standard ammessi');
fails(fn()=>$s->agenda()->addToGroup($g['id'],ref($eps[5]),'singola'),'conflitto');
$neuro=episode($group,'neurologico');$neuro2=episode($group,'neurologico');
$refs=array_map('ref',array_slice($eps,0,4));$refs[]=ref($neuro);
ok(in_array('gruppo_pieno',array_column(GroupLimits::inspect($s->store,$refs,5)['conflitti'],'codice')),'neurologico riduce capienza a quattro');
$n=$s->agenda()->create(['tipo'=>'gruppo','therapy_type_id'=>$group['id'],'professional_id'=>$marco,'start'=>'2026-11-17T08:30:00','participants'=>[ref($neuro),ref($eps[5])]]);
fails(fn()=>$s->agenda()->addToGroup($n['id'],ref($neuro2),'singola'),'conflitto');
$c=episode($group,'complesso');ok(GroupLimits::inspect($s->store,[ref($c)],5)['capienza']===4,'complesso riduce capienza a quattro');
$view=$s->agenda()->view('2026-11-16','2026-11-17');ok(count($view[0]['segnali'])===5&&$view[0]['segnali'][0]['ultima'],'prima e ultima per singolo partecipante');
ok(count(CycleAlerts::list($s,'2026-11-16','2026-11-17'))===5,'promemoria interni individuali');
$s->agenda()->setStatus($g['id'],'eseguito');
$w=Workload::summarize([$s->store->get('appointments',$g['id'])],$marco);ok($w['pazienti_trattati']===5&&$w['prestazioni_eseguite']===5&&$w['minuti_eseguiti']===60,'cinque persone una sola ora operatore');
$s->agenda()->setStatus($g['id'],'assente',$eps[0]['patient_id']);
$w=Workload::summarize([$s->store->get('appointments',$g['id'])],$marco);ok($w['pazienti_trattati']===4&&$w['prestazioni_eseguite']===4&&$w['minuti_eseguiti']===60,'assenza individuale non moltiplica ore');
$f=create($fixed,$marco,'2026-11-16T10:00:00');
$m=create($manual,$marco,'2026-11-16T10:00:00');ok($m['start']===$f['start'],'macchinario fisso libera operatore');
fails(fn()=>create($fixed,$antonio,'2026-11-16T10:15:00'),'conflitto');
$second=$s->catalog()->saveTherapyType(['nome'=>'TSF prova','categoria'=>'strumentale','durata_min'=>15,'risorsa_id'=>$laser['risorsa_id'],'impegna_operatore'=>false,'durata_operatore_minuti'=>5]);
$prep=create($second,$marco,'2026-11-16T11:00:00');
fails(fn()=>create($manual,$marco,'2026-11-16T11:00:00'),'conflitto');
$after=create($manual,$marco,'2026-11-16T11:05:00');ok($after['start']==='2026-11-16T11:05:00','dopo preparazione operatore disponibile');
$room=$s->catalog()->saveResource(['nome'=>'Stanza singola','tipo'=>'sala','capienza'=>1]);
$withRoom=$s->catalog()->saveTherapyType(array_replace($laser,['risorse_aggiuntive'=>[$room['id']]]));
$roomOnly=$s->catalog()->saveTherapyType(['nome'=>'Terapia sala','categoria'=>'manuale','durata_min'=>30,'risorsa_id'=>$room['id']]);
create($withRoom,$marco,'2026-11-18T09:00:00');fails(fn()=>create($roomOnly,$antonio,'2026-11-18T09:00:00'),'conflitto');
fails(fn()=>create($manual,$marco,'2026-11-20T16:00:00'),'avvisi');
$exception=$s->agenda()->create(['tipo'=>'terapia','therapy_type_id'=>$manual['id'],'professional_id'=>$marco,'patient_id'=>person('Fuori orario')['id'],'start'=>'2026-11-20T16:00:00'],true);ok($exception['start']==='2026-11-20T16:00:00','manuale straordinario con conferma avvisi');
$visit=$s->catalog()->saveTherapyType(['nome'=>'Visita Antonio','categoria'=>'visita','durata_min'=>30]);create($visit,$antonio,'2026-11-18T10:00:00');fails(fn()=>create($manual,$antonio,'2026-11-18T10:00:00'),'conflitto');
$hard=episode($manual,'standard',$antonio,2,true);fails(fn()=>create($manual,$marco,'2026-11-18T11:00:00',$hard),'conflitto');
$before=count($s->store->all('appointments'));$plan=$s->planner()->propose([$hard['id']],'2026-11-19','2026-11-20',$u['id']);ok(count($s->store->all('appointments'))===$before,'proposta non modifica agenda');
ok(count($plan['nuove'])===2&&count(array_filter($plan['nuove'],fn($a)=>$a['professional_id']!==$antonio||str_starts_with($a['start'],'2026-11-20')))===0,'vincolo forte e venerdì Antonio rispettati');
$onlyFri=episode($manual,'standard',$marco,1,true,[['giorno'=>5,'da'=>'15:00','a'=>'18:00']]);$pf=$s->planner()->propose([$onlyFri['id']],'2026-11-20','2026-11-20',$u['id']);ok(count($pf['nuove'])===0,'automatico vieta venerdì pomeriggio');
$fixedEpisode=episode($fixed,'standard',$marco,1,true,[['giorno'=>3,'da'=>'09:00','a'=>'10:00']]);$fp=$s->planner()->propose([$fixedEpisode['id']],'2026-11-18','2026-11-18',$u['id']);ok(count($fp['nuove'])===1&&$fp['nuove'][0]['start']==='2026-11-18T09:00:00','planner TSF parallelo a terapia con operatore');$s->planner()->approve($fp['id'],$u['id']);
$many=[];for($i=0;$i<9;$i++)$many[]=episode($group,$i<2?'neurologico':'standard',$marco,1,true,[['giorno'=>4,'da'=>'08:30','a'=>'12:30']])['id'];
$pg=$s->planner()->propose($many,'2026-11-19','2026-11-19',$u['id']);ok(count($pg['nuove'])===9,'planner distribuisce gruppi clinici');$s->planner()->approve($pg['id'],$u['id']);
foreach($s->store->all('appointments',fn($a)=>$a['tipo']==='gruppo'&&str_starts_with($a['start'],'2026-11-19')) as $a)ok(!GroupLimits::inspect($s->store,$a['participants'],5)['conflitti'],'approvazione rispetta capienza e neuro');
$ctx=new Context(new Request('POST','/test',[],[],[],'127.0.0.1'),$s,Session::open($s->dataDir.'/_sessions',null,60),$u,Permissions::effective('titolare',Permissions::defaultRoles()));
$note=$s->agenda()->create(['tipo'=>'nota','start'=>'2026-11-21T10:00:00','titolo'=>'Sabato']);ok($s->checker()->check($note)===['conflitti'=>[],'avvisi'=>[]],'nota sabato non occupa slot');
$before=$s->store->get('appointments',$m['id']);$alternatives=(new MoveSuggestions($s))->propose($m['id'],'2026-11-23','2026-11-24');ok(count($alternatives['alternative'])>0&&$s->store->get('appointments',$m['id'])===$before,'alternative separate sola lettura');
$slot=$alternatives['alternative'][0];$s->agenda()->move($m['id'],['start'=>$slot['start']],$before['revision']);
fails(fn()=>$s->agenda()->move($m['id'],['start'=>'2026-11-24T10:00:00'],$before['revision']),'revisione_vecchia');
$stats=$s->agendaStats()->period('2026-11-16','2026-11-16');$row=array_values(array_filter($stats['professionisti'],fn($r)=>$r['professional_id']===$marco))[0];ok($row['pazienti_trattati']===4&&$row['prestazioni_eseguite']===4&&$row['minuti_eseguiti']===60&&$row['minuti_presenze_registrate']===0,'statistiche distinguono ore terapeutiche e presenze');
$copy=$s->copyWeek()->preview('2026-11-16');ok(count(array_filter($copy['esclusi'],fn($r)=>in_array($r['motivo'],['sedute_esaurite','riga_completata'],true)))>0,'copia esclude terapie completate');
// Intervalli e parametri: casi limite che non emergono dalla sola schermata.
ok(\App\Domain\Agenda\CapacityPeak::count(540,600,1,[[540,570,1],[570,600,1]])===2,'capienza non somma prenotazioni consecutive');
ok(\App\Domain\Agenda\CapacityPeak::count(540,600,1,[[540,580,1],[570,600,1]])===3,'capienza misura picco di sovrapposizione');
(new \App\Domain\Management\Staff($s))->save($ctx,['professional_id'=>$marco,'date'=>'2026-11-16','tipo'=>'presenza','da'=>'08:30','a'=>'12:30','pausa_minuti'=>15]);
$rows=$s->agendaStats()->period('2026-11-16','2026-11-16')['professionisti'];$row=array_values(array_filter($rows,fn($r)=>$r['professional_id']===$marco))[0];ok($row['minuti_presenze_registrate']===225&&$row['minuti_eseguiti']===60,'presenze effettive registrate e pause distinte dalle sedute');
$ch=$s->store->get('professionals',$chiara);$ch['orari']=['1'=>[['08:30','12:45']]];$ch['eccezioni']=[['da'=>'2026-11-24','a'=>'2026-11-24','tipo'=>'straordinario','dalle'=>'09:00','alle'=>'10:00']];$ch=$s->catalog()->saveProfessional($ch);
ok($s->hours()->professionalWindows($ch,'2026-11-23')===[[510,750]],'orari Chiara intersecati con apertura centro');
ok($s->hours()->professionalWindows($ch,'2026-11-24')===[[540,600]],'straordinario parametrico per data');
$pool=$types['Idrokinesiterapia'];$am=episode($pool,'standard',null,1,false,[['giorno'=>1,'da'=>'09:00','a'=>'10:00']]);$pm=episode($pool,'standard',null,1,false,[['giorno'=>1,'da'=>'16:00','a'=>'17:00']]);
$plan=$s->planner()->propose([$am['id'],$pm['id']],'2026-11-23','2026-11-23',$u['id']);$map=array_column($plan['nuove'],'professional_id','episode_id');ok(($map[$am['id']]??null)===$chiara&&($map[$pm['id']]??null)===$marco,'preferenze piscina Chiara mattina Marco pomeriggio');
fails(fn()=>episode($manual,'standard',null,1,true),'professionista_obbligatorio');
fails(fn()=>$s->settings()->update(['agenda'=>['gruppi'=>['max_complesso'=>6]]]),'limiti_gruppo_non_validi');
// Una indisponibilità della risorsa resta vincolante anche per terapie fisse.
$r=$s->store->get('resources',$fixed['risorsa_id']);$r['fermi']=[['da'=>'2026-11-25','a'=>'2026-11-25','tipo'=>'fermo_macchina']];$s->catalog()->saveResource($r);
fails(fn()=>create($fixed,$marco,'2026-11-25T09:00:00'),'conflitto');
$ep=episode($fixed,'standard',$marco,1,true,[['giorno'=>3,'da'=>'09:00','a'=>'10:00']]);$p=$s->planner()->propose([$ep['id']],'2026-11-25','2026-11-25',$u['id']);ok(count($p['nuove'])===0,'planner rispetta fermo apparecchio fisso');
echo "COMPLETATI $checks controlli Calendar\n";
