<?php
declare(strict_types=1);
namespace App\Domain\Billing;
use App\Core\ApiError;
use App\Services\Services;
/** Aruba REST ufficiale; nessun URL arbitrario e credenziali soltanto nel corpo HTTPS. */
final class ArubaClient
{
 public function __construct(private readonly Services $svc,private readonly mixed $transport=null){}
 public function configured():bool{return $this->svc->settings()->get('integrazioni.aruba.username','')!==''&&$this->svc->secrets()->get('aruba_password')!=='';}
 private function request(string $url,array $headers,string $body):array
 {
  if($this->transport)return ($this->transport)($url,$headers,$body);
  $ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>30,CURLOPT_HTTPHEADER=>$headers,CURLOPT_POSTFIELDS=>$body,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_FOLLOWLOCATION=>false]);
  $out=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);return ['status'=>$status,'body'=>is_string($out)?$out:''];
 }
 public function login():string
 {
  if(!$this->configured())throw new ApiError('aruba_non_configurata',503);
  $demo=$this->svc->settings()->get('integrazioni.aruba.ambiente','demo')==='demo';
  $res=$this->request('https://'.($demo?'demoauth':'auth').'.fatturazioneelettronica.aruba.it/auth/signin',['Content-Type: application/x-www-form-urlencoded;charset=UTF-8'],http_build_query(['username'=>$this->svc->settings()->get('integrazioni.aruba.username'),'password'=>$this->svc->secrets()->get('aruba_password'),'grant_type'=>'password']));
  $data=json_decode($res['body'],true);if($res['status']!==200||empty($data['access_token']))throw new ApiError('aruba_autenticazione_fallita',503);return $data['access_token'];
 }
 public function upload(string $xml,bool $dryRun):array
 {
  if(strlen($xml)>5*1024*1024)throw new ApiError('file_troppo_grande',413);
  $token=$this->login();$demo=$this->svc->settings()->get('integrazioni.aruba.ambiente','demo')==='demo';
  $res=$this->request('https://'.($demo?'demows':'ws').'.fatturazioneelettronica.aruba.it/services/invoice/upload',['Content-Type: application/json;charset=UTF-8','Authorization: Bearer '.$token],json_encode(['dataFile'=>base64_encode($xml),'skipExtraSchema'=>false,'dryRun'=>$dryRun]));
  $data=json_decode($res['body'],true);
  if($res['status']===0||$res['status']>=500)return ['stato'=>'esito_incerto','codice'=>'rete_o_servizio'];
  if($res['status']!==200||!in_array($data['errorCode']??'',['','0000'],true)||empty($data['uploadFileName']))return ['stato'=>'rifiutato','codice'=>substr((string)($data['errorCode']??$res['status']),0,40)];
  return ['stato'=>$dryRun?'validato_senza_invio':'preso_in_carico_aruba','file'=>$data['uploadFileName'],'codice'=>(string)($data['errorCode']??'')];
 }
}
