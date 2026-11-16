<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Crypto;
use App\Core\Env;
use App\Store\Store;
use ZipArchive;

/**
 * Backup cifrati (libsodium) di tutta la cartella dati, con rotazione 7 giornalieri / 4 settimanali / 12 mensili.
 * La chiave NON è nel backup: va conservata a parte (docs/README: «Chiave di cifratura»).
 * Il ripristino è un'operazione da server (bin/ripristina.php) su una cartella vuota o con copia di sicurezza.
 */
final class Backup
{
    private const SKIP_TOP = ['_sessions', '_ratelimit', '_tmp', '.lock', '.tick.lock', '_txn.json'];

    public function __construct(private readonly Store $store, private readonly Settings $settings, private readonly ?string $dir = null)
    {
    }

    public function dir(): string
    {
        $d = $this->dir ?? (Env::get('BACKUP_DIR') ?: $this->store->dir() . '/../backup');
        if (!str_starts_with($d, '/')) $d = dirname(__DIR__, 2) . '/' . $d;
        if (!is_dir($d)) {
            @mkdir($d, 0700, true);
        }
        return $d;
    }

    /** @return array{id:string,quando:string,tipo:string,dimensione:int,sha256:string} */
    public function create(string $type = 'automatico'): array
    {
        $zipPath = tempnam(sys_get_temp_dir(), 'bk');
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::OVERWRITE) !== true) {
            throw new ApiError('backup_non_creato', 500);
        }
        $root = rtrim($this->store->dir(), '/');
        $n = 0;
        // Con il lock tenuto, i file sono coerenti fra loro (nessuna transazione a metà).
        $this->store->transaction(function () use ($zip, $root, &$n) {
            $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS));
            foreach ($it as $file) {
                $rel = ltrim(substr($file->getPathname(), strlen($root)), '/');
                $top = explode('/', $rel)[0];
                if (in_array($top, self::SKIP_TOP, true) || str_contains($rel, '.tmp')) {
                    continue;
                }
                $zip->addFile($file->getPathname(), $rel);
                $n++;
            }
            $zip->addFromString('MANIFEST.json', json_encode(['creato' => Clock::stamp(), 'file' => $n, 'versione' => 1], JSON_UNESCAPED_UNICODE));
            $zip->close();
        });
        $plain = (string) file_get_contents($zipPath);
        unlink($zipPath);
        $id = 'bk-' . Clock::now()->format('Ymd-His') . '-' . $type;
        $blob = Crypto::sealBytes($plain);
        file_put_contents($this->dir() . "/$id.zip.enc", $blob, LOCK_EX);
        chmod($this->dir() . "/$id.zip.enc", 0600);
        $meta = ['id' => $id, 'quando' => Clock::stamp(), 'tipo' => $type, 'dimensione' => strlen($blob), 'sha256' => hash('sha256', $blob)];
        file_put_contents($this->dir() . "/$id.json", json_encode($meta));
        return $meta;
    }

    /** @return list<array<string,mixed>> dal più recente */
    public function list(): array
    {
        $out = [];
        foreach (glob($this->dir() . '/bk-*.json') ?: [] as $f) {
            $m = json_decode((string) file_get_contents($f), true);
            if (is_array($m) && is_file($this->dir() . "/{$m['id']}.zip.enc")) {
                $out[] = $m;
            }
        }
        usort($out, static fn ($a, $b) => strcmp($b['quando'], $a['quando']));
        return $out;
    }

    public function path(string $id): string
    {
        if (!preg_match('/^bk-\d{8}-\d{6}-(automatico|manuale)$/', $id) || !is_file($this->dir() . "/$id.zip.enc")) {
            throw ApiError::notFound();
        }
        return $this->dir() . "/$id.zip.enc";
    }

    /** Controlla integrità (hash) e decifrabilità senza ripristinare. */
    public function verify(string $id): bool
    {
        $meta = json_decode((string) file_get_contents($this->dir() . "/$id.json"), true);
        $blob = (string) file_get_contents($this->path($id));
        if (hash('sha256', $blob) !== $meta['sha256']) {
            return false;
        }
        try {
            Crypto::openBytes($blob);
            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /** Ripristina in una cartella vuota. Rifiuta di scrivere in una cartella con dati. */
    public function restore(string $id, string $target): int
    {
        if (is_dir($target) && count(array_diff(scandir($target) ?: [], ['.', '..'])) > 0) {
            throw new ApiError('cartella_non_vuota', 409);
        }
        @mkdir($target, 0700, true);
        $plain = Crypto::openBytes((string) file_get_contents($this->path($id)));
        $tmp = tempnam(sys_get_temp_dir(), 'rs');
        file_put_contents($tmp, $plain);
        $zip = new ZipArchive();
        if ($zip->open($tmp) !== true) {
            throw new ApiError('backup_danneggiato', 500);
        }
        $n = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = (string) $zip->getNameIndex($i);
            if ($name === 'MANIFEST.json' || str_contains($name, '..') || str_starts_with($name, '/')) {
                continue;
            }
            $dest = $target . '/' . $name;
            @mkdir(dirname($dest), 0700, true);
            file_put_contents($dest, $zip->getFromIndex($i));
            chmod($dest, 0600);
            $n++;
        }
        $zip->close();
        unlink($tmp);
        return $n;
    }

    /** Rotazione: tiene 7 giornalieri, 4 settimanali (il più recente di ogni settimana), 12 mensili (idem). */
    public function rotate(?array $keep = null): array
    {
        $keep ??= [
            'giornalieri' => (int) $this->settings->get('backup.giornalieri', 7),
            'settimanali' => (int) $this->settings->get('backup.settimanali', 4),
            'mensili' => (int) $this->settings->get('backup.mensili', 12),
        ];
        $all = $this->list();
        $keepIds = [];
        foreach (array_slice($all, 0, $keep['giornalieri']) as $b) {
            $keepIds[$b['id']] = true;
        }
        $weeks = [];
        $months = [];
        foreach ($all as $b) {
            $d = substr($b['quando'], 0, 10);
            $w = Clock::isoWeek($d);
            $wk = $w['year'] . '-' . $w['week'];
            $weeks[$wk] ??= $b['id'];
            $months[substr($d, 0, 7)] ??= $b['id'];
        }
        foreach (array_slice($weeks, 0, $keep['settimanali'], true) as $id) {
            $keepIds[$id] = true;
        }
        foreach (array_slice($months, 0, $keep['mensili'], true) as $id) {
            $keepIds[$id] = true;
        }
        $removed = [];
        foreach ($all as $b) {
            if (!isset($keepIds[$b['id']])) {
                @unlink($this->dir() . "/{$b['id']}.zip.enc");
                @unlink($this->dir() . "/{$b['id']}.json");
                $removed[] = $b['id'];
            }
        }
        return $removed;
    }
}
