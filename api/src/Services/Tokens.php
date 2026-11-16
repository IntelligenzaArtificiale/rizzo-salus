<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Crypto;
use App\Store\Store;

/** Token monouso o a scadenza (reset password, primo avvio, link personali). Sul server resta solo l'hash. */
final class Tokens
{
    public function __construct(private readonly Store $store)
    {
    }

    /** @return string il token in chiaro, da consegnare una sola volta */
    public function issue(string $scope, ?string $subject, int $ttlMinutes, array $data = [], bool $singleUse = true): string
    {
        $raw = Crypto::token(32);
        $this->store->put('tokens', [
            'hash' => Crypto::hashToken($raw), 'scope' => $scope, 'subject' => $subject, 'data' => $data,
            'expires_at' => Clock::stamp(Clock::now()->modify("+{$ttlMinutes} minutes")), 'single_use' => $singleUse, 'used_at' => null, 'revoked_at' => null,
        ]);
        return $raw;
    }

    /** Verifica senza consumare. @throws ApiError link_scaduto | link_usato */
    public function peek(string $scope, string $raw): array
    {
        $hash = Crypto::hashToken($raw);
        $found = null;
        foreach ($this->store->all('tokens', static fn ($t) => $t['hash'] === $hash && $t['scope'] === $scope) as $t) {
            $found = $t;
        }
        if ($found === null) {
            throw new ApiError('link_scaduto', 410);
        }
        if (!empty($found['revoked_at'])) {
            throw new ApiError('link_scaduto', 410);
        }
        if ($found['single_use'] && !empty($found['used_at'])) {
            throw new ApiError('link_usato', 410);
        }
        if ($found['expires_at'] < Clock::stamp()) {
            throw new ApiError('link_scaduto', 410);
        }
        return $found;
    }

    public function consume(string $scope, string $raw): array
    {
        return $this->store->transaction(function () use ($scope, $raw) {
            $t = $this->peek($scope, $raw);
            return $this->store->put('tokens', array_replace($t, ['used_at' => Clock::stamp()]));
        });
    }

    public function revokeFor(string $scope, string $subject): int
    {
        return $this->store->transaction(function () use ($scope, $subject) {
            $n = 0;
            foreach ($this->store->all('tokens', static fn ($t) => $t['scope'] === $scope && $t['subject'] === $subject && empty($t['revoked_at'])) as $t) {
                $t['revoked_at'] = Clock::stamp();
                $this->store->put('tokens', $t);
                $n++;
            }
            return $n;
        });
    }

    /** Elimina i token scaduti da più di 30 giorni (pulizia tecnica). */
    public function sweep(): int
    {
        $limit = Clock::stamp(Clock::now()->modify('-30 days'));
        $n = 0;
        $this->store->transaction(function () use ($limit, &$n) {
            foreach ($this->store->all('tokens', static fn ($t) => $t['expires_at'] < $limit, null, false, true) as $t) {
                $this->store->purge('tokens', $t['id']);
                $n++;
            }
        });
        return $n;
    }
}
