<?php
declare(strict_types=1);
namespace App\Domain\Billing;
use App\Core\{ApiError,Clock};
use App\Services\Services;
use ZipArchive;
final class StsBatch
{
 public function __construct(private readonly Services $svc,private readonly mixed $transport=null){}
 public function prepare(string $from,string $to):array
 {
  $env=$this->svc->settings()->get('integrazioni.sts.ambiente','test');$invoices=[];$excluded=[];
  foreach($this->svc->store->all('invoices') as $i){
   $date=$i['pagamento']['data']??null;if(!$date||$date<$from||$date>$to)continue;
   if($i['tipo']!=='fattura'||!empty($i['storica'])||!($i['sanitaria']??true)||!in_array($i['stato'],['pagata','annullata'],true))continue;
   if($i['stato']==='annullata'){$excluded[]=['id'=>$i['id'],'numero'=>$i['numero_testo'],'motivo'=>'Storno: verificare rimborso e registrazione fiscale prima della trasmissione.'];continue;}
   if(in_array($i['sts_invio'][$env]['stato']??'', ['in_invio','accolto_da_elaborare','esito_incerto'],true))continue;
   $invoices[]=$i;
  }
  $xml=(new StsXml($this->svc))->build($invoices);$tmp=tempnam(sys_get_temp_dir(),'rizsts');$zip=new ZipArchive();$zip->open($tmp,ZipArchive::OVERWRITE);$zip->addFromString('spese.xml',$xml);$zip->close();
  try{$bytes=(string)file_get_contents($tmp);if(strlen($bytes)>5*1024*1024)throw new ApiError('file_troppo_grande',413);$file=$this->svc->files()->put($bytes,'spese-'.$from.'-'.$to.'.zip','application/zip','pacchetto_sts');}finally{@unlink($tmp);}
  $r=$this->svc->store->put('review_exports',['tipo'=>'sts','stato'=>'da_approvare','sts_tracciato'=>true,'ambiente'=>$env,'da'=>$from,'a'=>$to,'conteggio'=>count($invoices),'file'=>$file,'invoice_revisions'=>array_column($invoices,'revision','id'),'esclusi'=>$excluded,
   'destinatario'=>'Sistema Tessera Sanitaria · '.$env,'riepilogo'=>'Tracciato validato contro lo schema ufficiale, CF cifrati. Le opposizioni non includono il CF del cittadino.']);
  $this->svc->audit()->log('sts.preparato','review_exports',$r['id'],null,['documenti'=>count($invoices),'ambiente'=>$env]);return $r;
 }
 public function send(string $id):array
 {
  if(!$this->svc->settings()->get('integrazioni.sts.attiva',false))throw new ApiError('sts_non_configurato',503);
  $r=$this->svc->store->get('review_exports',$id) ?? throw ApiError::notFound();$env=$this->svc->settings()->get('integrazioni.sts.ambiente','test');
  if($env==='produzione'&&!$this->svc->settings()->get('integrazioni.sts.collaudo_completato',false))throw new ApiError('collaudo_sts_richiesto',422);
  if(!(new StsClient($this->svc))->configured())throw new ApiError('sts_non_configurato',503);
  if(empty($r['sts_tracciato'])||$r['ambiente']!==$env)throw new ApiError('pacchetto_sts_non_valido',422);
  $this->svc->store->transaction(function()use($id,$env){
   $r=$this->svc->store->get('review_exports',$id);if($r['stato']!=='da_approvare')throw new ApiError('invio_gia_preso_in_carico',409);
   foreach($r['invoice_revisions'] as $invoice=>$rev){$i=$this->svc->invoices()->get($invoice);if($i['revision']!==$rev||in_array($i['sts_invio'][$env]['stato']??'', ['in_invio','accolto_da_elaborare','esito_incerto'],true))throw new ApiError('pacchetto_obsoleto',409);$i['sts_invio'][$env]=['stato'=>'in_invio','pacchetto'=>$id];$this->svc->store->put('invoices',$i);}
   $r['stato']='in_invio';$this->svc->store->put('review_exports',$r);
  });
  $bytes=$this->svc->files()->read($r['file']['id'])['bytes'];
  try{$result=(new StsClient($this->svc,$this->transport))->send($bytes,$r['file']['name']);}catch(\Throwable){$result=['stato'=>'esito_incerto'];}
  return $this->svc->store->transaction(function()use($id,$env,$result){
   $r=$this->svc->store->get('review_exports',$id);$r['stato']=$result['stato'];$r['esito']=$result;$r['inviato_at']=Clock::stamp();
   foreach($r['invoice_revisions'] as $invoice=>$rev){$i=$this->svc->invoices()->get($invoice);$i['sts_invio'][$env]=$result+['pacchetto'=>$id];$this->svc->store->put('invoices',$i);}
   $r=$this->svc->store->put('review_exports',$r);$this->svc->audit()->log('sts.esito_invio','review_exports',$id,null,$result);return $r;
  });
 }
 public function outcome(string $id):array
 {
  $r=$this->svc->store->get('review_exports',$id) ?? throw ApiError::notFound();if(empty($r['esito']['protocollo']))throw new ApiError('protocollo_non_disponibile',422);
  if($r['ambiente']!==$this->svc->settings()->get('integrazioni.sts.ambiente','test'))throw new ApiError('ambiente_sts_differente',422);
  $result=(new StsClient($this->svc,$this->transport))->outcome($r['esito']['protocollo']);$r['elaborazione']=$result;$r=$this->svc->store->put('review_exports',$r);$this->svc->audit()->log('sts.esito_consultato','review_exports',$id,null,$result);return $r;
 }
}
