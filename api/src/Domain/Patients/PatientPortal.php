<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\{ApiError,Clock};
use App\Domain\Agenda\Appointments;
use App\Services\{Services,Otp};
use App\Support\Validator as V;
final class PatientPortal
{
    public function __construct(private readonly Services $svc) {}
    public function request(array $b,string $ip): array
    {
        $phone=V::phone($b,'telefono',true);$birth=V::date($b,'data_nascita',true);
        $this->svc->limiter()->hit('portal_request',$ip,6,3600);
        $pid=null;$matches=[];$cf=V::str($b,'codice_fiscale',false,20);
        foreach ($this->svc->store->all('patients') as $p) if (($p['telefono']??'')===$phone&&($p['data_nascita']??'')===$birth&&(!$cf||($p['codice_fiscale']??'')===strtoupper($cf))) $matches[]=$p['id'];
        if(count($matches)===1)$pid=$matches[0];
        // Risposta identica anche quando non c'è corrispondenza; il codice non dà accesso ad altri dati.
        $session=$this->svc->tokens()->issue('portale_verifica',$pid,10,[],false);
        $otp=(new Otp($this->svc))->issue('portale',hash('sha256',$session),$phone,$ip);
        return ['richiesta'=>$session,'challenge'=>$otp['challenge'],'modalita'=>$otp['modalita']];
    }
    public function login(array $b): array
    {
        $raw=V::str($b,'richiesta',true,100);$t=$this->svc->tokens()->peek('portale_verifica',$raw);
        (new Otp($this->svc))->verify(V::id($b,'challenge','otp',true),V::str($b,'codice',true,6),'portale',hash('sha256',$raw));
        $this->svc->tokens()->consume('portale_verifica',$raw);
        if (!$t['subject']) throw new ApiError('dati_non_corrispondenti',403);
        return ['token'=>$this->svc->tokens()->issue('portale',$t['subject'],60,[],false)];
    }
    public function patient(string $token): array
    {
        $t=$this->svc->tokens()->peek('portale',$token);
        $p=$this->svc->store->get('patients',$t['subject']);if(!$p||!empty($p['deleted_at']))throw new ApiError('link_scaduto',410);return $p;
    }
    public function view(string $token): array
    {
        $p=$this->patient($token);$docs=new Documents($this->svc);$released=$docs->releaseAllowed($p['id']);$apps=[];
        foreach ($this->svc->store->all('appointments') as $a) {
            foreach (array_merge(Appointments::refs($a),$a['cancelled_participants']??[]) as $ref) if ($ref['patient_id']===$p['id']) {
                if (!$released && $a['start']>=Clock::stamp()) continue;
                $therapy=$this->svc->store->get('therapy_types',$a['therapy_type_id']);
                $apps[]=['id'=>$a['id'],'start'=>$a['start'],'end'=>$a['end'],'stato'=>$a['stato']==='annullato'?'annullato':$ref['stato'],'prestazione'=>$therapy['nome']??'Appuntamento','tipo'=>$a['tipo']];
            }
        }
        usort($apps,fn($a,$b)=>strcmp($b['start'],$a['start']));
        $episodes=[];
        foreach ($this->svc->store->all('episodes',fn($e)=>$e['patient_id']===$p['id']) as $e) $episodes[]=['titolo'=>$e['titolo'],'stato'=>$e['stato'],'avanzamento'=>$this->svc->episodes()->progress($e)];
        $files=[];foreach($this->svc->store->all('documents',fn($d)=>($d['patient_id']??null)===$p['id']&&!empty($d['condiviso'])) as $d) $files[]=['id'=>$d['id'],'titolo'=>$d['titolo'],'stato'=>$d['stato']];
        return ['nome'=>$p['nome'],'rilascio_consentito'=>$released,'appuntamenti'=>$apps,'percorsi'=>$episodes,'documenti'=>$files,
            'richieste'=>$this->svc->store->all('notifications',fn($n)=>($n['patient_id']??null)===$p['id']&&$n['tipo']==='disdetta')];
    }
    public function cancellation(string $token,string $id,string $reason): array
    {
        $p=$this->patient($token);
        return $this->svc->store->transaction(function () use ($p,$id,$reason) {
            $a=$this->svc->store->get('appointments',$id) ?? throw ApiError::notFound();
            if ($a['start']<Clock::stamp()||$a['stato']==='annullato'||!in_array($p['id'],array_column(Appointments::refs($a),'patient_id'),true)) throw ApiError::forbidden();
            foreach ($this->svc->store->all('notifications',fn($n)=>($n['appointment_id']??null)===$id&&($n['patient_id']??null)===$p['id']&&$n['tipo']==='disdetta'&&$n['stato']==='aperta') as $existing) return ['stato'=>'richiesta_inviata'];
            $this->svc->store->put('notifications',['tipo'=>'disdetta','stato'=>'aperta','titolo'=>'Richiesta di disdetta: contattare il paziente','patient_id'=>$p['id'],'appointment_id'=>$id,'motivo'=>mb_substr($reason,0,500)]);
            return ['stato'=>'richiesta_inviata'];
        });
    }
}
