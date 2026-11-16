<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Clock;
use App\Store\Store;

/**
 * Registro delle attività: solo aggiunte, con catena di hash (ogni riga include l'hash della precedente),
 * così una modifica o cancellazione a posteriori è rilevabile con verify().
 * Non contiene mai dati clinici: i campi sensibili sono esclusi dal "prima/dopo".
 */
final class Audit
{
    private const HEAD = 'cnt_audit_head';
    /** Campi che non entrano mai nel registro. */
    private const SENSITIVE = ['password_hash', 'totp_secret', 'anamnesi', 'allergie', 'diagnosi', 'contenuto', 'token', 'codice_fiscale', 'telefono', 'email'];

    private ?string $ip = null;

    public function __construct(private readonly Store $store)
    {
    }

    public function withIp(?string $ip): void
    {
        $this->ip = $ip;
    }

    /** @param array<string,mixed>|null $before @param array<string,mixed>|null $after */
    public function log(string $action, string $entity, ?string $entityId = null, ?array $before = null, ?array $after = null, array $meta = []): void
    {
        $this->store->transaction(function () use ($action, $entity, $entityId, $before, $after, $meta) {
            $head = $this->store->get('counters', self::HEAD) ?? ['id' => self::HEAD, 'hash' => str_repeat('0', 64), 'n' => 0];
            [$b, $a] = self::diff($before, $after);
            $entry = [
                'at' => Clock::stamp(), 'user_id' => $this->store->actor(), 'action' => $action, 'entity' => $entity,
                'entity_id' => $entityId, 'before' => $b, 'after' => $a, 'ip' => $this->ip, 'meta' => $meta, 'seq' => (int) $head['n'] + 1,
            ];
            $entry['prev_hash'] = $head['hash'];
            $entry['hash'] = hash('sha256', $head['hash'] . json_encode($entry, JSON_UNESCAPED_UNICODE));
            $this->store->put('audit_log', $entry);
            $head['hash'] = $entry['hash'];
            $head['n'] = $entry['seq'];
            $this->store->put('counters', $head);
        });
    }

    /** Traccia l'apertura di una scheda clinica (lettura). */
    public function read(string $entity, string $entityId): void
    {
        $this->log('lettura', $entity, $entityId);
    }

    /** @return array{0:?array,1:?array} solo i campi cambiati e non sensibili */
    public static function diff(?array $before, ?array $after): array
    {
        $skip = array_flip(array_merge(self::SENSITIVE, ['revision', 'updated_at', 'updated_by', 'created_at', 'created_by']));
        $b = [];
        $a = [];
        foreach (array_unique(array_merge(array_keys($before ?? []), array_keys($after ?? []))) as $k) {
            if (isset($skip[$k])) {
                continue;
            }
            $x = $before[$k] ?? null;
            $y = $after[$k] ?? null;
            if ($x !== $y) {
                if ($before !== null) {
                    $b[$k] = $x;
                }
                if ($after !== null) {
                    $a[$k] = $y;
                }
            }
        }
        return [$before === null ? null : $b, $after === null ? null : $a];
    }

    /** Verifica la catena: restituisce il numero di righe valide o il numero della prima riga alterata. */
    public function verify(): array
    {
        $rows = $this->store->all('audit_log', null, null, false, true);
        usort($rows, static fn ($x, $y) => $x['seq'] <=> $y['seq']);
        $prev = str_repeat('0', 64);
        foreach ($rows as $r) {
            $copy = $r;
            unset($copy['hash'], $copy['id'], $copy['revision'], $copy['created_at'], $copy['created_by'], $copy['updated_at'], $copy['updated_by']);
            if ($r['prev_hash'] !== $prev || $r['hash'] !== hash('sha256', $prev . json_encode($copy, JSON_UNESCAPED_UNICODE))) {
                return ['valido' => false, 'prima_riga_alterata' => $r['seq']];
            }
            $prev = $r['hash'];
        }
        return ['valido' => true, 'righe' => count($rows)];
    }
}
