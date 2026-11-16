<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\{ApiError,Clock};
use App\Domain\Billing\{ArubaClient,FatturaPa};
use App\Domain\Management\TabularFile;
use App\Http\Context;
use App\Support\Validator as V;
use DOMXPath;
final class FiscalController
{
 public function stato(Context $c):array
 {
  $c->need('fatture.gestisci');return ['aruba'=>['configurata'=>(new ArubaClient($c->svc))->configured(),'ambiente'=>$c->svc->settings()->get('integrazioni.aruba.ambiente','demo')],
   'sts'=>['credenziali_presenti'=>$c->svc->secrets()->get('sts_password')!==''&&$c->svc->secrets()->get('sts_pin')!=='','stato'=>$c->svc->settings()->get('integrazioni.sts.attiva',false)?'attivo':'da_attivare','invio_diretto'=>true]];
 }
 public function verificaAruba(Context $c):array
 {
  if($c->role()!=='titolare')throw ApiError::forbidden();$c->svc->limiter()->hit('aruba_login','struttura',1,60);(new ArubaClient($c->svc))->login();return ['autenticazione'=>'verificata'];
 }
 public function aruba(Context $c):array
 {
  $c->need('fatture.gestisci');$id=V::id($c->body(),'id','fat',true);$dry=V::bool($c->body(),'solo_verifica',true);
  $inv=$c->svc->invoices()->get($id);
  // Nessun invio di dati sanitari a persone fisiche verso un canale destinato allo SdI.
  if(($inv['sanitaria']??true)||!empty($inv['storica']))throw new ApiError('fattura_sanitaria_non_destinata_sdi',422);
  if(empty($inv['xml_file_id'])||!in_array($inv['stato'],['emessa','pagata'],true))throw new ApiError('fattura_non_inviabile',422);
  if(!$c->svc->settings()->get('integrazioni.aruba.attiva',false)||(new ArubaClient($c->svc))->configured()===false)throw new ApiError('aruba_non_configurata',503);
  if(!$dry&&!V::bool($c->body(),'approva'))throw new ApiError('approvazione_richiesta',422);
  $xml=$c->svc->files()->read($inv['xml_file_id'])['bytes'];$doc=TabularFile::xml($xml);$xp=new DOMXPath($doc);$node=$xp->query('//*[local-name()="DatiTrasmissione"]/*[local-name()="IdTrasmittente"]/*[local-name()="IdCodice"]')->item(0);if(!$node)throw new ApiError('xml_non_valido',422);$node->nodeValue='01879020517';$xml=$doc->saveXML();if(FatturaPa::validate($xml))throw new ApiError('xml_non_valido',422);
  $claimed=$c->svc->store->transaction(function()use($c,$id,$dry){$i=$c->svc->invoices()->get($id);if(!$dry&&!empty($i['aruba']['stato'])&&!in_array($i['aruba']['stato'],['rifiutato','validato_senza_invio'],true))throw new ApiError('invio_gia_preso_in_carico',409);if(!$dry){$i['aruba']=['stato'=>'in_invio','at'=>Clock::stamp()];$c->svc->store->put('invoices',$i);}return $i;});
  try{$result=(new ArubaClient($c->svc))->upload($xml,$dry);}catch(ApiError $e){$result=['stato'=>'rifiutato','codice'=>$e->errorCode];}
  $c->svc->store->transaction(function()use($c,$id,$result,$dry){$i=$c->svc->invoices()->get($id);$i[$dry?'aruba_verifica':'aruba']=$result+['at'=>Clock::stamp()];$c->svc->store->put('invoices',$i);});
  $c->svc->audit()->log($dry?'aruba.verifica':'aruba.invio','invoices',$id,null,$result);return $result;
 }
}
