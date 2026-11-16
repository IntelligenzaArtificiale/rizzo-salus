<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\ApiError;
use App\Domain\Management\ReviewExports;
use App\Http\{Context,Response};
use App\Support\Validator as V;
final class ReviewExportsController
{
 public function elenco(Context $c):array{$c->need('fatture.gestisci','personale.presenze');return ['pacchetti'=>$c->svc->store->all('review_exports',fn($r)=>$r['tipo']==='personale'?$c->can('personale.presenze'):$c->can('fatture.gestisci'))];}
 public function prepara(Context $c):array{if(($c->body()['tipo']??'')==='sts'){$c->need('fatture.gestisci');return (new \App\Domain\Billing\StsBatch($c->svc))->prepare(V::date($c->body(),'da',true),V::date($c->body(),'a',true));}return (new ReviewExports($c->svc))->prepare($c,$c->body());}
 public function approva(Context $c):array{$id=V::id($c->body(),'id','exp',true);$r=$c->svc->store->get('review_exports',$id)??throw ApiError::notFound();if($r['tipo']==='sts'){$c->need('fatture.gestisci');return (new \App\Domain\Billing\StsBatch($c->svc))->send($id);}return (new ReviewExports($c->svc))->approve($c,$c->body());}
 public function esitoSts(Context $c):array{$c->need('fatture.gestisci');return (new \App\Domain\Billing\StsBatch($c->svc))->outcome(V::id($c->body(),'id','exp',true));}
 public function scarica(Context $c):Response{$r=$c->svc->store->get('review_exports',V::id($c->body(),'id','exp',true)) ?? throw ApiError::notFound();(new ReviewExports($c->svc))->access($c,$r);$f=$c->svc->files()->read($r['file']['id']);return Response::file($f['bytes'],$f['meta']['mime'],$f['meta']['name']);}
}
