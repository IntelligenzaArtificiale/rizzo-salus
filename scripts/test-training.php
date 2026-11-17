<?php
declare(strict_types=1);
/** Casi aggiuntivi: fonte per ruolo, revisioni, allegati e prenotazioni AI in archivio isolato. */
require __DIR__.'/test-operator.php';
use App\Domain\Management\Training;
use App\Http\Controllers\TrainingController;
use App\Domain\Assistant\OperatorBusinessContext;
function withBody($c,array $body):App\Http\Context {return new App\Http\Context(new App\Http\Request('POST','/test',$body),$c->svc,$c->session,$c->user,$c->perms);}
$text='Per una disdetta il codice operativo è GINEPRO42. La segreteria chiama il paziente prima di cambiare appuntamento.';
$doc=Training::save(withBody($c,['titolo'=>'Procedura disdette QA','testo'=>$text,'ruoli'=>['segreteria'],'attivo'=>true,'allegato'=>['nome_file'=>'procedura.txt','mime'=>'text/plain','base64'=>base64_encode($text)]]));
ok(count(Training::rows($sc))===1,'segreteria legge la procedura assegnata');
ok(str_contains(Training::context($sc,'Come gestisco una disdetta?'),'GINEPRO42'),'testo pertinente nel contesto AI');
ok(!str_contains(file_get_contents($s->dataDir.'/training_documents.json'),'GINEPRO42'),'testi formazione cifrati sul disco');
$mc=ctx($s,$fisio,array_merge(App\Auth\Permissions::defaultRoles()['fisioterapista'],['ai.assistente']));
ok(!Training::rows($mc)&&!str_contains(Training::context($mc,'disdetta'),'GINEPRO42'),'documenti riservati esclusi da un altro ruolo');
fails(fn()=>Training::save(withBody($sc,['titolo'=>'Non ammesso','testo'=>'A','ruoli'=>[]])),'non_autorizzato');
$doc=Training::save(withBody($c,array_replace($doc,['testo'=>'La regola aggiornata usa GINEPRO43.'])));
ok(str_contains(Training::context($sc,'regola aggiornata'),'GINEPRO43')&&!str_contains(Training::context($sc,'regola'),'GINEPRO42'),'modifica aggiorna subito la fonte');
fails(fn()=>Training::save(withBody($c,array_replace($doc,['revision'=>1]))),'revisione_vecchia');
$doc=Training::save(withBody($c,array_replace($doc,['attivo'=>false])));
ok(!Training::rows($sc)&&!str_contains(Training::context($sc,'regola'),'GINEPRO43'),'bozza esclusa dal contesto degli operatori');
$doc=Training::save(withBody($c,array_replace($doc,['attivo'=>true])));
(new TrainingController())->remove(withBody($c,['id'=>$doc['id'],'revision'=>$doc['revision']]));
ok(!Training::rows($c)&&!Training::visible($c,$s->store->get('training_documents',$doc['id'])),'eliminazione revoca anche download del titolare');
$large=$s->files()->put(str_repeat('a',16*1024*1024),'allegato.txt','text/plain','formazione');ok($large['size']===16*1024*1024,'allegato oltre il precedente limite 15 MB');
$edge=$s->files()->put(str_repeat('a',50*1024*1024),'limite.txt','text/plain','formazione');ok($edge['size']===50*1024*1024,'50 MB accettati');
fails(fn()=>$s->files()->put(str_repeat('a',50*1024*1024+1),'troppo.txt','text/plain','formazione'),'file_troppo_grande');
$med=$s->catalog()->saveProfessional(['nome'=>'Medico','cognome'=>'Prenotazioni QA','tipo'=>'medico','specialita'=>['Fisiatria']]);$visit=$s->catalog()->saveTherapyType(['nome'=>'Visita QA','categoria'=>'visita','durata_min'=>30]);
$wait=$plans->prepare($c,[action('attesa_aggiungi',['paziente'=>'Anna Verifica','professionista'=>$med['id'],'prestazione'=>$visit['id']])]);ok(!$s->store->all('waitlist'),'attesa in anteprima senza scrittura');$plans->confirm($c,$wait['id']);ok(count($s->store->all('waitlist'))===1,'attesa confermata');
$booking=$plans->prepare($c,[action('prenotazione_crea',['paziente'=>'Anna Verifica','professionista'=>$med['id'],'prestazione'=>$visit['id'],'start'=>'2026-11-20T17:00:00'])]);$res=$plans->confirm($c,$booking['id']);ok($s->store->get('appointments',$res['risultati'][0]['id'])['tipo']==='visita','prenotazione interna visita tramite operatore');
fails(fn()=>$plans->prepare($c,[action('prenotazione_crea',['paziente'=>'Anna Verifica','professionista'=>$med['id'],'prestazione'=>$t['id'],'start'=>'2026-11-20T18:00:00'])]),'solo_visite_mediche');
$private=$s->store->put('compensations',['professional_id'=>$med['id'],'da'=>'2026-11-01','a'=>'2026-11-30','stato'=>'calcolato','quota_professionista_cents'=>876543]);
ok(!str_contains(OperatorBusinessContext::describe($mc),'876543'),'compensi altrui assenti dal contesto clinico');ok(str_contains(OperatorBusinessContext::describe($c),'876543'),'titolare interroga compensi registrati');
echo "COMPLETATI $checks controlli operatore e formazione\n";
