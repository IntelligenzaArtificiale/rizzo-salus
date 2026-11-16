<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Clock;
use App\Store\Store;

/**
 * Attività pianificate. Un solo endpoint/comando (tick) richiamato dal cron ogni 5 minuti:
 * ogni attività calcola il suo ultimo appuntamento previsto e parte se non è ancora partita
 * e se non è trascorsa la finestra massima di recupero. Due tick ravvicinati non duplicano nulla.
 *
 * Specifiche (campo "quando"):
 *   ['ogni_minuti' => 5]
 *   ['giornaliera' => 'HH:MM']
 *   ['settimanale' => [giorno ISO 1-7, 'HH:MM']]
 *   ['mensile' => [giorno del mese, 'HH:MM']]
 */
final class Scheduler
{
    /** @var array<string,array{nome:string,descrizione:string,quando:array,recupero_ore:int,essenziale:bool,run:callable,attiva_se?:callable}> */
    private array $jobs = [];

    public function __construct(private readonly Store $store, private readonly Settings $settings)
    {
    }

    public function register(string $id, string $nome, string $descrizione, array $quando, callable $run, int $recuperoOre = 12, bool $essenziale = false, ?callable $attivaSe = null): void
    {
        $this->jobs[$id] = ['nome' => $nome, 'descrizione' => $descrizione, 'quando' => $quando, 'recupero_ore' => $recuperoOre, 'essenziale' => $essenziale, 'run' => $run] + ($attivaSe ? ['attiva_se' => $attivaSe] : []);
    }

    /** @return list<string> */
    public function ids(): array
    {
        return array_keys($this->jobs);
    }

    /** Ultimo appuntamento previsto, non oltre $now. Formato locale. */
    public static function lastSlot(array $quando, string $now): string
    {
        $t = Clock::parse($now);
        $today = $t->format('Y-m-d');
        if (isset($quando['ogni_minuti'])) {
            $n = max(1, (int) $quando['ogni_minuti']);
            $min = (int) $t->format('i');
            return $t->setTime((int) $t->format('H'), intdiv($min, $n) * $n, 0)->format('Y-m-d\TH:i:s');
        }
        if (isset($quando['giornaliera'])) {
            $slot = "{$today}T{$quando['giornaliera']}:00";
            return $slot <= $now ? $slot : Clock::addDays($today, -1) . "T{$quando['giornaliera']}:00";
        }
        if (isset($quando['settimanale'])) {
            [$dow, $hm] = $quando['settimanale'];
            $day = $today;
            for ($i = 0; $i < 8; $i++) {
                if (Clock::dow($day) === (int) $dow && "{$day}T$hm:00" <= $now) {
                    return "{$day}T$hm:00";
                }
                $day = Clock::addDays($day, -1);
            }
        }
        if (isset($quando['mensile'])) {
            [$dom, $hm] = $quando['mensile'];
            $y = (int) $t->format('Y');
            $m = (int) $t->format('n');
            for ($i = 0; $i < 3; $i++) {
                $last = (int) (new \DateTimeImmutable(sprintf('%04d-%02d-01', $y, $m)))->format('t');
                $slot = sprintf('%04d-%02d-%02dT%s:00', $y, $m, min((int) $dom, $last), $hm);
                if ($slot <= $now) {
                    return $slot;
                }
                $m--;
                if ($m === 0) {
                    $m = 12;
                    $y--;
                }
            }
        }
        return $now;
    }

    public static function nextSlot(array $quando, string $now): string
    {
        $t = Clock::parse($now);
        if (isset($quando['ogni_minuti'])) {
            return Clock::addMinutes(self::lastSlot($quando, $now), (int) $quando['ogni_minuti']);
        }
        $probe = $now;
        for ($i = 0; $i < 400; $i++) {
            $probe = Clock::addMinutes($probe, 60 * 12);
            $slot = self::lastSlot($quando, $probe);
            if ($slot > $now) {
                // il primo appuntamento successivo a now è il più vecchio fra quelli che compaiono avanzando
                $prev = self::lastSlot($quando, Clock::addMinutes($slot, -1));
                return $prev > $now ? $prev : $slot;
            }
        }
        return $probe;
    }

