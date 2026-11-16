<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\{ApiError,Clock};
use App\Http\Context;
use App\Support\Validator as V;
/** Bozza locale sui dati già registrati dal clinico. Nessuna diagnosi o informazione inviata a un modello esterno. */
final class ClinicalDraft
{
 public static function build(Context $c,array $b):array
 {
  $c->need('documenti.referti_crea');$c->need('pazienti.clinica');$id=V::id($b,'episode_id','epi',true);$e=$c->svc->store->get('episodes',$id) ?? throw ApiError::notFound();
  $p=$c->svc->store->get('patients',$e['patient_id']) ?? throw ApiError::notFound();$c->svc->patients()->assertCanSee($c,$p);
  $text='BOZZA DA VERIFICARE - '.Clock::today()."\n".'Paziente: '.$p['cognome'].' '.$p['nome']."\nPercorso: ".$e['titolo']."\n\nDiagnosi registrata:\n".($e['diagnosi']?:'Non indicata.')."\n\nPrestazioni del percorso:\n";
  foreach($c->svc->episodes()->progress($e) as $l){$t=$c->svc->store->get('therapy_types',$l['therapy_type_id']);$text.='- '.($t['nome']??'Terapia').': '.$l['eseguite'].' eseguite su '.$l['sedute_previste']." previste.\n";}
  if($c->can('pazienti.note_terapeutiche')){$text.="\nNote terapeutiche registrate:\n".($e['note_terapeutiche']?:'');foreach($e['diario']??[] as $n)$text.="\n".substr($n['at'],0,10).' - '.$n['testo'];}
  $text.="\n\nConclusioni e indicazioni del professionista:\n";
  $c->svc->audit()->read('episodes',$id);return ['titolo'=>'Referto - '.$e['titolo'],'contenuto'=>$text,'clinico'=>true,'tipo'=>'referto','patient_id'=>$p['id'],'episode_id'=>$id];
 }
}
