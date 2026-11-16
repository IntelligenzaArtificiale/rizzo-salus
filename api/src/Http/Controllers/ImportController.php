<?php
declare(strict_types=1);
namespace App\Http\Controllers;
use App\Domain\Management\{Migration,PurchaseImport};
use App\Http\Context;
final class ImportController
{
 public function anteprima(Context $c):array{$c->need('impostazioni.gestisci');return (new Migration($c->svc))->preview($c->body());}
 public function valida(Context $c):array{$c->need('impostazioni.gestisci');return (new Migration($c->svc))->validate($c->body());}
 public function applica(Context $c):array{$c->need('impostazioni.gestisci');return (new Migration($c->svc))->apply($c->body());}
 public function acquistoAnteprima(Context $c):array{$c->need('magazzino.gestisci');return (new PurchaseImport($c->svc))->preview($c->body());}
 public function acquistoApplica(Context $c):array{$c->need('magazzino.gestisci');return (new PurchaseImport($c->svc))->apply($c->body());}
}