    /**
     * Esegue le attività dovute. Lock non bloccante: se un altro tick è in corso, esce.
     * @return array<string,array{esito:string,nota:?string}>
     */
    public function tick(?string $now = null, ?string $only = null): array
    {
        $now ??= Clock::stamp();
        $lock = fopen($this->store->dir() . '/.tick.lock', 'c');
        if (!flock($lock, LOCK_EX | LOCK_NB)) {
            return ['_' => ['esito' => 'saltata', 'nota' => 'un altro tick è in corso']];
        }
        try {
            $out = [];
            foreach ($this->jobs as $id => $job) {
                if ($only !== null && $only !== $id) {
                    continue;
                }
                $state = $this->state($id);
                if (!$state['attivo']) {
                    continue;
                }
                $slot = self::lastSlot($job['quando'], $now);
                if (($state['ultimo_slot'] ?? '') >= $slot) {
                    continue;
                }
                if (Clock::diffMinutes($slot, $now) > $job['recupero_ore'] * 60) {
                    $this->saveState($id, $state, ['ultimo_slot' => $slot, 'esito' => 'saltata', 'nota' => 'finestra di recupero scaduta'], $now, 0);
                    $out[$id] = ['esito' => 'saltata', 'nota' => 'finestra di recupero scaduta'];
                    continue;
                }
                $out[$id] = $this->execute($id, $job, $state, $slot, $now);
            }
            return $out;
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    /** Esecuzione manuale («Esegui ora»): non cambia lo slot pianificato. */
    public function runNow(string $id, ?string $now = null): array
    {
        $now ??= Clock::stamp();
        $job = $this->jobs[$id] ?? throw \App\Core\ApiError::notFound();
        $state = $this->state($id);
        return $this->execute($id, $job, $state, $state['ultimo_slot'] ?? '', $now, true);
    }

    private function execute(string $id, array $job, array $state, string $slot, string $now, bool $manual = false): array
    {
        $t0 = microtime(true);
        try {
            $result = ($job['run'])($now);
            $esito = 'completata';
            $nota = is_array($result) ? json_encode($result, JSON_UNESCAPED_UNICODE) : (is_string($result) ? $result : null);
        } catch (\Throwable $e) {
            $esito = 'rifiutata';
            $nota = $e instanceof \App\Core\ApiError ? $e->errorCode : 'errore durante l’esecuzione';
            error_log("[attività $id] " . $e::class . ': ' . $e->getMessage());
        }
        $ms = (int) round((microtime(true) - $t0) * 1000);
        $this->saveState($id, $state, ['ultimo_slot' => $manual ? ($state['ultimo_slot'] ?? '') : $slot, 'esito' => $esito, 'nota' => $nota], $now, $ms, $manual);
        return ['esito' => $esito, 'nota' => $nota];
    }

    /** @return array<string,mixed> */
    private function state(string $id): array
    {
        $rec = $this->store->get('automations', 'aut_' . $this->key($id));
        return $rec ?? ['id' => 'aut_' . $this->key($id), 'job' => $id, 'attivo' => true, 'ultimo_slot' => '', 'runs' => []];
    }

    private function key(string $id): string
    {
        return substr(hash('sha256', $id), 0, 16);
    }

    private function saveState(string $id, array $state, array $change, string $now, int $ms, bool $manual = false): void
    {
        $state['ultimo_slot'] = $change['ultimo_slot'];
        $state['esito'] = $change['esito'];
        array_unshift($state['runs'], ['quando' => $now, 'esito' => $change['esito'], 'durata_ms' => $ms, 'nota' => $change['nota'], 'manuale' => $manual]);
        $state['runs'] = array_slice($state['runs'], 0, 20);
        $this->store->put('automations', $state);
    }

    public function setActive(string $id, bool $active): void
    {
        if (!isset($this->jobs[$id])) {
            throw \App\Core\ApiError::notFound();
        }
        $state = $this->state($id);
        $state['attivo'] = $active;
        $this->store->put('automations', $state);
    }

    /** @return list<array<string,mixed>> */
    public function overview(?string $now = null): array
    {
        $now ??= Clock::stamp();
        $out = [];
        foreach ($this->jobs as $id => $job) {
            $state = $this->state($id);
            $out[] = [
                'id' => $id, 'nome' => $job['nome'], 'descrizione' => $job['descrizione'], 'quando' => $job['quando'],
                'attivo' => (bool) $state['attivo'], 'prossima' => self::nextSlot($job['quando'], $now),
                'ultima' => $state['runs'][0] ?? null, 'esecuzioni' => $state['runs'], 'essenziale' => $job['essenziale'],
            ];
        }
        return $out;
    }
}
