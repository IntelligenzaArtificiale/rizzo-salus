<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Domain\Messaging\CareCommunications;
use App\Http\Context;
use App\Support\Validator as V;
final class CareCommunicationsController
{
 public function ricontatti(Context $c):array{$c->need('messaggi.invia');return ['attivita'=>(new CareCommunications($c->svc))->tasks()];}
 public function completato(Context $c):array{$c->need('messaggi.invia');return (new CareCommunications($c->svc))->complete($c->body());}
 public function campagna(Context $c):array{$c->need('messaggi.invia');return (new CareCommunications($c->svc))->campaign($c->body());}
 public function confermaVisita(Context $c):array{return (new CareCommunications($c->svc))->confirmVisit(V::str($c->body(),'token',true,100),V::bool($c->body(),'conferma'));}
}
