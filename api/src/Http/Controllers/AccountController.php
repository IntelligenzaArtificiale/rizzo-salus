<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Http\Context;
use App\Support\Validator as V;

final class AccountController
{
    public function salva(Context $c): array
    {
        $u = $c->user();
        $d = $c->body()['dati'] ?? $c->body();
        $u['nome'] = V::str($d, 'nome', true, 80);
        $u['cognome'] = V::str($d, 'cognome', true, 80);
        $saved = $c->svc->store->put('users', $u);
        $c->svc->audit()->log('profilo_modificato', 'users', $u['id']);
        return $c->svc->users()->publicView($saved);
    }

    public function password(Context $c): array
    {
        $b = $c->body();
        $c->svc->auth()->changePassword($c->user(), V::str($b, 'attuale', true, 200), V::str($b, 'nuova', true, 200));
        return [];
    }

    public function duePassiAvvia(Context $c): array
    {
        return $c->svc->auth()->startTotp($c->user());
    }

    public function duePassiConferma(Context $c): array
    {
        $c->svc->auth()->confirmTotp($c->user(), V::str($c->body(), 'codice', true, 10));
        return [];
    }

    public function duePassiDisattiva(Context $c): array
    {
        $c->svc->auth()->disableTotp($c->user(), V::str($c->body(), 'password', true, 200));
        return [];
    }

    public function elimina(Context $c): never
    {
        // Gli account del personale non si cancellano in autonomia: li disattiva il titolare, lo storico resta.
        throw ApiError::forbidden();
    }
}
