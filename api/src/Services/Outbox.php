<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Clock;
use App\Core\Crypto;
use App\Store\Store;

/**
 * Accoda i messaggi nel registro unico `messages` (stato in_coda). L'invio vero è del MessageGateway
 * (coda con retry, modalità prova, Composio): qui si decide solo cosa deve partire.
 */
final class Outbox
{
    public function __construct(private readonly Store $store)
    {
    }

    /** @param array<string,mixed> $extra */
    public function queue(string $channel, string $to, string $kind, string $body, ?string $subject = null, array $extra = [], ?string $idempotencyKey = null): array
    {
        return $this->store->transaction(function () use ($channel, $to, $kind, $body, $subject, $extra, $idempotencyKey) {
            $key = $idempotencyKey ?? Crypto::token(12);
            foreach ($this->store->all('messages', static fn ($m) => ($m['idempotency_key'] ?? null) === $key) as $dup) {
                return $dup;
            }
            return $this->store->put('messages', $extra + [
                'channel' => $channel, 'to' => $to, 'kind' => $kind, 'subject' => $subject, 'body' => $body,
                'status' => 'in_coda', 'attempts' => 0, 'idempotency_key' => $key, 'error' => null,
                'cost_eur' => 0.0, 'next_attempt_at' => Clock::stamp(), 'provider_id' => null,
            ]);
        });
    }
}
