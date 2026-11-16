<?php
declare(strict_types=1);
namespace App\Domain\Management;
use App\Core\{ApiError,Clock};
use App\Http\Context;
use App\Services\Services;
use App\Support\Validator as V;
use Dompdf\Dompdf;
use ZipArchive;
/** Pacchetto fotografato al momento della preparazione; l'invio è sempre esplicitamente approvato. */
final class ReviewExports
{
 public function __construct(private readonly Services $svc){}
 public function prepare(Context $c,array $b):array
 {
  $type=V::enum($b,'tipo',['commercialista','personale'],true);
  if($type==='personale')$c->need('personale.presenze');else $c->need('fatture.gestisci');
  $from=V::date($b,'da',true);$to=V::date($b,'a',true);if($to<$from||Clock::diffMinutes($from.'T00:00:00',$to.'T00:00:00')>370*1440)throw new ApiError('periodo_non_valido',422);
  $tmp=tempnam(sys_get_temp_dir(),'rizpack');$zip=new ZipArchive();$zip->open($tmp,ZipArchive::OVERWRITE);$rows=[];
  try{
   if($type==='personale'){
    $month=substr($from,0,7);$data=(new Staff($this->svc))->summary($c,$month);$rows=$data['righe'];
    $f=fopen('php://temp','w+');fputcsv($f,['Professionista','Ore contratto','Ore agenda','Ore effettive','Scostamento'],';','"','');
    foreach($rows as $r)fputcsv($f,[$r['nome'],$r['contrattuali_min']/60,$r['programmate_min']/60,$r['effettive_min']/60,$r['differenza_min']/60],';','"','');rewind($f);$csv=stream_get_contents($f);fclose($f);$zip->addFromString('presenze-'.$month.'.csv',$csv);$summary='Riepilogo presenze '.$month."\n".$csv;$to=date('Y-m-t',strtotime($month.'-01'));$from=$month.'-01';
   }else{
    $invoices=$this->svc->invoices()->list($from,$to,null,null);$rows=array_values(array_filter($invoices,fn($i)=>$i['stato']!=='bozza'));
    $zip->addFromString('riepilogo.csv',$this->svc->billingExports()->summaryCsv($rows));
    if($type==='sts'){$zip->addFromString('spese-sanitarie-da-verificare.csv',$this->svc->billingExports()->stsCsv($rows));$summary='Prospetto di verifica Sistema TS. Non costituisce una trasmissione. Verificare codici prestazione, opposizioni e pagamenti prima dell’invio.';}
    else{foreach($rows as $i){$safe=preg_replace('/[^a-zA-Z0-9._-]/','_',$i['numero_testo']);$zip->addFromString('pdf/'.$safe.'.pdf',$this->svc->billingExports()->courtesyPdf($i));if(!empty($i['xml_file_id']))$zip->addFromString('xml-archivio-interno/'.$i['xml_nome'],$this->svc->files()->read($i['xml_file_id'])['bytes']);}$summary='Documenti contabili dal '.$from.' al '.$to.'. '.count($rows).' documenti. Gli XML sono un archivio interno: le fatture sanitarie a persone fisiche non sono destinate allo SdI.';}
   }
   $pdf=new Dompdf(['isRemoteEnabled'=>false]);$pdf->loadHtml('<html><meta charset="UTF-8"><body><h1>Riepilogo da verificare</h1><p>'.nl2br(htmlspecialchars($summary)).'</p></body></html>');$pdf->render();$zip->addFromString('riepilogo.pdf',$pdf->output());$zip->close();
   $file=$this->svc->files()->put((string)file_get_contents($tmp),$type.'-'.$from.'-'.$to.'.zip','application/zip','pacchetto_revisionato');
  }finally{@unlink($tmp);}
  $email=$type==='commercialista'?$this->svc->settings()->get('fatturazione.commercialista_email',''):($type==='personale'?$this->svc->settings()->get('personale.consulente_email',''):'');
  $r=$this->svc->store->put('review_exports',['tipo'=>$type,'stato'=>'da_approvare','da'=>$from,'a'=>$to,'conteggio'=>count($rows),'file'=>$file,'destinatario'=>$email,'riepilogo'=>$summary]);$this->svc->audit()->log('pacchetto.preparato','review_exports',$r['id']);return $r;
 }
 public function approve(Context $c,array $b):array
 {
  return $this->svc->store->transaction(function()use($c,$b){
   $r=$this->svc->store->get('review_exports',V::id($b,'id','exp',true)) ?? throw ApiError::notFound();$this->access($c,$r);
   if($r['stato']!=='da_approvare')return $r;
   if(empty($r['destinatario']))throw new ApiError('email_destinatario_mancante',422);
   $m=$this->svc->gateway()->enqueueRaw('email',$r['destinatario'],'pacchetto_contabile',$r['riepilogo'],'Documenti '.$r['da'].' / '.$r['a'],'export:'.$r['id'],['attachments'=>[$r['file']['id']],'tecnico'=>false]);
   $r['stato']='approvato_accodato';$r['message_id']=$m['id'];$r['approvato_da']=$c->userId();$r['approvato_at']=Clock::stamp();$r=$this->svc->store->put('review_exports',$r,$r['revision']);$this->svc->audit()->log('pacchetto.approvato','review_exports',$r['id']);return $r;
  });
 }
 public function access(Context $c,array $r):void {if($r['tipo']==='personale')$c->need('personale.presenze');else $c->need('fatture.gestisci');}
}
