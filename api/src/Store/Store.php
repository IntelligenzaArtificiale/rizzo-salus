<?php
declare(strict_types=1);

namespace App\Store;

use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Crypto;
use RuntimeException;

/**
 * Store a file JSON con transazioni.
 *
 * - ogni file è una partizione di una collezione: {"schema_version":N,"records":{id:record}}
 * - le modifiche avvengono dentro transaction(): lock esclusivo (flock), buffer in memoria,
 *   file temporanei + journal + rename, così un'interruzione non lascia metà delle modifiche
 * - i campi cifrati (Schema) sono sigillati su disco e aperti in lettura
 * - ogni record ha revision (blocco ottimistico), created_*, updated_*, deleted_at (soft delete)
 * L'interfaccia è isolata: in V2 si può sostituire con SQL senza toccare il dominio.
 */
final class Store
{
    private const LOCK_WAIT_SECONDS = 15;

    /** @var array<string,array<string,array<string,array>>> collezione => partizione => id => record (cifrati) */
    private array $cache = [];
    /** @var array<string,array<string,string>> collezione => id => partizione */
    private array $index = [];
    /** @var array<string,array<string,true>> partizioni modificate nella transazione */
    private array $dirty = [];
    private int $depth = 0;
    /** @var resource|null */
    private $lock = null;
    private ?string $actor = null;

