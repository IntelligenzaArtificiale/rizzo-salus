<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Http\Context;
use App\Support\Validator as V;

final class AuthController
{
    public function login(Context $c): array
    {
        $b = $c->body();
        $email = V::email($b, 'email', true);
        $password = V::str($b, 'password', true, 200);
        return $c->svc->auth()->login($c->req, $c->session, $email, $password, V::str($b, 'codice', false, 10));
    }

    public function sessione(Context $c): array
    {
        $u = $c->user();
        return $c->svc->auth()->sessionView($u, $c->session);
    }

    public function logout(Context $c): array
    {
        $c->svc->auth()->logout($c->session);
        return [];
    }

    public function passwordDimenticata(Context $c): array
    {
        $email = V::str($c->body(), 'email', false, 190);
        if ($email !== null && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $c->svc->auth()->requestReset($email);
        }
        return []; // sempre ok: non si rivela se l'indirizzo esiste
    }

    public function nuovaPasswordVerifica(Context $c): array
    {
        return ['email' => $c->svc->auth()->verifyReset(V::str($c->body(), 'token', true, 200))];
    }

    public function nuovaPassword(Context $c): array
    {
        $c->svc->auth()->completeReset(V::str($c->body(), 'token', true, 200), V::str($c->body(), 'password', true, 200));
        return [];
    }

    public function primoAvvioStato(Context $c): array
    {
        return ['necessario' => $c->svc->auth()->firstRunNeeded()];
    }

    public function primoAvvioVerifica(Context $c): array
    {
        $c->svc->limiter()->hit('primo-avvio', $c->req->ip, 20, 600);
        $data = $c->svc->auth()->peekFirstRun(V::str($c->body(), 'token', true, 200));
        return ['email' => $data['email'] ?? null];
    }

    public function primoAvvioCrea(Context $c): array
    {
        $c->svc->limiter()->hit('primo-avvio', $c->req->ip, 20, 600);
        $b = $c->body();
        $owner = $c->svc->auth()->createOwner(V::str($b, 'token', true, 200), [
            'nome' => V::str($b, 'nome', true, 80), 'cognome' => V::str($b, 'cognome', true, 80),
            'email' => V::email($b, 'email', true), 'password' => V::str($b, 'password', true, 200),
        ]);
        return $c->svc->users()->publicView($owner);
    }
}
