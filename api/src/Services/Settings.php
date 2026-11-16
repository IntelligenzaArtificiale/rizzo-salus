<?php
declare(strict_types=1);

namespace App\Services;

use App\Auth\Permissions;
use App\Core\ApiError;
use App\Domain\SettingsDefaults;
use App\Store\Store;

/** Impostazioni della struttura: un solo record, fonde con i valori predefiniti a ogni lettura. */
final class Settings
{
    public const ID = 'set_main';
    private ?array $memo = null;

    public function __construct(private readonly Store $store)
    {
    }

    /** @return array<string,mixed> */
    public function all(): array
    {
        if ($this->memo !== null) {
            return $this->memo;
        }
        $stored = $this->store->get('settings', self::ID)['valori'] ?? [];
        return $this->memo = self::merge(SettingsDefaults::all(), $stored);
    }

    public function get(string $path, mixed $default = null): mixed
    {
        $cur = $this->all();
        foreach (explode('.', $path) as $k) {
            if (!is_array($cur) || !array_key_exists($k, $cur)) {
                return $default;
            }
            $cur = $cur[$k];
        }
        return $cur;
    }

    /** @param array<string,mixed> $patch sezioni da sostituire/fondere */
    public function update(array $patch, ?int $expectedRevision = null): array
    {
        return $this->store->transaction(function () use ($patch, $expectedRevision) {
            $this->validate($patch);
            $limits=self::merge($this->get('agenda.gruppi',[]),$patch['agenda']['gruppi']??[]);
            if($limits['max_complesso']>$limits['max_standard'])throw new ApiError('limiti_gruppo_non_validi',422);
            $rec = $this->store->get('settings', self::ID) ?? ['id' => self::ID, 'valori' => []];
            $rec['valori'] = self::merge($rec['valori'], $patch);
            $this->store->put('settings', $rec, $expectedRevision);
            $this->memo = null;
            return $this->all();
        });
    }

    public function revision(): int
    {
        return (int) ($this->store->get('settings', self::ID)['revision'] ?? 0);
    }

    public function forget(): void
    {
        $this->memo = null;
    }

    private function validate(array $patch): void
    {
        SettingsRules::check($patch);
        if (isset($patch['ruoli'])) {
            foreach ($patch['ruoli'] as $role => $perms) {
                if (!in_array($role, Permissions::ROLES, true) || !is_array($perms)) {
                    throw new ApiError('ruolo_non_valido', 422);
                }
                foreach ($perms as $p) {
                    if (!isset(Permissions::ALL[$p])) {
                        throw new ApiError('permesso_non_valido', 422);
                    }
                }
            }
            if (isset($patch['ruoli']['titolare'])) {
                throw new ApiError('ruolo_titolare_fisso', 422);
            }
        }
        if (isset($patch['messaggi']['modalita']) && !in_array($patch['messaggi']['modalita'], ['test', 'interno', 'live'], true)) {
            throw new ApiError('modalita_non_valida', 422);
        }
        if (isset($patch['messaggi']['variazioni']['modalita']) && !in_array($patch['messaggi']['variazioni']['modalita'], ['automatica', 'controllo', 'manuale'], true)) {
            throw new ApiError('modalita_non_valida', 422);
        }
        foreach (['orari'] as $sec) {
            foreach ($patch[$sec] ?? [] as $day => $slots) {
                foreach ((array) $slots as $s) {
                    if (!is_array($s) || count($s) !== 2 || !preg_match('/^\d{2}:\d{2}$/', (string) $s[0]) || !preg_match('/^\d{2}:\d{2}$/', (string) $s[1]) || $s[0] >= $s[1]) {
                        throw new ApiError('orari_non_validi', 422);
                    }
                }
            }
        }
        $promemoria = $patch['messaggi']['promemoria'] ?? [];
        if (isset($promemoria['giorno']) && !in_array((int) $promemoria['giorno'], [1, 2, 3, 4, 5, 6, 7], true)) {
            throw new ApiError('giorno_non_valido', 422);
        }
    }

    /** Fusione ricorsiva: gli elenchi (array non associativi) si sostituiscono, le mappe si fondono. */
    public static function merge(array $base, array $over): array
    {
        foreach ($over as $k => $v) {
            if (is_array($v) && isset($base[$k]) && is_array($base[$k]) && self::isMap($v) && self::isMap($base[$k])) {
                $base[$k] = self::merge($base[$k], $v);
            } else {
                $base[$k] = $v;
            }
        }
        return $base;
    }

    private static function isMap(array $a): bool
    {
        return $a === [] || array_keys($a) !== range(0, count($a) - 1);
    }
}