    public function __construct(private readonly string $dir)
    {
        if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new RuntimeException('Cartella dati non creabile');
        }
    }

    public function dir(): string
    {
        return $this->dir;
    }

    /** Dimentica la cache: serve ai processi lunghi (cron) e ai test che modificano i file a mano. */
    public function refresh(): void
    {
        $this->cache = [];
        $this->index = [];
    }

    public function actAs(?string $userId): void
    {
        $this->actor = $userId;
    }

    public function actor(): ?string
    {
        return $this->actor;
    }

    // ---------------------------------------------------------------- transazioni

    /**
     * @template T
     * @param callable():T $fn
     * @return T
     */
    public function transaction(callable $fn): mixed
    {
        if ($this->depth > 0) {
            $this->depth++;
            try {
                return $fn();
            } finally {
                $this->depth--;
            }
        }
        $this->acquire();
        $this->cache = [];
        $this->index = [];
        $this->dirty = [];
        $this->depth = 1;
        try {
            $result = $fn();
            $this->commit();
            return $result;
        } catch (\Throwable $e) {
            $this->cache = [];
            $this->index = [];
            $this->dirty = [];
            throw $e;
        } finally {
            $this->depth = 0;
            $this->release();
        }
    }

    private function acquire(): void
    {
        $handle = fopen($this->dir . '/.lock', 'c');
        if ($handle === false) {
            throw new RuntimeException('Lock non apribile');
        }
        $deadline = microtime(true) + self::LOCK_WAIT_SECONDS;
        while (!flock($handle, LOCK_EX | LOCK_NB)) {
            if (microtime(true) > $deadline) {
                fclose($handle);
                throw new ApiError('sistema_occupato', 503);
            }
            usleep(20_000);
        }
        $this->lock = $handle;
        $this->recover();
    }

    private function release(): void
    {
        if ($this->lock !== null) {
            flock($this->lock, LOCK_UN);
            fclose($this->lock);
            $this->lock = null;
        }
    }

    // ---------------------------------------------------------------- lettura

    /** @return array<string,mixed>|null */
    public function get(string $collection, string $id, bool $decrypt = true): ?array
    {
        $part = $this->partitionFor($collection, $id);
        if ($part === null) {
            return null;
        }
        $raw = $this->load($collection, $part)[$id] ?? null;
        return $raw === null ? null : ($decrypt ? $this->open($collection, $raw) : $raw);
    }

    /**
     * @param (callable(array):bool)|null $filter
     * @param list<string>|null $parts partizioni da leggere (null = tutte)
     * @return list<array<string,mixed>>
     */
    public function all(string $collection, ?callable $filter = null, ?array $parts = null, bool $decrypt = true, bool $withDeleted = false): array
    {
        $out = [];
        foreach ($parts ?? $this->partitions($collection) as $part) {
            foreach ($this->load($collection, $part) as $raw) {
                if (!$withDeleted && !empty($raw['deleted_at'])) {
                    continue;
                }
                $rec = $decrypt ? $this->open($collection, $raw) : $raw;
                if ($filter === null || $filter($rec)) {
                    $out[] = $rec;
                }
            }
        }
        return $out;
    }

    /** Partizioni (anni o mesi) che coprono un intervallo di date YYYY-MM-DD. */
    public function partsBetween(string $collection, string $from, string $to): array
    {
        $part = Schema::of($collection)['part'];
        if ($part === null) {
            return ['_'];
        }
        $out = [];
        $cur = substr($from, 0, 7) . '-01';
        $end = substr($to, 0, 7) . '-01';
        while ($cur <= $end) {
            $out[$part['by'] === 'year' ? substr($cur, 0, 4) : substr($cur, 0, 7)] = true;
            $cur = Clock::addDays($cur, 32);
            $cur = substr($cur, 0, 7) . '-01';
        }
        return array_map('strval', array_keys($out));
    }

    // ---------------------------------------------------------------- scrittura

    /**
     * Inserisce o aggiorna. Con $expectedRevision rifiuta il salvataggio se il record è cambiato.
     * @param array<string,mixed> $record
     * @return array<string,mixed> il record salvato (in chiaro)
     */
    public function put(string $collection, array $record, ?int $expectedRevision = null): array
    {
        return $this->transaction(function () use ($collection, $record, $expectedRevision) {
            $schema = Schema::of($collection);
            $now = Clock::stamp();
            $existing = isset($record['id']) ? $this->get($collection, (string) $record['id'], false) : null;

            if ($existing === null) {
                $record['id'] = $record['id'] ?? \App\Core\Ids::new($schema['prefix']);
                $this->assertPrefix($collection, (string) $record['id']);
                $record['revision'] = 1;
                $record['created_at'] = $record['created_at'] ?? $now;
                $record['created_by'] = $record['created_by'] ?? $this->actor;
                $record['updated_at'] = $now;
                $record['updated_by'] = $this->actor;
                $newPart = Schema::partitionOf($collection, $record);
                $stored = $this->seal($collection, $record, null);
                $this->setRaw($collection, $newPart, (string) $record['id'], $stored);
                return $this->open($collection, $stored);
            }

            if ($expectedRevision !== null && (int) $existing['revision'] !== $expectedRevision) {
                throw ApiError::conflict('revisione_vecchia', ['revision' => (int) $existing['revision']]);
            }
            $record['revision'] = (int) $existing['revision'] + 1;
            $record['created_at'] = $existing['created_at'];
            $record['created_by'] = $existing['created_by'] ?? null;
            $record['updated_at'] = $now;
            $record['updated_by'] = $this->actor;
            $oldPart = $this->partitionFor($collection, (string) $record['id']) ?? '_';
            $newPart = Schema::partitionOf($collection, $record);
            $stored = $this->seal($collection, $record, $existing);
            if ($oldPart !== $newPart) {
                $this->unsetRaw($collection, $oldPart, (string) $record['id']);
            }
            $this->setRaw($collection, $newPart, (string) $record['id'], $stored);
            return $this->open($collection, $stored);
        });
    }

    /** Modifica parziale di un record esistente. */
    public function patch(string $collection, string $id, array $changes, ?int $expectedRevision = null): array
    {
        return $this->transaction(function () use ($collection, $id, $changes, $expectedRevision) {
            $current = $this->get($collection, $id) ?? throw ApiError::notFound();
            return $this->put($collection, array_replace($current, $changes), $expectedRevision);
        });
    }

    public function softDelete(string $collection, string $id): array
    {
        return $this->patch($collection, $id, ['deleted_at' => Clock::stamp(), 'deleted_by' => $this->actor]);
    }

    /** Eliminazione fisica: solo per dati tecnici (token scaduti, sessioni), mai per dati sanitari o fatture. */
    public function purge(string $collection, string $id): void
    {
        $this->transaction(function () use ($collection, $id) {
            $part = $this->partitionFor($collection, $id);
            if ($part !== null) {
                $this->unsetRaw($collection, $part, $id);
            }
        });
    }

    // ---------------------------------------------------------------- interni

    private function assertPrefix(string $collection, string $id): void
    {
        $prefix = Schema::of($collection)['prefix'] . '_';
        if (!str_starts_with($id, $prefix)) {
            throw new \InvalidArgumentException("L'id $id non ha il prefisso $prefix");
        }
    }

    private function file(string $collection, string $part): string
    {
        return $part === '_' ? "{$this->dir}/$collection.json" : "{$this->dir}/$collection/$part.json";
    }

    /** @return list<string> */
    private function partitions(string $collection): array
    {
        if (Schema::of($collection)['part'] === null) {
            return ['_'];
        }
        $found = [];
        foreach (glob("{$this->dir}/$collection/*.json") ?: [] as $f) {
            $found[basename($f, '.json')] = true;
        }
        foreach ($this->cache[$collection] ?? [] as $part => $_) {
            $found[$part] = true;
        }
        $parts = array_map('strval', array_keys($found));
        sort($parts);
        return $parts;
    }

    /** @return array<string,array> id => record cifrato */
    private function load(string $collection, string $part): array
    {
        if (isset($this->cache[$collection][$part])) {
            return $this->cache[$collection][$part];
        }
        $file = $this->file($collection, $part);
        $records = [];
        if (is_file($file)) {
            $json = file_get_contents($file);
            $doc = json_decode((string) $json, true);
            if (!is_array($doc) || !isset($doc['records'])) {
                throw new RuntimeException("File dati illeggibile: $collection/$part");
            }
            $records = $this->migrate($collection, $doc);
        }
        return $this->cache[$collection][$part] = $records;
    }

    /** @return array<string,array> */
    private function migrate(string $collection, array $doc): array
    {
        $from = (int) ($doc['schema_version'] ?? 1);
        $to = (int) Schema::of($collection)['version'];
        $records = $doc['records'];
        for ($v = $from + 1; $v <= $to; $v++) {
            $step = Schema::$migrations[$collection][$v] ?? null;
            if ($step !== null) {
                $records = $step($records);
            }
        }
        return $records;
    }

    private function partitionFor(string $collection, string $id): ?string
    {
        if (Schema::of($collection)['part'] === null) {
            return isset($this->load($collection, '_')[$id]) ? '_' : null;
        }
        $idx = $this->loadIndex($collection);
        return $idx[$id] ?? null;
    }

    /** @return array<string,string> */
    private function loadIndex(string $collection): array
    {
        if (isset($this->index[$collection])) {
            return $this->index[$collection];
        }
        $file = "{$this->dir}/_idx/$collection.json";
        $idx = null;
        if (is_file($file)) {
            $decoded = json_decode((string) file_get_contents($file), true);
            $idx = is_array($decoded) ? $decoded : null;
        }
        if ($idx === null) {
            $idx = $this->rebuildIndex($collection);
        }
        return $this->index[$collection] = $idx;
    }

    /** @return array<string,string> */
    private function rebuildIndex(string $collection): array
    {
        $idx = [];
        foreach ($this->partitions($collection) as $part) {
            foreach (array_keys($this->load($collection, $part)) as $id) {
                $idx[(string) $id] = $part;
            }
        }
        return $idx;
    }

    private function setRaw(string $collection, string $part, string $id, array $raw): void
    {
        $this->load($collection, $part);
        $this->cache[$collection][$part][$id] = $raw;
        $this->dirty[$collection][$part] = true;
        if ($part !== '_') {
            $this->index[$collection] = $this->loadIndex($collection);
            $this->index[$collection][$id] = $part;
            $this->dirty['_idx'][$collection] = true;
        }
    }

    private function unsetRaw(string $collection, string $part, string $id): void
    {
        $this->load($collection, $part);
        unset($this->cache[$collection][$part][$id]);
        $this->dirty[$collection][$part] = true;
        if ($part !== '_') {
            $this->index[$collection] = $this->loadIndex($collection);
            unset($this->index[$collection][$id]);
            $this->dirty['_idx'][$collection] = true;
        }
    }

    /** @param array<string,mixed>|null $existingRaw */
    private function seal(string $collection, array $record, ?array $existingRaw): array
    {
        foreach (Schema::of($collection)['enc'] as $field) {
            if (!array_key_exists($field, $record) || $record[$field] === null || $record[$field] === '') {
                continue;
            }
            $old = $existingRaw[$field] ?? null;
            if (Crypto::isSealed($record[$field])) {
                continue;
            }
            if ($old !== null && Crypto::isSealed($old) && Crypto::open($old) === $record[$field]) {
                $record[$field] = $old;
            } else {
                $record[$field] = Crypto::seal($record[$field]);
            }
        }
        return $record;
    }

    /** @param array<string,mixed> $raw */
    private function open(string $collection, array $raw): array
    {
        foreach (Schema::of($collection)['enc'] as $field) {
            if (isset($raw[$field]) && Crypto::isSealed($raw[$field])) {
                $raw[$field] = Crypto::open($raw[$field]);
            }
        }
        return $raw;
    }

    // ---------------------------------------------------------------- commit e recupero

    private function commit(): void
    {
        $plan = [];
        foreach ($this->dirty as $collection => $parts) {
            foreach (array_map('strval', array_keys($parts)) as $part) {
                if ($collection === '_idx') {
                    $final = "{$this->dir}/_idx/$part.json";
                    $payload = $this->index[$part] ?? [];
                } else {
                    $final = $this->file($collection, $part);
                    $payload = ['schema_version' => Schema::of($collection)['version'], 'records' => (object) ($this->cache[$collection][$part] ?? [])];
                }
                $plan[] = [$final, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)];
            }
        }
        if ($plan === []) {
            return;
        }
        $pairs = [];
        foreach ($plan as [$final, $json]) {
            @mkdir(dirname($final), 0700, true);
            $tmp = $final . '.tmp.' . bin2hex(random_bytes(4));
            $h = fopen($tmp, 'wb');
            if ($h === false || fwrite($h, $json) === false) {
                throw new RuntimeException('Scrittura non riuscita: spazio su disco esaurito?');
            }
            fflush($h);
            fsync($h);
            fclose($h);
            chmod($tmp, 0600);
            $pairs[] = [$tmp, $final];
        }
        $journal = $this->dir . '/_txn.json';
        $jh = fopen($journal, 'wb');
        fwrite($jh, json_encode($pairs, JSON_THROW_ON_ERROR));
        fflush($jh);
        fsync($jh);
        fclose($jh);
        foreach ($pairs as [$tmp, $final]) {
            rename($tmp, $final);
        }
        unlink($journal);
        $this->dirty = [];
    }

    /** Completa una transazione interrotta: i file temporanei del journal sono già scritti per intero. */
    private function recover(): void
    {
        $journal = $this->dir . '/_txn.json';
        if (!is_file($journal)) {
            return;
        }
        $pairs = json_decode((string) file_get_contents($journal), true);
        foreach (is_array($pairs) ? $pairs : [] as [$tmp, $final]) {
            if (is_file($tmp)) {
                rename($tmp, $final);
            }
        }
        @unlink($journal);
    }
}
