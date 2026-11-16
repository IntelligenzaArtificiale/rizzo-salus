<?php
declare(strict_types=1);
namespace App\Domain\Patients;
use App\Core\{ApiError,Clock};
use App\Domain\Calendar\Hours;
use App\Http\Context;
use App\Services\Services;
use App\Support\Validator as V;
/** Solo finestre esplicitamente pubblicate; nessuna disponibilità implicita del medico. */
final class BookingSlots
{
    public function __construct(private readonly Services $svc) {}
    public function catalog(): array
    {
        $cfg=$this->svc->settings()->get('prenotazioni',[]);
        $s=$this->svc->settings()->get('struttura',[]);
        $services=[];
        if (!empty($cfg['attive'])) foreach ($this->svc->store->all('therapy_types') as $t) {
            if ($t['categoria']!=='visita'||empty($t['attivo'])||empty($t['prenotabile_online'])) continue;
            $out=['id'=>$t['id'],'nome'=>$t['nome'],'durata_min'=>$t['durata_min']];
            if (!empty($cfg['mostra_prezzi'])) $out['tariffa']=$t['tariffa'];
            $services[]=$out;
        }
        return ['attive'=>!empty($cfg['attive']),'servizi'=>$services,'informativa'=>$cfg['informativa']??'',
            'domande'=>$cfg['domande']??[],'mostra_professionista'=>$cfg['mostra_professionista']??true,
            'struttura'=>array_intersect_key($s,array_flip(['ragione_sociale','telefono','indirizzo','citta']))];
    }
    public function saveWindow(Context $c,array $b): array
    {
        $pro=V::id($b,'professional_id','pro',true);
        if (!$c->can('prenotazioni.liste_attesa') && ($c->user()['professional_id']??null)!==$pro) throw ApiError::forbidden();
        $p=$this->svc->store->get('professionals',$pro) ?? throw ApiError::notFound();
        $t=$this->svc->store->get('therapy_types',V::id($b,'therapy_type_id','ter',true)) ?? throw ApiError::notFound();
        if ($p['tipo']!=='medico'||$t['categoria']!=='visita') throw new ApiError('solo_visite_mediche',422);
        $date=V::date($b,'date',true);$from=V::time($b,'da',true);$to=V::time($b,'a',true);
        if ($from>=$to || $date<Clock::today() || !Hours::fits($this->svc->hours()->professionalWindows($p,$date),Clock::minutes($from),Clock::minutes($to))) throw new ApiError('fascia_non_valida',422);
        $cur=empty($b['id'])?[]:($this->svc->store->get('booking_windows',V::id($b,'id','fin',true)) ?? throw ApiError::notFound());
        if ($cur && $cur['professional_id']!==$pro) throw ApiError::forbidden();
        $r=$this->svc->store->put('booking_windows',array_replace($cur,['professional_id'=>$pro,'therapy_type_id'=>$t['id'],'date'=>$date,'da'=>$from,'a'=>$to,'pubblicata'=>V::bool($b,'pubblicata',true)]),V::int($b,'revision'));
        $this->svc->store->put('notifications',['tipo'=>'nuova_disponibilita','stato'=>'aperta','titolo'=>'Nuova disponibilità medica','professional_id'=>$pro,'window_id'=>$r['id'],'date'=>$date]);
        $this->svc->audit()->log('prenotazioni.finestra','booking_windows',$r['id']);return $r;
    }
    public function slots(string $type,string $date): array
    {
        $cfg=$this->svc->settings()->get('prenotazioni',[]);
        if (empty($cfg['attive'])) return [];
        $t=$this->svc->store->get('therapy_types',$type);
        if (!$t||$t['categoria']!=='visita'||empty($t['prenotabile_online'])||empty($t['attivo'])) return [];
        if ($date<Clock::today()||$date>Clock::addDays(Clock::today(),(int)$cfg['orizzonte_giorni'])) return [];
        $out=[];$min=Clock::stamp(Clock::now()->modify('+'.max(0,(int)$cfg['anticipo_minimo_ore']).' hours'));
        foreach ($this->svc->store->all('booking_windows',fn($w)=>$w['therapy_type_id']===$type&&$w['date']===$date&&!empty($w['pubblicata'])) as $w) {
            $pro=$this->svc->store->get('professionals',$w['professional_id']);
            if (!$pro||empty($pro['attivo'])||empty($pro['prenotabile_online'])) continue;
            $dur=(int)$t['durata_min'];$step=max(5,(int)$cfg['passo_minuti']);
            for($m=Clock::minutes($w['da']);$m+$dur<=Clock::minutes($w['a']);$m+=$step) {
                $start=$date.'T'.Hours::hhmm($m).':00';
                if ($start<$min) continue;
                $a=['tipo'=>'visita','stato'=>'programmato','start'=>$start,'end'=>Clock::addMinutes($start,$dur),'professional_id'=>$pro['id'],'resource_id'=>$t['risorsa_id']??null];
                $check=$this->svc->checker()->check($a);
                if ($check['conflitti']||$check['avvisi']) continue;
                $slot=['window_id'=>$w['id'],'start'=>$start,'end'=>$a['end']];
                if (!empty($cfg['mostra_professionista'])) $slot['professionista']=$pro['cognome'].' '.$pro['nome'];
                $out[$w['id'].'|'.$start]=$slot;
            }
        }
        return array_values($out);
    }
    public function findSlot(string $window,string $start): array
    {
        $w=$this->svc->store->get('booking_windows',$window) ?? throw new ApiError('slot_non_disponibile',409);
        foreach ($this->slots($w['therapy_type_id'],substr($start,0,10)) as $slot) if ($slot['window_id']===$window&&$slot['start']===$start) return $w;
        throw new ApiError('slot_non_disponibile',409);
    }
}
