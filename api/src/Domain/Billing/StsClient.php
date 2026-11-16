<?php
declare(strict_types=1);
namespace App\Domain\Billing;
use App\Core\ApiError;
use App\Domain\Management\TabularFile;
use App\Services\Services;
use DOMDocument;
use DOMXPath;
/** SOAP 1.1 + MTOM, Basic auth e percorsi fissi del kit ufficiale. Non richiede estensione SOAP. */
final class StsClient
{
 public function __construct(private readonly Services $svc,private readonly mixed $transport=null){}
 public function configured():bool{return $this->svc->secrets()->get('sts_password')!==''&&$this->svc->secrets()->get('sts_pin')!==''&&$this->svc->settings()->get('integrazioni.sts.username','')!=='';}
 private function post(string $path,array $headers,string $body):array
 {
  if(!$this->configured())throw new ApiError('sts_non_configurato',503);
  $prod=$this->svc->settings()->get('integrazioni.sts.ambiente','test')==='produzione';$url='https://'.($prod?'invioSS730p':'invioSS730pTest').'.sanita.finanze.it'.$path;
  $auth=base64_encode($this->svc->settings()->get('integrazioni.sts.username').':'.$this->svc->secrets()->get('sts_password'));
  $headers[]='Authorization: Basic '.$auth;$headers[]='SOAPAction: ""';$headers[]='MIME-Version: 1.0';
  if($this->transport)return ($this->transport)($url,$headers,$body);
  $ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>45,CURLOPT_HTTPHEADER=>$headers,CURLOPT_POSTFIELDS=>$body,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_FOLLOWLOCATION=>false]);$bytes=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);return ['status'=>$status,'body'=>is_string($bytes)?$bytes:''];
 }
 public function envelope(string $name,string $ns):array{$doc=new DOMDocument('1.0','UTF-8');$en=$doc->createElementNS('http://schemas.xmlsoap.org/soap/envelope/','soap:Envelope');$doc->appendChild($en);$body=$doc->createElementNS('http://schemas.xmlsoap.org/soap/envelope/','soap:Body');$en->appendChild($body);$op=$doc->createElementNS($ns,'ts:'.$name);$body->appendChild($op);return [$doc,$op];}
 private function parse(string $bytes):DOMDocument
 {
  if(preg_match('~<(?:[A-Za-z0-9_-]+:)?Envelope\b.*?</(?:[A-Za-z0-9_-]+:)?Envelope>~s',$bytes,$hit))$bytes=$hit[0];
  return TabularFile::xml($bytes);
 }
 public function send(string $zip,string $name):array
 {
  if(strlen($zip)>5*1024*1024)throw new ApiError('file_troppo_grande',413);
  $cfg=new StsXml($this->svc);[$doc,$op]=$this->envelope('inviaFileMtom','http://ejb.invioTelematicoSS730p.sanita.finanze.it/');
  StsXml::text($doc,$op,'nomeFileAllegato',$name);StsXml::text($doc,$op,'pincodeInvianteCifrato',$cfg->encrypt($this->svc->secrets()->get('sts_pin')));$owner=$doc->createElement('datiProprietario');$op->appendChild($owner);foreach($cfg->owner(false) as $k=>$v)StsXml::text($doc,$owner,$k,$v);
  $binary=$doc->createElement('documento');$op->appendChild($binary);$include=$doc->createElementNS('http://www.w3.org/2004/08/xop/include','xop:Include');$include->setAttribute('href','cid:spese@rizzo.local');$binary->appendChild($include);
  $boundary='rizzo_'.bin2hex(random_bytes(18));$body='--'.$boundary."\r\nContent-Type: application/xop+xml; charset=UTF-8; type=\"text/xml\"\r\nContent-Transfer-Encoding: 8bit\r\nContent-ID: <root@rizzo.local>\r\n\r\n".$doc->saveXML()."\r\n--".$boundary."\r\nContent-Type: application/zip\r\nContent-Transfer-Encoding: binary\r\nContent-ID: <spese@rizzo.local>\r\n\r\n".$zip."\r\n--".$boundary."--\r\n";
  $res=$this->post('/InvioTelematicoSS730pMtomWeb/InvioTelematicoSS730pMtomPort',['Content-Type: multipart/related; type="application/xop+xml"; start="<root@rizzo.local>"; start-info="text/xml"; boundary="'.$boundary.'"'],$body);
  if($res['status']===0||$res['status']>=500)return ['stato'=>'esito_incerto'];
  if(in_array($res['status'],[400,401,403],true))return ['stato'=>'rifiutato','codice'=>'http_'.$res['status']];
  try{$xml=$this->parse($res['body']);}catch(ApiError){return ['stato'=>'esito_incerto'];}
  $xp=new DOMXPath($xml);$get=fn($key)=>trim($xp->query('//*[local-name()="'.$key.'"]')->item(0)?->textContent??'');$protocol=$get('protocollo');
  if($res['status']!==200||!preg_match('/^\d{17}$/',$protocol))return ['stato'=>'rifiutato','codice'=>$get('codiceEsito')?:'risposta_non_valida'];
  return ['stato'=>'accolto_da_elaborare','protocollo'=>$protocol,'codice'=>$get('codiceEsito')];
 }
 public function outcome(string $protocol):array
 {
  if(!preg_match('/^\d{17}$/',$protocol))throw new ApiError('protocollo_non_valido',422);
  [$doc,$op]=$this->envelope('EsitoInvii','http://esitoinvio.p730.sanita.sogei.it/');$input=$doc->createElement('DatiInputRichiesta');$op->appendChild($input);StsXml::text($doc,$input,'pinCode',(new StsXml($this->svc))->encrypt($this->svc->secrets()->get('sts_pin')));StsXml::text($doc,$input,'protocollo',$protocol);
  $res=$this->post('/EsitoStatoInviiWEB/EsitoInvioDatiSpesa730Service',['Content-Type: text/xml;charset=UTF-8'],$doc->saveXML());if($res['status']!==200)throw new ApiError('esito_sts_non_disponibile',503);
  $xml=$this->parse($res['body']);$xp=new DOMXPath($xml);$get=fn($key)=>trim($xp->query('//*[local-name()="'.$key.'"]')->item(0)?->textContent??'');
  if($get('protocollo')!==$protocol)throw new ApiError('esito_sts_non_disponibile',503);
  return ['protocollo'=>$protocol,'stato_servizio'=>$get('stato'),'descrizione'=>mb_substr($get('descrizione'),0,300),'inviati'=>(int)$get('nInviati'),'accolti'=>(int)$get('nAccolti'),'errori'=>(int)$get('nErrori'),'warning'=>(int)$get('nWarnings')];
 }
}
