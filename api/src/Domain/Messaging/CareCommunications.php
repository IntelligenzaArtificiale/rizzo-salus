<?php
declare(strict_types=1);
namespace App\Domain\Messaging;
use App\Core\{ApiError,Clock,Env};
use App\Domain\Agenda\Appointments;
use App\Domain\Patients\Documents;
use App\Services\Services;
use App\Support\Validator as V;
final class CareCommunications
{
    public function __construct(private readonly Services $svc) {}
    public function refresh(): array
    {
        if(!$this->svc->settings()->get('messaggi.followup.attivo',true))return ['attivita'=>0];
        $n=0;
        foreach($this->svc->store->all('episodes') as $e){
            $progress=$this->svc->episodes()->progress($e);if(!$progress||$e['stato']==='sospeso')continue;
            if($e['stato']!=='concluso'&&array_filter($progress,fn($l)=>$l['eseguite']<$l['sedute_previste']))continue;
            $last=null;$days=$e['followup_giorni']??0;
            foreach($progress as $l){if($l['ultima']&&(!$last||$l['ultima']>$last))$last=$l['ultima'];$type=$this->svc->store->get('therapy_types',$l['therapy_type_id']);if(empty($e['followup_giorni']))$days=max($days,(int)($l['followup_giorni']??$type['followup_giorni']??$this->svc->settings()->get('messaggi.followup.giorni_default',15)));}
            if(!$last)continue;
            $due=Clock::addDays(substr($last,0,10),max(1,$days));
            if($due>Clock::today())continue;
            $key='followup:'.$e['id'].':'.substr($last,0,10);
            $this->task($key,['tipo'=>'followup','patient_id'=>$e['patient_id'],'episode_id'=>$e['id'],'data_prevista'=>$due]);$n++;
        }
        return ['attivita'=>$n];
    }
    private function task(string $key,array $d): array
    {
        return $this->svc->store->transaction(function()use($key,$d){
            foreach($this->svc->store->all('reminders',fn($r)=>($r['chiave']??null)===$key) as $r)return $r;
            return $this->svc->store->put('reminders',$d+['chiave'=>$key,'stato'=>'da_contattare']);
        });
    }
    public function tasks(): array
    {
        $this->refresh();$out=[];
        foreach($this->svc->store->all('reminders',fn($r)=>in_array($r['tipo']??'',['followup','recensione'],true)&&$r['data_prevista']<=Clock::today()&&$r['stato']==='da_contattare') as $r){
            $p=$this->svc->store->get('patients',$r['patient_id']);if(!$p)continue;
            if($r['tipo']==='recensione'&&!empty($p['non_inviare_recensione']))continue;
            $r['paziente']=$p['cognome'].' '.$p['nome'];$r['telefono']=$p['telefono'];
            try{$text=Templates::render($this->svc->templates()->get($r['tipo'])['testo'],['nome'=>$p['nome'],'cognome'=>$p['cognome']]+$this->svc->gateway()->baseVars());}catch(ApiError $err){if($err->errorCode!=='segnaposto_mancante')throw $err;$text='';$r['errore_configurazione']='Completa il modello del messaggio e i riferimenti della struttura nelle impostazioni.';}
            $r['testo']=$text;$r['link_whatsapp']=$text!==''&&!empty($p['consensi']['whatsapp']['valore'])&&!empty($p['telefono'])?'https://wa.me/'.preg_replace('/\D/','',$p['telefono']).'?text='.rawurlencode($text):null;
            $out[]=$r;
        }
        return $out;
    }
    public function complete(array $b): array
    {
        return $this->svc->store->transaction(function()use($b){
            $r=$this->svc->store->get('reminders',V::id($b,'id','rim',true)) ?? throw ApiError::notFound();
            if(!in_array($r['tipo'],['followup','recensione'],true))throw ApiError::forbidden();
            if($r['stato']!=='da_contattare')return $r;
            $r['stato']=V::bool($b,'scarta')?'scartato':'contattato';$r['completato_at']=Clock::stamp();$r['completato_da']=$this->svc->store->actor();$r=$this->svc->store->put('reminders',$r);
            if($r['tipo']==='followup'&&$r['stato']==='contattato'){
                $p=$this->svc->store->get('patients',$r['patient_id']);$allow=empty($p['non_inviare_recensione']);
                $months=(int)$this->svc->settings()->get('messaggi.followup.recensione_mesi_tra_richieste',12);
                $limit=Clock::stamp(Clock::now()->modify('-'.$months.' months'));
                foreach($this->svc->store->all('reminders',fn($x)=>($x['patient_id']??null)===$p['id']&&($x['tipo']??'')==='recensione'&&$x['stato']==='contattato'&&($x['completato_at']??'')>$limit) as $_)$allow=false;
                if($allow)$this->task('review:'.$r['id'],['tipo'=>'recensione','patient_id'=>$p['id'],'episode_id'=>$r['episode_id'],'data_prevista'=>Clock::addDays(Clock::today(),(int)$this->svc->settings()->get('messaggi.followup.recensione_dopo_giorni',3))]);
            }
            $this->svc->audit()->log('ricontatto.'.$r['stato'],'reminders',$r['id']);return $r;
        });
    }
    public function campaign(array $b): array
    {
        $text=V::str($b,'testo',true,1400);$channel=V::enum($b,'canale',['sms','whatsapp','email'],true);$insurance=V::enum($b,'assicurazione',['tutte','nessuna','privata','convenzionata'],false,'tutte');
        $recipients=[];
        foreach($this->svc->store->all('patients') as $p){
            if(empty($p['consensi']['marketing']['valore'])||($p['canale_preferito']??null)==='nessuno')continue;
            if($insurance!=='tutte'&&($p['assicurazione']??'nessuna')!==$insurance)continue;
            if($channel==='whatsapp'&&empty($p['consensi']['whatsapp']['valore']))continue;
            $to=$channel==='email'?($p['email']??null):($p['telefono']??null);if(!$to)continue;
            $recipients[]=['id'=>$p['id'],'nome'=>$p['nome'],'cognome'=>$p['cognome'],'to'=>$to];
        }
        if(!V::bool($b,'approva'))return ['destinatari'=>array_map(fn($r)=>array_intersect_key($r,array_flip(['id','nome','cognome'])),$recipients),'totale'=>count($recipients),'testo'=>$text];
        return $this->svc->store->transaction(function()use($b,$text,$channel,$recipients){
            $key=V::str($b,'chiave',true,80);foreach($this->svc->store->all('campaigns',fn($r)=>$r['chiave']===$key) as $r)return $r;
            $r=$this->svc->store->put('campaigns',['testo'=>$text,'canale'=>$channel,'chiave'=>$key,'destinatari'=>array_column($recipients,'id'),'stato'=>'approvata']);
            foreach($recipients as $i=>$p)$this->svc->gateway()->enqueueRaw($channel,$p['to'],'campagna',$text."\nPer non ricevere comunicazioni contatta la segreteria.",'Novità dalla struttura','campaign:'.$r['id'].':'.$p['id'],['marketing'=>true,'tecnico'=>false,'patient_id'=>$p['id'],'campaign_id'=>$r['id'],'next_attempt_at'=>Clock::addMinutes(Clock::stamp(),intdiv($i,20))]);
            $this->svc->audit()->log('campagna.approvata','campaigns',$r['id'],null,['destinatari'=>count($recipients)]);return $r;
        });
    }
    public function visitReminders(): array
    {
        $tomorrow=Clock::addDays(Clock::today(),1);$count=0;
        foreach($this->svc->appointments()->between($tomorrow,Clock::addDays($tomorrow,1)) as $a){
            if($a['tipo']!=='visita'||!in_array($a['stato'],['programmato','confermato'],true))continue;
            if(!(new Documents($this->svc))->releaseAllowed($a['patient_id']))continue;
            $p=$this->svc->store->get('patients',$a['patient_id']);if(empty($p['telefono']))continue;
            $key='visit-confirm:'.$a['id'].':'.$a['version'];$exists=$this->svc->store->all('messages',fn($m)=>$m['idempotency_key']===$key);if($exists)continue;
            $token=$this->svc->tokens()->issue('conferma_visita',$a['id'],2880,['patient_id'=>$p['id'],'version'=>$a['version']],false);
            $url=\App\Core\PublicUrl::root().'/#/conferma-visita/'.$token;
            $this->svc->gateway()->enqueueRaw('sms',$p['telefono'],'conferma_visita','Conferma la visita di domani alle '.substr($a['start'],11,5).': '.$url,'',$key,['patient_id'=>$p['id'],'tecnico'=>false]);$count++;
        }
        return ['accodati'=>$count];
    }
    public function confirmVisit(string $raw,bool $confirm): array
    {
        $t=$this->svc->tokens()->peek('conferma_visita',$raw);$a=$this->svc->store->get('appointments',$t['subject']) ?? throw ApiError::notFound();
        if($a['stato']==='annullato'||$a['version']!==$t['data']['version']||$a['start']<Clock::stamp())throw new ApiError('link_scaduto',410);
        if($confirm)$this->svc->store->transaction(function()use($a){$a['conferma_paziente_at']=Clock::stamp();$this->svc->store->put('appointments',$a,$a['revision']);});
        return ['start'=>$a['start'],'confermata'=>$confirm||!empty($a['conferma_paziente_at'])];
    }
    public function doctorDigest(): array
    {
        $date=Clock::addDays(Clock::today(),1);$by=[];
        foreach($this->svc->appointments()->between($date,Clock::addDays($date,1)) as $a)if($a['tipo']==='visita'&&!empty($a['conferma_paziente_at'])&&$a['stato']!=='annullato')$by[$a['professional_id']][]=$a;
        foreach($by as $pro=>$apps){
            $p=$this->svc->store->get('professionals',$pro);if(empty($p['email']))continue;
            usort($apps,fn($a,$b)=>strcmp($a['start'],$b['start']));
            $this->svc->gateway()->enqueueRaw('email',$p['email'],'riepilogo_medico','Domani '.$date.': '.count($apps).' visite confermate dai pazienti, dalle '.substr($apps[0]['start'],11,5).' alle '.substr($apps[count($apps)-1]['end'],11,5).'. Consulta l’agenda per i dettagli.','Visite confermate per domani','doctor-digest:'.$pro.':'.$date,['tecnico'=>false]);
        }
        return ['professionisti'=>count($by)];
    }
}
