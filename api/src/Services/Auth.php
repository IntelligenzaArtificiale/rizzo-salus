<?php
declare(strict_types=1);

namespace App\Services;

use App\Auth\Passwords;
use App\Auth\Totp;
use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Env;
use App\Http\RateLimiter;
use App\Http\Request;
use App\Http\Session;
use App\Store\Store;

/** Accesso: password, blocco dopo troppi errori, 2FA TOTP, reset via link, primo avvio del titolare. */
final class Auth
{
    public function __construct(
        private readonly Store $store,
        private readonly Users $users,
        private readonly Settings $settings,
        private readonly Audit $audit,
        private readonly Tokens $tokens,
        private readonly Outbox $outbox,
        private readonly RateLimiter $limiter,
    ) {
    }

    /** @return array<string,mixed> utente (vista pubblica) + permessi + csrf */
    public function login(Request $req, Session $session, string $email, string $password, ?string $code): array
    {
        $this->limiter->hit('login-ip', $req->ip, 30, 600);
        $this->limiter->hit('login-mail', mb_strtolower($email), 10, 600);

        $user = $this->users->byEmail($email);
        // Verifica sempre una password, anche se l'utente non esiste: tempi simili, nessuna enumerazione.
        $hash = $user['password_hash'] ?? '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$' . str_repeat('A', 43);
        $passwordOk = Passwords::verify($password, $hash);

        if ($user === null || ($user['password_hash'] ?? null) === null) {
            throw new ApiError('credenziali', 401);
        }
        if (!empty($user['deleted_at'])) {
            throw new ApiError('eliminato', 403);
        }
        if (!$user['attivo']) {
            throw new ApiError('disabilitato', 403);
        }
        if (!empty($user['locked_until']) && $user['locked_until'] > Clock::stamp()) {
            throw new ApiError('bloccato', 423);
        }
        if (!$passwordOk) {
            $this->registerFailure($user, $req);
            throw new ApiError('credenziali', 401);
        }

        $needs2fa = !empty($user['totp_enabled']);
        if ($needs2fa) {
            if ($code === null || $code === '') {
                throw new ApiError('codice_richiesto', 401);
            }
            $step = 0;
            if (!Totp::verify((string) $user['totp_secret'], $code, null, $step) || $step <= (int) ($user['totp_last_step'] ?? 0)) {
                $this->registerFailure($user, $req);
                throw new ApiError('codice_errato', 401);
            }
            $user['totp_last_step'] = $step; // impedisce il riuso dello stesso codice
        } elseif ($this->settings->get('sicurezza.due_fattori_obbligatorio.' . $user['role'], false)) {
            // Accesso consentito per attivare la 2FA: l'interfaccia lo obbliga prima di ogni altra cosa.
            $session->set('due_fattori_da_attivare', true);
        }

        $user['failed_logins'] = 0;
        $user['locked_until'] = null;
        $user['ultimo_accesso'] = Clock::stamp();
        if (Passwords::needsRehash($user['password_hash'])) {
            $user['password_hash'] = Passwords::hash($password);
        }
        $this->store->actAs($user['id']);
        $user = $this->store->put('users', $user);
        $session->regenerate();
        $session->set('user_id', $user['id']);
        $session->set('login_at', time());
        $this->audit->log('accesso', 'users', $user['id']);
        return $this->sessionView($user, $session);
    }

    private function registerFailure(array $user, Request $req): void
    {
        $max = (int) $this->settings->get('sicurezza.max_tentativi', 5);
        $minutes = (int) $this->settings->get('sicurezza.blocco_minuti', 15);
        $user['failed_logins'] = (int) ($user['failed_logins'] ?? 0) + 1;
        $locked = $user['failed_logins'] >= $max;
        if ($locked) {
            $user['locked_until'] = Clock::stamp(Clock::now()->modify("+{$minutes} minutes"));
            $user['failed_logins'] = 0;
        }
        $this->store->actAs(null);
        $this->store->put('users', $user);
        $this->audit->log($locked ? 'accesso_bloccato' : 'accesso_fallito', 'users', $user['id']);
    }

    public function sessionView(array $user, Session $session): array
    {
        return $this->users->publicView($user) + [
            'permessi' => $this->users->permissions($user),
            'csrf' => $session->csrf(),
            'attiva_due_fattori' => (bool) $session->get('due_fattori_da_attivare', false) && empty($user['totp_enabled']),
        ];
    }

    public function logout(Session $session): void
    {
        $uid = $session->get('user_id');
        if ($uid) {
            $this->store->actAs($uid);
            $this->audit->log('uscita', 'users', $uid);
        }
        $session->destroy();
    }

    // ------------------------------------------------------------ reset password

    public function requestReset(string $email): void
    {
        $user = $this->users->byEmail($email);
        if ($user === null || !$user['attivo'] || empty($user['password_hash'])) {
            return; // risposta identica: nessuna enumerazione degli indirizzi
        }
        $this->limiter->hit('reset', mb_strtolower($email), 3, 3600);
        $this->tokens->revokeFor('reset_password', $user['id']);
        $raw = $this->tokens->issue('reset_password', $user['id'], 60);
        $link = \App\Core\PublicUrl::root() . '/#/nuova-password/' . $raw;
        $this->outbox->queue('email', $user['email'], 'sistema', "Per scegliere una nuova password apri questo link entro un'ora:\n$link\n\nSe non l'hai chiesto tu, ignora questo messaggio.", 'Nuova password', ['recipient_user_id' => $user['id']]);
        $this->audit->log('reset_password_richiesto', 'users', $user['id']);
    }

