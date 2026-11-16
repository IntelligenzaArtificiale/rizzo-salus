<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\{ApiError,Clock};
use App\Domain\Patients\{BookingSlots,Bookings,PatientPortal};
use App\Http\{Context,Response};
use App\Support\Validator as V;
final class BookingController
{
    public function catalogo(Context $c): array { return (new BookingSlots($c->svc))->catalog(); }
    public function slot(Context $c): array { return ['slot'=>(new BookingSlots($c->svc))->slots(V::id($c->body(),'therapy_type_id','ter',true),V::date($c->body(),'date',true))]; }
    public function richiedi(Context $c): array { return (new Bookings($c->svc))->request($c->body(),$c->req->ip); }
    public function conferma(Context $c): array { return (new Bookings($c->svc))->confirm($c->body()); }
    public function portaleOtp(Context $c): array { return (new PatientPortal($c->svc))->request($c->body(),$c->req->ip); }
    public function portaleLogin(Context $c): array { return (new PatientPortal($c->svc))->login($c->body()); }
    public function portale(Context $c): array { return (new PatientPortal($c->svc))->view(V::str($c->body(),'token',true,100)); }
    public function disdetta(Context $c): array { $b=$c->body();return (new PatientPortal($c->svc))->cancellation(V::str($b,'token',true,100),V::id($b,'id','app',true),V::str($b,'motivo',false,500)??''); }
    public function portaleDocumento(Context $c): Response
    {
        $p=(new PatientPortal($c->svc))->patient(V::str($c->body(),'token',true,100));$d=$c->svc->store->get('documents',V::id($c->body(),'id','doc',true)) ?? throw ApiError::notFound();
        if ($d['patient_id']!==$p['id']||empty($d['condiviso'])) throw ApiError::forbidden();
        $f=$c->svc->files()->read($d['file']['id']);return Response::file($f['bytes'],$f['meta']['mime'],$f['meta']['name']);
    }
    public function finestre(Context $c): array
    {
        $c->need('prenotazioni.liste_attesa','prenotazioni.liste_attesa_proprie');
        return ['finestre'=>$c->svc->store->all('booking_windows',fn($w)=>$c->can('prenotazioni.liste_attesa')||$w['professional_id']===($c->user()['professional_id']??null))];
    }
    public function finestraSalva(Context $c): array { $c->need('prenotazioni.liste_attesa','prenotazioni.liste_attesa_proprie');return (new BookingSlots($c->svc))->saveWindow($c,$c->body()); }
    public function gestione(Context $c): array
    {
        $c->need('prenotazioni.liste_attesa');$waiting=$c->svc->store->all('waitlist');
        foreach ($waiting as &$w) {$p=$c->svc->store->get('patients',$w['patient_id']);$w['paziente']=$p['cognome'].' '.$p['nome'];$w['telefono']=$p['telefono'];}
        $avvisi=$c->svc->store->all('notifications',fn($n)=>in_array($n['tipo'],['disdetta','nuova_disponibilita','lista_attesa','prenotazione','slot_liberato'],true)&&$n['stato']==='aperta');
        foreach($avvisi as &$n)$n['candidati']=\App\Domain\Patients\BookingNotifications::candidates($c->svc,$n,$waiting);
        return ['attese'=>$waiting,'avvisi'=>$avvisi];
    }
    public function attesaSalva(Context $c): array
    {
        $c->need('prenotazioni.liste_attesa');$b=$c->body();$pid=V::id($b,'patient_id','paz',true);$patient=$c->svc->store->get('patients',$pid) ?? throw ApiError::notFound();$c->svc->patients()->assertCanSee($c,$patient);
        $type=V::id($b,'therapy_type_id','ter',true);$tt=$c->svc->store->get('therapy_types',$type) ?? throw ApiError::notFound();if($tt['categoria']!=='visita')throw new ApiError('solo_visite_mediche',422);
        $pro=V::id($b,'professional_id','pro');if($pro&&($c->svc->store->get('professionals',$pro)['tipo']??null)!=='medico')throw new ApiError('solo_visite_mediche',422);
        return $c->svc->store->transaction(function()use($c,$b,$pid,$type,$pro){
            foreach($c->svc->store->all('waitlist',fn($w)=>$w['patient_id']===$pid&&$w['therapy_type_id']===$type&&($w['professional_id']??null)===$pro&&$w['stato']!=='chiuso'&&$w['stato']!=='prenotato') as $w)return $w;
            $r=$c->svc->store->put('waitlist',['patient_id'=>$pid,'therapy_type_id'=>$type,'professional_id'=>$pro,'stato'=>'in_attesa','nota'=>V::str($b,'nota',false,1000),'created_on'=>Clock::today()]);$c->svc->audit()->log('attesa.inserita','waitlist',$r['id']);return $r;
        });
    }

    public function gestisci(Context $c): array
    {
        $c->need('prenotazioni.liste_attesa');$b=$c->body();$kind=V::enum($b,'tipo',['attesa','avviso'],true);$col=$kind==='attesa'?'waitlist':'notifications';
        $r=$c->svc->store->get($col,V::str($b,'id',true,80)) ?? throw ApiError::notFound();
        $r['stato']=V::enum($b,'stato',$kind==='attesa'?['in_attesa','contattato','prenotato','chiuso']:['gestita'],true);
        $r['nota_segreteria']=V::str($b,'nota',false,1000);$r['gestito_da']=$c->userId();$r['gestito_at']=Clock::stamp();
        $r=$c->svc->store->put($col,$r,V::int($b,'revision'));$c->svc->audit()->log('prenotazioni.gestione',$col,$r['id']);return $r;
    }
}
