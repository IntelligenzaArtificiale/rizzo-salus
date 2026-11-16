<?php
declare(strict_types=1);

namespace App\Http;

use App\Core\ApiError;
use App\Services\Services;

/** Tutto ciò che serve a un handler: richiesta, sessione, utente collegato e servizi. */
final class Context
{
    /** @param list<string> $perms */
    public function __construct(
        public readonly Request $req,
        public readonly Services $svc,
        public readonly Session $session,
        public readonly ?array $user,
        public readonly array $perms,
    ) {
    }

    /** @return array<string,mixed> */
    public function body(): array
    {
        return $this->req->body;
    }

    public function can(string $perm): bool
    {
        return in_array($perm, $this->perms, true);
    }

    /** @throws ApiError 403 se manca il permesso */
    public function need(string ...$anyOf): void
    {
        foreach ($anyOf as $p) {
            if ($this->can($p)) {
                return;
            }
        }
        throw ApiError::forbidden();
    }

    public function user(): array
    {
        return $this->user ?? throw new ApiError('non_autenticato', 401);
    }

    public function userId(): string
    {
        return $this->user()['id'];
    }

    public function role(): string
    {
        return $this->user()['role'];
    }
}
