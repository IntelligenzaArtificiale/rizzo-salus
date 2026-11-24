<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\ApiError;
use App\Domain\Patients\Documents;
use App\Http\{Context,Response};
use App\Support\Validator as V;
final class DocumentsController
{
    public function bozza(Context $c): array {return \App\Domain\Patients\ClinicalDraft::build($c,$c->body());}
    public function elenco(Context $c): array { $d=new Documents($c->svc);return ['documenti'=>$d->list($c,V::id($c->body(),'patient_id','paz',true)),'rilascio_consentito'=>$d->releaseAllowed($c->body()['patient_id'])]; }
    public function anteprimaModello(Context $c): array
    {
        $c->need('pazienti.anagrafica');
        $c->need('documenti.moduli');
        $docs = new Documents($c->svc);
        $p = $docs->patient($c, V::id($c->body(), 'patient_id', 'paz', true));
        $template = $docs->compilaModello($c, $p, (string)V::str($c->body(), 'modello_id', true, 80));
        return ['contenuto' => $template['compilato']];
    }
    public function salva(Context $c): array { return (new Documents($c->svc))->save($c,$c->body()); }
    public function modelli(Context $c): array { $c->need('documenti.moduli');return ['modelli'=>(new Documents($c->svc))->templates()]; }
    public function modelloSalva(Context $c): array { $c->need('impostazioni.gestisci');$r=(new Documents($c->svc))->saveTemplate($c->body());$c->svc->audit()->log('modello.salva','document_templates',$r['id']);return $r; }
    public function link(Context $c): array { return (new Documents($c->svc))->link($c,V::id($c->body(),'id','doc',true)); }
    public function scarica(Context $c): Response
    {
        $d=$c->svc->store->get('documents',V::id($c->body(),'id','doc',true)) ?? throw ApiError::notFound();
        if (!(new Documents($c->svc))->visible($c,$d)) throw ApiError::forbidden();
        $f=$c->svc->files()->read($d['file']['id']);$c->svc->audit()->read('documents',$d['id']);
        return Response::file($f['bytes'],$f['meta']['mime'],$f['meta']['name']);
    }
    public function pubblico(Context $c): array { return (new Documents($c->svc))->evidence(V::str($c->body(),'token',true,100),$c->req->ip,V::bool($c->body(),'letto')); }
    public function otp(Context $c): array { return (new Documents($c->svc))->requestOtp(V::str($c->body(),'token',true,100),$c->req->ip); }
    public function accetta(Context $c): array
    {
        $b=$c->body();return (new Documents($c->svc))->accept(V::str($b,'token',true,100),V::str($b,'challenge',true,80),V::str($b,'codice',true,6),$c->req->ip);
    }
}
