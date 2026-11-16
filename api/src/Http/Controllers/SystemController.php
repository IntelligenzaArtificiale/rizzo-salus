<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Env;
use App\Http\Context;
use App\Http\Response;
use App\Support\Validator as V;

/** Backup, attività pianificate, stato del sistema, esportazione e scarico dei file. */
final class SystemController
{
    public function backupElenco(Context $c): array
    {
        $s = $c->svc->settings();
        return [
            'impostazioni' => $s->get('backup'),
            'copie' => array_map(static fn ($b) => [
                'id' => $b['id'], 'quando' => $b['quando'], 'tipo' => $b['tipo'], 'dimensione' => $b['dimensione'], 'esito' => 'completata',
            ], $c->svc->backup()->list()),
        ];
    }

    public function backupSalva(Context $c): array
    {
        $d = $c->body()['dati'] ?? [];
        $patch = [
            'attivo' => V::bool($d, 'attivo', true), 'ora' => V::time($d, 'ora') ?? '02:30',
            'giornalieri' => V::int($d, 'giornalieri', false, 1, 60) ?? 7, 'settimanali' => V::int($d, 'settimanali', false, 0, 52) ?? 4, 'mensili' => V::int($d, 'mensili', false, 0, 60) ?? 12,
        ];
        $c->svc->settings()->update(['backup' => $patch]);
        $c->svc->audit()->log('impostazioni_modificate', 'settings', 'backup', null, $patch);
        return [];
    }

    public function backupCrea(Context $c): array
    {
        $b = $c->svc->backup()->create('manuale');
        $c->svc->backup()->rotate();
        $c->svc->audit()->log('backup_creato', 'backup', $b['id'], null, ['tipo' => 'manuale']);
        return ['id' => $b['id'], 'quando' => $b['quando'], 'tipo' => 'manuale', 'dimensione' => $b['dimensione'], 'esito' => 'completata'];
    }

    public function backupRipristina(Context $c): never
    {
        // Il ripristino sostituisce tutti i dati: si fa solo dal server (bin/ripristina.php), mai da una pagina web.
        throw new ApiError('solo_da_server', 409);
    }

    public function backupScarica(Context $c): Response
    {
        $id = (string) ($c->req->query['id'] ?? '');
        $path = $c->svc->backup()->path($id);
        $c->svc->audit()->log('backup_scaricato', 'backup', $id);
        return Response::file((string) file_get_contents($path), 'application/octet-stream', "$id.zip.enc");
    }

    public function attivitaElenco(Context $c): array
    {
        return $c->svc->scheduler()->overview();
    }

    public function attivitaAttiva(Context $c): array
    {
        $id = V::str($c->body(), 'id', true, 60);
        $c->svc->scheduler()->setActive($id, V::bool($c->body(), 'attivo'));
        $c->svc->audit()->log('attivita_cambiata', 'automations', $id, null, ['attivo' => V::bool($c->body(), 'attivo')]);
        return $this->one($c, $id);
    }

    public function attivitaEsegui(Context $c): array
    {
        $id = V::str($c->body(), 'id', true, 60);
        $r = $c->svc->scheduler()->runNow($id);
        $c->svc->audit()->log('attivita_eseguita', 'automations', $id, null, ['esito' => $r['esito']]);
        return $this->one($c, $id);
    }

    private function one(Context $c, string $id): array
    {
        foreach ($c->svc->scheduler()->overview() as $j) {
            if ($j['id'] === $id) {
                return $j;
            }
        }
        throw ApiError::notFound();
    }

    /** Chiamata dal cron dell'hosting ogni 5 minuti. Il token sta nel .env. */
    public function cronTick(Context $c): array
    {
        $expected = Env::get('CRON_TOKEN');
        $given = (string) ($c->req->header('x-cron-token') ?? ($c->req->query['token'] ?? $c->body()['token'] ?? ''));
        if ($expected === '' || !hash_equals($expected, $given)) {
            throw new ApiError('non_autorizzato', 403);
        }
        return $c->svc->scheduler()->tick();
    }