    /** Invita un nuovo utente: riceve un link (valido 3 giorni) per scegliere la propria password. */
    public function invite(array $user): void
    {
        $this->tokens->revokeFor('reset_password', $user['id']);
        $raw = $this->tokens->issue('reset_password', $user['id'], 60 * 24 * 3);
        $link = \App\Core\PublicUrl::root() . '/#/nuova-password/' . $raw;
        $this->outbox->queue('email', $user['email'], 'sistema', "Ti è stato creato un accesso al gestionale. Scegli la tua password da questo link, valido 3 giorni:\n$link", 'Il tuo accesso al gestionale', ['recipient_user_id' => $user['id']]);
    }

    public function verifyReset(string $raw): string
    {
        $t = $this->tokens->peek('reset_password', $raw);
        return $this->users->get($t['subject'])['email'] ?? throw new ApiError('link_scaduto', 410);
    }

    public function completeReset(string $raw, string $password): void
    {
        $this->store->transaction(function () use ($raw, $password) {
            if (!Passwords::isAcceptable($password)) {
                throw new ApiError('password_debole', 422);
            }
            $t = $this->tokens->consume('reset_password', $raw);
            $user = $this->users->get($t['subject']) ?? throw new ApiError('link_scaduto', 410);
            $user['password_hash'] = Passwords::hash($password);
            $user['failed_logins'] = 0;
            $user['locked_until'] = null;
            $this->store->actAs($user['id']);
            $this->store->put('users', $user);
            $this->audit->log('password_reimpostata', 'users', $user['id']);
        });
    }

    public function changePassword(array $user, string $current, string $new): void
    {
        $this->limiter->hit('pwd-change', $user['id'], 5, 600);
        if (!Passwords::verify($current, (string) $user['password_hash'])) {
            throw new ApiError('password_errata', 422);
        }
        if (!Passwords::isAcceptable($new)) {
            throw new ApiError('password_debole', 422);
        }
        $user['password_hash'] = Passwords::hash($new);
        $this->store->actAs($user['id']);
        $this->store->put('users', $user);
        $this->audit->log('password_cambiata', 'users', $user['id']);
    }

    // ------------------------------------------------------------ 2FA

    /** @return array{segreto:string,uri:string} il segreto resta in attesa di conferma */
    public function startTotp(array $user): array
    {
        $secret = Totp::newSecret();
        $user['totp_pending'] = $secret;
        $this->store->actAs($user['id']);
        $this->store->put('users', $user);
        return ['segreto' => $secret, 'uri' => Totp::uri($secret, $user['email'], 'Poliambulatorio')];
    }

    public function confirmTotp(array $user, string $code): void
    {
        $pending = $user['totp_pending'] ?? null;
        $step = 0;
        if ($pending === null || !Totp::verify($pending, $code, null, $step)) {
            throw new ApiError('codice_errato', 422);
        }
        $user['totp_secret'] = $pending;
        $user['totp_enabled'] = true;
        $user['totp_last_step'] = $step;
        unset($user['totp_pending']);
        $this->store->actAs($user['id']);
        $this->store->put('users', $user);
        $this->audit->log('due_fattori_attivata', 'users', $user['id']);
    }

    public function disableTotp(array $user, string $password): void
    {
        if (!Passwords::verify($password, (string) $user['password_hash'])) {
            throw new ApiError('password_errata', 422);
        }
        if ($this->settings->get('sicurezza.due_fattori_obbligatorio.' . $user['role'], false)) {
            throw new ApiError('due_fattori_obbligatorio', 409);
        }
        $user['totp_enabled'] = false;
        $user['totp_secret'] = null;
        $this->store->actAs($user['id']);
        $this->store->put('users', $user);
        $this->audit->log('due_fattori_disattivata', 'users', $user['id']);
    }

    // ------------------------------------------------------------ primo avvio

    public function firstRunNeeded(): bool
    {
        return $this->store->all('users', static fn ($u) => $u['role'] === 'titolare') === [];
    }

    /** Genera il link monouso per creare il titolare. Da lanciare da riga di comando all'installazione. */
    public function issueFirstRunLink(?string $email = null): string
    {
        if (!$this->firstRunNeeded()) {
            throw new ApiError('primo_avvio_gia_fatto', 409);
        }
        $this->tokens->revokeFor('primo_avvio', 'titolare');
        $raw = $this->tokens->issue('primo_avvio', 'titolare', 60 * 24, ['email' => $email]);
        return \App\Core\PublicUrl::root() . '/#/primo-avvio/' . $raw;
    }

    public function peekFirstRun(string $raw): array
    {
        if (!$this->firstRunNeeded()) {
            throw new ApiError('primo_avvio_gia_fatto', 409);
        }
        return $this->tokens->peek('primo_avvio', $raw)['data'];
    }

    public function createOwner(string $raw, array $data): array
    {
        return $this->store->transaction(function () use ($raw, $data) {
            if (!$this->firstRunNeeded()) {
                throw new ApiError('primo_avvio_gia_fatto', 409);
            }
            $this->tokens->consume('primo_avvio', $raw);
            $owner = $this->users->create($data + ['role' => 'titolare', 'attivo' => true]);
            $this->store->actAs($owner['id']);
            $this->audit->log('titolare_creato', 'users', $owner['id']);
            return $owner;
        });
    }
}
