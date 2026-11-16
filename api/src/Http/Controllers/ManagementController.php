<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\{ApiError,Clock};
use App\Domain\Management\{Stock,Staff,Expenses};
use App\Http\{Context,Response};
use App\Support\Validator as V;
final class ManagementController
{
    public function stock(Context $c): array {$c->need('magazzino.gestisci','magazzino.consumi');$d=(new Stock($c->svc))->list();if(!$c->can('magazzino.gestisci')){foreach($d['articoli'] as &$i)unset($i['costo_cents'],$i['fornitore_id']);$d['fornitori']=[];$d['movimenti']=[];}return $d;}
    public function articolo(Context $c): array {$c->need('magazzino.gestisci');return (new Stock($c->svc))->item($c->body());}
    public function fornitore(Context $c): array {$c->need('magazzino.gestisci');return (new Stock($c->svc))->supplier($c->body());}
    public function movimento(Context $c): array
    {
        $c->need('magazzino.gestisci','magazzino.consumi');$b=$c->body();
        if(!$c->can('magazzino.gestisci')&&($b['quantita']??0)>=0)throw ApiError::forbidden();
        return (new Stock($c->svc))->move($b,'manuale:'.$c->userId().':'.V::str($b,'chiave',true,80));
    }
    public function personale(Context $c): array {$c->need('personale.presenze','personale.propria_scheda');return (new Staff($c->svc))->summary($c,V::str($c->body(),'mese',false,7)??substr(Clock::today(),0,7));}
    public function presenza(Context $c): array {return (new Staff($c->svc))->save($c,$c->body());}
    public function contratto(Context $c): array {$c->need('personale.presenze');return (new Staff($c->svc))->contract($c->body());}
    public function spese(Context $c): array {$c->need('statistiche.economiche');return (new Expenses($c->svc))->period(V::date($c->body(),'da',true),V::date($c->body(),'a',true));}
    public function spesa(Context $c): array {$c->need('statistiche.economiche');return (new Expenses($c->svc))->save($c->body());}
    public function allegato(Context $c): Response
    {
        $b=$c->body();$kind=V::enum($b,'tipo',['presenza','spesa'],true);$col=$kind==='presenza'?'staff_attendance':'expenses';$r=$c->svc->store->get($col,V::str($b,'id',true,80)) ?? throw ApiError::notFound();
        if($kind==='presenza'){$c->need('personale.presenze','personale.propria_scheda');(new Staff($c->svc))->own($c,$r['professional_id']);$meta=$r['giustificativo']??null;}
        else{$c->need('statistiche.economiche');$meta=$r['file']??null;}
        if(!$meta)throw ApiError::notFound();$f=$c->svc->files()->read($meta['id']);$c->svc->audit()->read($col,$r['id']);return Response::file($f['bytes'],$f['meta']['mime'],$f['meta']['name']);
    }

    public function personaleCsv(Context $c): Response
    {
        $d=$this->personale($c);$f=fopen('php://temp','w+');fputcsv($f,['Professionista','Mese','Ore contratto','Ore agenda','Ore effettive','Differenza'], ';', '"','');
        foreach($d['righe'] as $r)fputcsv($f,[$r['nome'],$d['mese'],$r['contrattuali_min']/60,$r['programmate_min']/60,$r['effettive_min']/60,$r['differenza_min']/60],';','"','');
        rewind($f);return Response::file(stream_get_contents($f),'text/csv','presenze-'.$d['mese'].'.csv');
    }
}