    public function stato(Context $c): array
    {
        $svc = $c->svc;
        $dir = $svc->dataDir;
        $free = @disk_free_space($dir) ?: 0;
        $total = @disk_total_space($dir) ?: 0;
        $backups = $svc->backup()->list();
        $queue = ['in_coda' => 0, 'errore' => 0, 'inviato_oggi' => 0, 'piu_vecchio_in_coda_minuti' => 0];
        $today = Clock::today();
        $oldest = null;
        foreach ($svc->store->all('messages', null, $svc->store->partsBetween('messages', Clock::addDays($today, -40), $today)) as $m) {
            if ($m['status'] === 'in_coda') {
                $queue['in_coda']++;
                $oldest = $oldest === null || $m['created_at'] < $oldest ? $m['created_at'] : $oldest;
            } elseif ($m['status'] === 'errore') {
                $queue['errore']++;
            } elseif (in_array($m['status'], ['inviato', 'consegnato', 'letto'], true) && str_starts_with($m['sent_at'] ?? '', $today)) {
                $queue['inviato_oggi']++;
            }
        }
        if ($oldest !== null) {
            $queue['piu_vecchio_in_coda_minuti'] = max(0, Clock::diffMinutes($oldest, Clock::stamp()));
        }
        $month = substr($today, 0, 7);
        $ai = ['chiamate_oggi' => 0, 'spesa_oggi_eur' => 0.0, 'spesa_mese_eur' => 0.0];
        foreach ($svc->store->all('ai_usage', null, [$month]) as $u) {
            $ai['spesa_mese_eur'] += (float) $u['cost_eur'];
            if (str_starts_with($u['at'], $today)) {
                $ai['chiamate_oggi']++;
                $ai['spesa_oggi_eur'] += (float) $u['cost_eur'];
            }
        }
        $lastBackup = $backups[0] ?? null;
        $problemi = [];
        if ($lastBackup === null || Clock::diffMinutes($lastBackup['quando'], Clock::stamp()) > 60 * 30) {
            $problemi[] = 'backup_vecchio';
        }
        if ($queue['piu_vecchio_in_coda_minuti'] > 60) {
            $problemi[] = 'coda_ferma';
        }
        if ($total > 0 && $free / $total < 0.1) {
            $problemi[] = 'spazio_basso';
        }
        return [
            'disco' => ['libero' => $free, 'totale' => $total],
            'ultimo_backup' => $lastBackup ? ['quando' => $lastBackup['quando'], 'tipo' => $lastBackup['tipo']] : null,
            'coda_messaggi' => $queue, 'ai' => $ai,
            'modalita_messaggi' => $svc->settings()->get('messaggi.modalita'),
            'ultimo_tick' => $this->lastTick($c), 'problemi' => $problemi,
            'versione_php' => PHP_VERSION,
        ];
    }

    private function lastTick(Context $c): ?string
    {
        $last = null;
        foreach ($c->svc->scheduler()->overview() as $j) {
            $q = $j['ultima']['quando'] ?? null;
            if ($q !== null && ($last === null || $q > $last)) {
                $last = $q;
            }
        }
        return $last;
    }

    public function esportaCrea(Context $c): array
    {
        $zip = tempnam(sys_get_temp_dir(), 'ex');
        $summary = $c->svc->export()->build($zip);
        $bytes = (string) file_get_contents($zip);
        unlink($zip);
        $f = $c->svc->files()->put($bytes, 'esportazione-' . Clock::today() . '.zip', 'application/zip', 'esportazione');
        $c->svc->audit()->log('esportazione_completa', 'export', $f['id'], null, ['collezioni' => count($summary['collezioni'])]);
        return ['file' => $f['id'], 'nome' => $f['name'], 'dimensione' => $f['size'], 'riepilogo' => $summary];
    }

    /** Scarico generico: il permesso dipende dal tipo di file. */
    public function fileScarica(Context $c): Response
    {
        $id = (string) ($c->req->query['id'] ?? '');
        $f = $c->svc->files()->read($id);
        $kind = $f['meta']['kind'];
        $allowed = match ($kind) {
            'esportazione' => $c->can('backup.gestisci'),
            default => $c->svc->fileAccess($c, $f['meta']),
        };
        if (!$allowed) {
            throw ApiError::forbidden();
        }
        $c->svc->audit()->log('file_scaricato', 'files', $id, null, ['tipo' => $kind]);
        return Response::file($f['bytes'], $f['meta']['mime'], $f['meta']['name'], $f['meta']['mime'] === 'application/pdf');
    }
}
