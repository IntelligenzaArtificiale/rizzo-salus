<?php
declare(strict_types=1);
namespace App\Domain\Billing;
use App\Core\{ApiError,Clock};
use App\Services\Services;
use DOMDocument;
use DOMElement;
/** Tracciato ufficiale 730: CF cifrati con il certificato SanitelCF, mai testo clinico libero. */
final class StsXml
{
 public const RES=__DIR__.'/../../../resources/sts/';
 public function __construct(private readonly Services $svc){}
 public function certificate():string{return (string)($this->svc->settings()->get('integrazioni.sts.certificato_cifratura','')?:file_get_contents(self::RES.'SanitelCF.cer'));}
 public function encrypt(string $plain):string
 {
  $cert=$this->certificate();$info=openssl_x509_parse($cert);
  if(!$info||$info['validTo_time_t']<Clock::now()->getTimestamp()||$info['validFrom_time_t']>Clock::now()->getTimestamp())throw new ApiError('certificato_sts_scaduto',422);
  $key=openssl_pkey_get_public($cert);if(!$key||!openssl_public_encrypt($plain,$out,$key,OPENSSL_PKCS1_PADDING))throw new ApiError('cifratura_sts_fallita',422);return base64_encode($out);
 }
 public function owner(bool $encrypted):array
 {
  $cfg=$this->svc->settings()->get('integrazioni.sts',[]);$out=['codiceRegione'=>$cfg['codice_regione']??'','codiceAsl'=>$cfg['codice_asl']??'','codiceSSA'=>$cfg['codice_struttura']??'','cfProprietario'=>$cfg['cf_proprietario']??''];
  foreach(['codiceRegione','codiceAsl'] as $k)if(!preg_match('/^[A-Z0-9]{3}$/',$out[$k]))throw new ApiError('profilo_sts_incompleto',422,['campo'=>$k]);
  if(!preg_match('/^[A-Z0-9]{5,6}$/',$out['codiceSSA'])||!preg_match('/^(\d{11}|[A-Z0-9]{16})$/',$out['cfProprietario']))throw new ApiError('profilo_sts_incompleto',422);
  if($encrypted)$out['cfProprietario']=$this->encrypt($out['cfProprietario']);return $out;
 }
 public static function text(DOMDocument $doc,DOMElement $parent,string $key,string $value):DOMElement{$el=$doc->createElement($key);$el->appendChild($doc->createTextNode($value));$parent->appendChild($el);return $el;}
 public function build(array $invoices):string
 {
  if(!$invoices)throw new ApiError('nessuna_spesa_inviabile',422);
  $doc=new DOMDocument('1.0','UTF-8');$root=$doc->createElement('precompilata');$doc->appendChild($root);$owner=$doc->createElement('proprietario');$root->appendChild($owner);
  foreach($this->owner(true) as $k=>$v)self::text($doc,$owner,$k,$v);
  $seller=$this->svc->settings()->get('struttura',[]);
  foreach($invoices as $i){
   if(!empty($i['storica'])||$i['tipo']!=='fattura'||empty($i['pagamento'])||($i['sanitaria']??true)!==true)throw new ApiError('spesa_sts_non_inviabile',422);
   $p=$i['intestatario']??$this->svc->store->get('patients',$i['patient_id']);$opposed=!empty($i['sts_opposizione'])||!empty($p['consensi']['sts_opposizione']['valore']);
   if(!$opposed&&(!isset($p['codice_fiscale'])||!preg_match('/^[A-Z0-9]{16}$/',$p['codice_fiscale'])))throw new ApiError('codice_fiscale_non_valido',422);
   $sp=$doc->createElement('documentoSpesa');$root->appendChild($sp);$id=$doc->createElement('idSpesa');$sp->appendChild($id);
   self::text($doc,$id,'pIva',(string)($seller['partita_iva']??''));self::text($doc,$id,'dataEmissione',$i['date']);$num=$doc->createElement('numDocumentoFiscale');$id->appendChild($num);self::text($doc,$num,'dispositivo','1');self::text($doc,$num,'numDocumento',$i['numero_testo']);
   self::text($doc,$sp,'dataPagamento',$i['pagamento']['data']);if($i['pagamento']['data']<$i['date'])self::text($doc,$sp,'flagPagamentoAnticipato','1');self::text($doc,$sp,'flagOperazione','I');
   if(!$opposed)self::text($doc,$sp,'cfCittadino',$this->encrypt($p['codice_fiscale']));self::text($doc,$sp,'pagamentoTracciato',$i['pagamento']['tracciabile']?'SI':'NO');self::text($doc,$sp,'tipoDocumento','F');self::text($doc,$sp,'flagOpposizione',$opposed?'1':'0');
   $voices=[];
   foreach($i['righe'] as $line){
    $tt=!empty($line['therapy_type_id'])?$this->svc->store->get('therapy_types',$line['therapy_type_id']):null;
    if(!$tt&&!empty($line['appointment_id'])){$a=$this->svc->store->get('appointments',$line['appointment_id']);$tt=$a?$this->svc->store->get('therapy_types',$a['therapy_type_id']):null;}
    $code=$line['codice_sts']??$tt['codice_sts']??'';if(!in_array($code,['TK','FC','FV','AS','AD','SR','CT','PI','IC','AA','SV','SP'],true))throw new ApiError('codice_sts_prestazione_mancante',422);
    $nature=$line['natura_iva']??$tt['natura_iva']??'N4';$key=$code.'|'.$nature.'|'.($tt['aliquota_iva']??0);$voices[$key]??=['tipo'=>$code,'natura'=>$nature,'aliquota'=>$tt['aliquota_iva']??0,'cents'=>0];$voices[$key]['cents']+=(int)$line['importo_cents']+(int)($line['iva_cents']??0);
   }
   if((int)$i['bollo_cents']>0&&$i['bollo_a_carico']==='paziente'){$voices['bollo']=['tipo'=>'AA','natura'=>'N1','aliquota'=>0,'cents'=>(int)$i['bollo_cents']];}
   foreach($voices as $v){if($v['cents']<=0)continue;$el=$doc->createElement('voceSpesa');$sp->appendChild($el);self::text($doc,$el,'tipoSpesa',$v['tipo']);self::text($doc,$el,'importo',Money::fmt($v['cents']));self::text($doc,$el,$v['natura']==='ordinaria'?'aliquotaIVA':'naturaIVA',$v['natura']==='ordinaria'?number_format((float)$v['aliquota'],2,'.',''):$v['natura']);}
  }
  $prev=libxml_use_internal_errors(true);$valid=$doc->schemaValidate(self::RES.'730_precompilata.xsd');libxml_clear_errors();libxml_use_internal_errors($prev);if(!$valid)throw new ApiError('tracciato_sts_non_valido',422);return $doc->saveXML();
 }
}
