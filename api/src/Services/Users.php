<?php
declare(strict_types=1);

namespace App\Services;

use App\Auth\Passwords;
use App\Auth\Permissions;
use App\Core\ApiError;
use App\Store\Store;

final class Users
{
    public function __construct(private readonly Store $store, private readonly Settings $settings)
    {
    }

    public function byEmail(string $email): ?array
    {
        $email = mb_strtolower(trim($email));
        foreach ($this->store->all('users', static fn ($u) => $u['email'] === $email) as $u) {
            return $u;
        }
        return null;
    }

    public function get(string $id): ?array
    {
        return $this->store->get('users', $id);
    }

    /** Dati esposti al frontend: mai hash, segreto 2FA o contatori interni. */
    public function publicView(array $u): array
    {
        return [
            'id' => $u['id'], 'name' => trim($u['nome'] . ' ' . $u['cognome']), 'nome' => $u['nome'], 'cognome' => $u['cognome'],
            'email' => $u['email'], 'role' => $u['role'], 'professional_id' => $u['professional_id'] ?? null,
            'attivo' => (bool) $u['attivo'], 'due_fattori' => (bool) ($u['totp_enabled'] ?? false),
            'ultimo_accesso' => $u['ultimo_accesso'] ?? null, 'revision' => $u['revision'],
            'permessi_extra' => $u['permessi_extra'] ?? ['aggiunti' => [], 'tolti' => []],
        ];
    }

    /** @return list<string> */
    public function permissions(array $u): array
    {
        return Permissions::effective($u['role'], $this->settings->get('ruoli', []), $u['permessi_extra'] ?? []);
    }

    public function create(array $data): array
    {
        return $this->store->transaction(function () use ($data) {
            if (!in_array($data['role'], Permissions::ROLES, true)) {
                throw new ApiError('ruolo_non_valido', 422);
            }
            if ($this->byEmail($data['email']) !== null) {
                throw new ApiError('email_esistente', 409);
            }
            $hash = null;
            if (isset($data['password'])) {
                if (!Passwords::isAcceptable($data['password'])) {
                    throw new ApiError('password_debole', 422);
                }
                $hash = Passwords::hash($data['password']);
            }
            return $this->store->put('users', [
                'nome' => $data['nome'], 'cognome' => $data['cognome'], 'email' => mb_strtolower($data['email']), 'role' => $data['role'],
                'professional_id' => $data['professional_id'] ?? null, 'permessi_extra' => $data['permessi_extra'] ?? ['aggiunti' => [], 'tolti' => []],
                'attivo' => $data['attivo'] ?? true, 'password_hash' => $hash, 'totp_enabled' => false, 'totp_secret' => null,
                'failed_logins' => 0, 'locked_until' => null, 'ultimo_accesso' => null, 'totp_last_step' => 0,
            ]);
        });
    }

    /** Evita che l'ultimo titolare attivo venga disattivato o declassato. */
    public function assertOwnerRemains(string $exceptUserId): void
    {
        $others = $this->store->all('users', static fn ($u) => $u['role'] === 'titolare' && $u['attivo'] && $u['id'] !== $exceptUserId);
        if ($others === []) {
            throw new ApiError('ultimo_titolare', 409);
        }
    }
}
