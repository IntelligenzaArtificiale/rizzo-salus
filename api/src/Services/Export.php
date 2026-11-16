<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Clock;
use App\Store\Schema;
use App\Store\Store;
use ZipArchive;

/**
 * Esportazione completa in formato aperto: un file JSON per collezione (campi clinici in chiaro, perché
 * l'export serve al cambio di gestionale), CSV delle collezioni principali e i file allegati.
 * Esclude solo i dati puramente tecnici (sessioni, token, hash di password, segreti 2FA).
 */
final class Export
{
    private const CSV = ['patients', 'episodes', 'appointments', 'invoices', 'professionals', 'therapy_types', 'stock_items', 'stock_movements', 'staff_attendance', 'reminders', 'waitlist'];
    private const DROP_COLLECTIONS = ['integration_secrets', 'otp_challenges', 'tokens', 'counters', 'notifications', 'proposals', 'import_log'];
    private const DROP_FIELDS = ['password_hash', 'totp_secret', 'totp_pending', 'totp_last_step', 'failed_logins', 'locked_until'];

    public function __construct(private readonly Store $store, private readonly Files $files)
    {
    }

    /** Scrive lo ZIP e restituisce il percorso. */
    public function build(string $zipPath, ?string $patientId = null): array
    {
        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $counts = [];
        foreach (array_keys(Schema::COLLECTIONS) as $col) {
            if (in_array($col, self::DROP_COLLECTIONS, true)) {
                continue;
            }
            $rows = $this->store->all($col, null, null, true, true);
            if ($patientId !== null) {
                $rows = array_values(array_filter($rows, fn ($r) => $this->belongsToPatient($col, $r, $patientId)));
            }
            $rows = array_map(static fn ($r) => array_diff_key($r, array_flip(self::DROP_FIELDS)), $rows);
            if ($rows === [] && $patientId !== null) {
                continue;
            }
            $counts[$col] = count($rows);
            $zip->addFromString("json/$col.json", json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            if (in_array($col, self::CSV, true) && $rows !== []) {
                $zip->addFromString("csv/$col.csv", self::csv($rows));
            }
        }
        $nfiles = 0;
        if ($patientId === null) {
            foreach (glob($this->files->root() . '/*/fil_*.json') ?: [] as $metaFile) {
                $meta = json_decode((string) file_get_contents($metaFile), true);
                try {
                    $f = $this->files->read($meta['id']);
                    $zip->addFromString('file/' . $meta['id'] . '_' . $meta['name'], $f['bytes']);
                    $nfiles++;
                } catch (\Throwable) {
                    // un file illeggibile non blocca l'esportazione: viene indicato nel riepilogo
                    $counts['file_illeggibili'] = ($counts['file_illeggibili'] ?? 0) + 1;
                }
            }
        }
        $zip->addFromString('LEGGIMI.txt', "Esportazione completa del gestionale\nCreata il " . Clock::stamp() . "\n\njson/  una raccolta per file, con tutti i campi\ncsv/   le tabelle principali apribili in Excel\nfile/  documenti e allegati con il nome originale\n");
        $zip->close();
        return ['collezioni' => $counts, 'file' => $nfiles];
    }

    private function belongsToPatient(string $col, array $r, string $patientId): bool
    {
        return match ($col) {
            'patients' => $r['id'] === $patientId,
            'episodes', 'appointments', 'documents', 'reminders', 'waitlist' => ($r['patient_id'] ?? null) === $patientId
                || in_array($patientId, array_column($r['participants'] ?? [], 'patient_id'), true),
            'invoices' => ($r['patient_id'] ?? null) === $patientId,
            'messages' => ($r['patient_id'] ?? null) === $patientId,
            default => false,
        };
    }

    public static function csv(array $rows): string
    {
        $cols = [];
        foreach ($rows as $r) {
            foreach ($r as $k => $_) {
                $cols[$k] = true;
            }
        }
        $cols = array_keys($cols);
        $h = fopen('php://temp', 'w+');
        fwrite($h, "\xEF\xBB\xBF");
        fputcsv($h, $cols, ';', '"', '\\');
        foreach ($rows as $r) {
            fputcsv($h, array_map(static function ($c) use ($r) {
                $v = $r[$c] ?? '';
                $v = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : (is_bool($v) ? ($v ? 'sì' : 'no') : (string) $v);
                // neutralizza le formule di Excel
                return $v !== '' && in_array($v[0], ['=', '+', '-', '@'], true) && !is_numeric($v) ? "'" . $v : $v;
            }, $cols), ';', '"', '\\');
        }
        rewind($h);
        return (string) stream_get_contents($h);
    }
}
