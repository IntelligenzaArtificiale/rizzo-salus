<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Auth\Permissions;
use App\Core\ApiError;
use App\Core\Env;
use App\Http\Context;
use App\Support\Validator as V;

/** Gestione utenti: solo chi ha impostazioni.gestisci (titolare). */
final class UsersController
{
    public function elenco(Context $c): array
    {
        $u = $c->svc->users();
        $rows = array_map(static fn ($x) => $u->publicView($x), $c->svc->store->all('users'));
        usort($rows, static fn ($a, $b) => strcasecmp($a['name'], $b['name']));
        return $rows;
    }

    public function dettaglio(Context $c): array
    {
        $x = $c->svc->users()->get(V::id($c->body(), 'id', 'usr', true));
        if ($x === null || !empty($x['deleted_at'])) {
            throw ApiError::notFound();
        }
        return $c->svc->users()->publicView($x) + ['permessi' => $c->svc->users()->permissions($x)];
    }

    public function salva(Context $c): array
    {
        $d = $c->body()['dati'] ?? $c->body();
        $id = V::id($d, 'id', 'usr');
        $role = V::enum($d, 'role', Permissions::ROLES, true);
        $extra = $d['permessi_extra'] ?? ['aggiunti' => [], 'tolti' => []];
        foreach (['aggiunti', 'tolti'] as $k) {
            foreach ($extra[$k] ?? [] as $p) {
                if (!isset(Permissions::ALL[$p])) {
                    throw new ApiError('permesso_non_valido', 422);
                }
            }
        }
        $proId = V::id($d, 'professional_id', 'pro');
        if ($proId !== null && $c->svc->store->get('professionals', $proId) === null) {
            throw new ApiError('professionista_non_trovato', 422);
        }
        $svc = $c->svc;
        return $svc->store->transaction(function () use ($svc, $d, $id, $role, $extra, $proId) {
            $email = V::email($d, 'email', true);
            if ($id === null) {
                $user = $svc->users()->create([
                    'nome' => V::str($d, 'nome', true, 80), 'cognome' => V::str($d, 'cognome', true, 80), 'email' => $email,
                    'role' => $role, 'professional_id' => $proId, 'permessi_extra' => $extra, 'attivo' => V::bool($d, 'attivo', true),
                ]);
                $svc->auth()->invite($user);
                $svc->audit()->log('utente_creato', 'users', $user['id'], null, ['role' => $role, 'attivo' => $user['attivo']]);
                return $svc->users()->publicView($user);
            }
            $before = $svc->users()->get($id) ?? throw ApiError::notFound();
            if ($before['role'] === 'titolare' && $role !== 'titolare') {
                $svc->users()->assertOwnerRemains($id);
            }
            $other = $svc->users()->byEmail($email);
            if ($other !== null && $other['id'] !== $id) {
                throw new ApiError('email_esistente', 409);
            }
            $after = array_replace($before, [
                'nome' => V::str($d, 'nome', true, 80), 'cognome' => V::str($d, 'cognome', true, 80), 'email' => $email,
                'role' => $role, 'professional_id' => $proId, 'permessi_extra' => $extra,
            ]);
            $saved = $svc->store->put('users', $after, V::int($d, 'revision'));
            $svc->audit()->log('utente_modificato', 'users', $id, $before, $saved);
            return $svc->users()->publicView($saved);
        });
    }

    public function stato(Context $c): array
    {
        $id = V::id($c->body(), 'id', 'usr', true);
        $active = V::bool($c->body(), 'attivo');
        $svc = $c->svc;
        return $svc->store->transaction(function () use ($svc, $id, $active, $c) {
            $u = $svc->users()->get($id) ?? throw ApiError::notFound();
            if (!$active) {
                if ($u['role'] === 'titolare') {
                    $svc->users()->assertOwnerRemains($id);
                }
                if ($id === $c->userId()) {
                    throw new ApiError('non_puoi_disattivare_te_stesso', 409);
                }
            }
            $saved = $svc->store->put('users', array_replace($u, ['attivo' => $active]));
            $svc->audit()->log($active ? 'utente_riattivato' : 'utente_disattivato', 'users', $id);
            return $svc->users()->publicView($saved);
        });
    }

    /** Il titolare azzera la 2FA di chi ha perso il telefono. */
    public function azzeraDuePassi(Context $c): array
    {
        $id = V::id($c->body(), 'id', 'usr', true);
        $u = $c->svc->users()->get($id) ?? throw ApiError::notFound();
        $c->svc->store->put('users', array_replace($u, ['totp_enabled' => false, 'totp_secret' => null]));
        $c->svc->audit()->log('due_fattori_azzerata', 'users', $id);
        return [];
    }

    public function reinvita(Context $c): array
    {
        $u = $c->svc->users()->get(V::id($c->body(), 'id', 'usr', true)) ?? throw ApiError::notFound();
        $c->svc->auth()->invite($u);
        return [];
    }

    /** Disattiva e nasconde l'utente; i riferimenti storici (audit, appuntamenti) restano validi. */
    public function elimina(Context $c): array
    {
        $id = V::id($c->body(), 'id', 'usr', true);
        $svc = $c->svc;
        return $svc->store->transaction(function () use ($svc, $id, $c) {
            $u = $svc->users()->get($id) ?? throw ApiError::notFound();
            if ($id === $c->userId()) {
                throw new ApiError('non_puoi_disattivare_te_stesso', 409);
            }
            if ($u['role'] === 'titolare') {
                $svc->users()->assertOwnerRemains($id);
            }
            $svc->store->put('users', array_replace($u, ['attivo' => false, 'deleted_at' => \App\Core\Clock::stamp()]));
            $svc->audit()->log('utente_eliminato', 'users', $id);
            return [];
        });
    }
}
