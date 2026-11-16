<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\{ApiError,Clock};
use App\Http\{Context,Response};
use App\Support\Validator as V;
final class CompensationWorkflowController
{
    public function eccezione(Context $c): array
    {
        $c->need('compensi.vedi_tutti');$b=$c->body();$id=V::id($b,'appointment_id','app',true);
        return $c->svc->store->transaction(function()use($c,$b,$id){
            foreach($c->svc->store->all('compensations') as $comp)if($comp['stato']!=='calcolato')foreach($comp['righe'] as $r)if($r['appointment_id']===$id)throw new ApiError('compenso_bloccato',409);
            $a=$c->svc->store->get('appointments',$id) ?? throw ApiError::notFound();
            $a['compenso_materiali_cents']=(int)round((V::num($b,'materiali',false,0,100000)??0)*100);
            $a['compenso_percentuale']=V::num($b,'percentuale',false,0,100);$a['compenso_nota']=V::str($b,'nota',false,500);
            if($a['compenso_materiali_cents']>0&&!$a['compenso_nota'])throw new ApiError('motivazione_richiesta',422);
            $c->svc->store->put('appointments',$a,V::int($b,'revision'));$c->svc->audit()->log('compenso.eccezione','appointments',$id);
            return ['salvato'=>true];
        });
    }
    private function load(Context $c): array
    {
        $r=$c->svc->compensations()->get(V::id($c->body(),'id','com',true));
        if(!$c->can('compensi.vedi_tutti')&&(!$c->can('compensi.vedi_propri')||($c->user()['professional_id']??null)!==$r['professional_id']))throw ApiError::forbidden();
        return $r;
    }
    public function ricevuta(Context $c): array
    {
        $c->need('compensi.vedi_tutti');$r=$this->load($c);$b=$c->body();
        if($r['stato']!=='approvato')throw new ApiError('compenso_non_approvato',409);
        $r['ricevuta']=$c->svc->files()->put(base64_decode(V::str($b,'base64',true,22000000),true)?:'',V::str($b,'nome_file',true,120),V::str($b,'mime',true,80),'contabile_compenso','compensations',$r['id']);
        $r=$c->svc->store->put('compensations',$r,$r['revision']);$c->svc->audit()->log('compenso.ricevuta','compensations',$r['id']);return $r;
    }
    public function scarica(Context $c): Response
    {
        $r=$this->load($c);if(empty($r['ricevuta']))throw ApiError::notFound();$f=$c->svc->files()->read($r['ricevuta']['id']);
        return Response::file($f['bytes'],$f['meta']['mime'],$f['meta']['name']);
    }
    public function comunicazione(Context $c): array
    {
        $c->need('compensi.vedi_tutti');$r=$this->load($c);
        $pro=$c->svc->store->get('professionals',$r['professional_id']);
        $text='Riepilogo prestazioni dal '.$r['da'].' al '.$r['a'].': '.count($r['righe']).' prestazioni, compenso € '.number_format($r['quota_professionista_cents']/100,2,',','.').'. Causale proposta: prestazioni professionali '.$r['da'].' / '.$r['a'].'.'.($r['stato']==='liquidato'?' Pagamento registrato dalla segreteria.':' Importo da verificare per l’emissione della fattura.');
        if(!V::bool($c->body(),'approva'))return ['testo'=>$text,'destinatario'=>$pro['email']??''];
        if($r['stato']==='calcolato')throw new ApiError('compenso_non_approvato',422);
        if(empty($pro['email']))throw new ApiError('email_professionista_mancante',422);
        $m=$c->svc->gateway()->enqueueRaw('email',$pro['email'],'compenso',$text,'Riepilogo compensi','compenso:'.$r['id'].':'.$r['stato']);
        $c->svc->audit()->log('compenso.comunicazione','compensations',$r['id']);return ['messaggio_id'=>$m['id'],'stato'=>$m['status']];
    }
}
