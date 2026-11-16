<?php
declare(strict_types=1);
namespace App\Services;
use App\Core\{ApiError,Clock};
/** OTP scoped, monouso, hash, scadenza e cinque tentativi persistenti anche su errore. */
final class Otp
{
    public function __construct(private readonly Services $svc) {}
    public function issue(string $scope,string $subject,string $phone,string $ip,int $minutes=10): array
    {
        if (!preg_match('/^\+?[0-9]{7,16}$/',$phone)) throw new ApiError('telefono_non_valido',422);
        $this->svc->limiter()->hit('otp_send_ip',$ip,8,3600);
        $this->svc->limiter()->hit('otp_send_phone',$phone,4,3600);
        $result=$this->svc->store->transaction(function () use ($scope,$subject,$phone,$minutes) {
            foreach ($this->svc->store->all('otp_challenges',fn($r)=>$r['scope']===$scope && $r['subject']===$subject && empty($r['used_at'])) as $old) {
                $old['used_at']=Clock::stamp(); $this->svc->store->put('otp_challenges',$old);
            }
            $code=(string)random_int(100000,999999);
            $r=$this->svc->store->put('otp_challenges',['scope'=>$scope,'subject'=>$subject,'hash'=>password_hash($code,PASSWORD_DEFAULT),'attempts'=>0,'used_at'=>null,
                'expires_at'=>Clock::stamp(Clock::now()->modify('+'.max(1,min(30,$minutes)).' minutes'))]);
            $m=$this->svc->gateway()->enqueueRaw('sms',$phone,'codice_verifica','Il codice di verifica Rizzo Salus è '.$code.'. Scade tra '.max(1,min(30,$minutes)).' minuti. Non condividerlo.','', 'otp:'.$r['id'],['urgente'=>true]);
            return ['challenge'=>$r['id'],'scadenza'=>$r['expires_at'],'modalita'=>$this->svc->settings()->get('messaggi.modalita'),'messaggio_id'=>$m['id']];
        });
        if(in_array($result['modalita'],['live','interno'],true)){
            $this->svc->gateway()->deliver($result['messaggio_id']);
            $m=$this->svc->store->get('messages',$result['messaggio_id']);
            if(($m['status']??null)!=='inviato')throw new ApiError('otp_invio_non_riuscito',503);
        }
        return $result;
    }
    public function verify(string $id,string $code,string $scope,string $subject): void
    {
        // Nessuna eccezione nel lock: i tentativi falliti devono essere salvati.
        $ok=$this->svc->store->transaction(function () use ($id,$code,$scope,$subject) {
            $r=$this->svc->store->get('otp_challenges',$id);
            if (!$r || $r['scope']!==$scope || $r['subject']!==$subject || $r['used_at'] || $r['expires_at']<Clock::stamp() || $r['attempts']>=5) return false;
            $r['attempts']++;
            $valid=preg_match('/^\d{6}$/',$code) && password_verify($code,$r['hash']);
            if ($valid) $r['used_at']=Clock::stamp();
            $this->svc->store->put('otp_challenges',$r);
            return (bool)$valid;
        });
        if (!$ok) throw new ApiError('otp_non_valido',422);
    }
}
