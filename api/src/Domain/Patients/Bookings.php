<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\{ApiError,Clock};
use App\Services\{Services,Otp};
use App\Support\Validator as V;
final class Bookings
{
    public function __construct(private readonly Services $svc) {}
    public function request(array $b,string $ip): array
    {
        if (!$this->svc->settings()->get('prenotazioni.attive',false) || !$this->svc->settings()->get('prenotazioni.informativa','')) throw new ApiError('prenotazioni_non_attive',503);
        if (!V::bool($b,'privacy_letta')) throw new ApiError('lettura_richiesta',422);
        $this->svc->limiter()->hit('booking_request',$ip,10,3600);
        $wait=V::bool($b,'attesa');
        $t=$this->svc->store->get('therapy_types',V::id($b,'therapy_type_id','ter',true)) ?? throw ApiError::notFound();
        if ($t['categoria']!=='visita'||empty($t['prenotabile_online'])||empty($t['attivo'])) throw new ApiError('solo_visite_mediche',422);
        if (!$wait) (new BookingSlots($this->svc))->findSlot(V::id($b,'window_id','fin',true),V::stamp($b,'start',true));
        $p=$this->svc->patients()->normalize($b);
        if (!$p['telefono']||!$p['data_nascita']) throw new ApiError('dati_mancanti',422);
        $answers=[];
        foreach ($this->svc->settings()->get('prenotazioni.domande',[]) as $i=>$q) {
            $text=trim((string)($b['risposte'][$i]??''));
            if ((!empty($q['obbligatoria'])&&!$text)||mb_strlen($text)>1000) throw new ApiError('risposta_mancante',422);
            $answers[]=['domanda'=>$q['testo'],'risposta'=>$text];
        }
        $r=$this->svc->store->put('bookings_online',['stato'=>'da_verificare','attesa'=>$wait,'therapy_type_id'=>$t['id'],'window_id'=>$wait?null:$b['window_id'],
            'start'=>$wait?null:$b['start'],'expires_at'=>Clock::stamp(Clock::now()->modify('+15 minutes')),'dati'=>['paziente'=>$p,'risposte'=>$answers]]);
        $otp=(new Otp($this->svc))->issue('prenotazione',$r['id'],$p['telefono'],$ip,(int)$this->svc->settings()->get('prenotazioni.otp_scadenza_minuti',10));
        return ['id'=>$r['id'],'challenge'=>$otp['challenge'],'modalita'=>$otp['modalita']];
    }
    public function confirm(array $b): array
    {
        $id=V::id($b,'id','pre',true);$r=$this->svc->store->get('bookings_online',$id) ?? throw ApiError::notFound();
        if ($r['stato']!=='da_verificare'||$r['expires_at']<Clock::stamp()) throw new ApiError('richiesta_scaduta',410);
        (new Otp($this->svc))->verify(V::id($b,'challenge','otp',true),V::str($b,'codice',true,6),'prenotazione',$id);
        return $this->svc->store->transaction(function () use ($id) {
            $r=$this->svc->store->get('bookings_online',$id);
            if ($r['stato']!=='da_verificare') throw new ApiError('richiesta_gia_elaborata',409);
            $d=$r['dati']['paziente'];$patient=null;
            // Un telefono verificato non autorizza a sovrascrivere l'anagrafica esistente.
            foreach ($this->svc->store->all('patients') as $p) {
                if (($p['telefono']??'')===$d['telefono']&&($p['data_nascita']??'')===$d['data_nascita']&&mb_strtolower($p['cognome'])===mb_strtolower($d['cognome'])) {$patient=$p;break;}
            }
            if (!$r['attesa']) $window=(new BookingSlots($this->svc))->findSlot($r['window_id'],$r['start']);
            $patient??=$this->svc->patients()->create($d);
            if ($r['attesa']) {
                $item=$this->svc->store->put('waitlist',['patient_id'=>$patient['id'],'therapy_type_id'=>$r['therapy_type_id'],'professional_id'=>null,'stato'=>'in_attesa','nota'=>'Richiesta pubblica verificata','created_on'=>Clock::today()]);
                $this->svc->store->put('notifications',['tipo'=>'lista_attesa','stato'=>'aperta','titolo'=>'Nuova richiesta in lista d’attesa','waitlist_id'=>$item['id']]);
                $r['waitlist_id']=$item['id'];
            } else {
                if ($window['therapy_type_id']!==$r['therapy_type_id']) throw new ApiError('slot_non_disponibile',409);
                $appt=$this->svc->agenda()->create(['tipo'=>'visita','start'=>$r['start'],'professional_id'=>$window['professional_id'],'therapy_type_id'=>$r['therapy_type_id'],'patient_id'=>$patient['id']],false,'prenotazione_online');
                $appt=$this->svc->agenda()->setStatus($appt['id'],'confermato');$r['appointment_id']=$appt['id'];
                $this->svc->store->put('notifications',['tipo'=>'prenotazione','stato'=>'aperta','titolo'=>'Visita prenotata e verificata','appointment_id'=>$appt['id']]);
            }
            $r['patient_id']=$patient['id'];$r['stato']='confermata';$this->svc->store->put('bookings_online',$r);
            $this->svc->audit()->log('prenotazione.confermata','bookings_online',$id,null,['patient_id'=>$patient['id']]);
            return ['stato'=>'confermata','lista_attesa'=>$r['attesa']];
        });
    }
}
