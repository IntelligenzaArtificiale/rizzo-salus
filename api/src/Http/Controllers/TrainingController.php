<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Core\ApiError;
use App\Domain\Management\Training;
use App\Http\{Context,Response};
use App\Support\Validator as V;
final class TrainingController
{
    public function list(Context $c): array { return ['documenti'=>Training::rows($c),'gestibile'=>$c->role()==='titolare']; }
    public function save(Context $c): array { return Training::save($c); }
    public function remove(Context $c): array
    {
        if ($c->role()!=='titolare') throw ApiError::forbidden();
        $id=V::id($c->body(),'id','frm',true);
        $r=$c->svc->store->get('training_documents',$id)??throw ApiError::notFound();
        if (($c->body()['revision']??null)!==$r['revision']) throw new ApiError('revisione_vecchia',409);
        $c->svc->store->softDelete('training_documents',$id);
        $c->svc->audit()->log('formazione.elimina','training_documents',$id);
        return ['eliminato'=>true];
    }
    public function download(Context $c): Response
    {
        $c->user();
        $r=$c->svc->store->get('training_documents',(string)($c->req->query['id']??''))??throw ApiError::notFound();
        if (!Training::visible($c,$r)) throw ApiError::forbidden();
        if (empty($r['file'])) throw ApiError::notFound();
        $f=$c->svc->files()->read($r['file']['id']);
        return Response::file($f['bytes'],$f['meta']['mime'],$f['meta']['name']);
    }
}
