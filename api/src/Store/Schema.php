<?php
declare(strict_types=1);

namespace App\Store;

/**
 * Descrive le collezioni dello store JSON: prefisso degli id, partizione, campi cifrati,
 * versione dello schema e migrazioni. Il dominio non conosce i nomi dei file.
 */
final class Schema
{
    /**
     * part: null = un solo file; ['field' => campo, 'by' => 'year'|'month'] = un file per periodo.
     * enc: campi cifrati con libsodium (dati clinici e segreti).
     */
    public const COLLECTIONS = [
        'users' => ['prefix' => 'usr', 'part' => null, 'enc' => ['totp_secret'], 'version' => 1],
        'professionals' => ['prefix' => 'pro', 'part' => null, 'enc' => [], 'version' => 1],
        'patients' => ['prefix' => 'paz', 'part' => null, 'enc' => ['anamnesi', 'allergie', 'avvertenze', 'anamnesi_voci'], 'version' => 1],
        'episodes' => ['prefix' => 'epi', 'part' => null, 'enc' => ['diagnosi', 'note_terapeutiche', 'diario', 'profilo_gruppo', 'distretti'], 'version' => 1],
        'therapy_types' => ['prefix' => 'ter', 'part' => null, 'enc' => [], 'version' => 1],
        'resources' => ['prefix' => 'ris', 'part' => null, 'enc' => [], 'version' => 1],
        'groups' => ['prefix' => 'grp', 'part' => null, 'enc' => [], 'version' => 1],
        'appointments' => ['prefix' => 'app', 'part' => ['field' => 'start', 'by' => 'year'], 'enc' => [], 'version' => 1],
        'waitlist' => ['prefix' => 'att', 'part' => null, 'enc' => [], 'version' => 1],
        'bookings_online' => ['prefix' => 'pre', 'part' => null, 'enc' => ['dati'], 'version' => 1],
        'messages' => ['prefix' => 'msg', 'part' => ['field' => 'created_at', 'by' => 'month'], 'enc' => [], 'version' => 1],
        'message_templates' => ['prefix' => 'tpl', 'part' => null, 'enc' => [], 'version' => 1],
        'automations' => ['prefix' => 'aut', 'part' => null, 'enc' => [], 'version' => 1],
        'reminders' => ['prefix' => 'rim', 'part' => null, 'enc' => [], 'version' => 1],
        'campaigns' => ['prefix' => 'cam', 'part' => null, 'enc' => [], 'version' => 1],
        'contacts' => ['prefix' => 'con', 'part' => null, 'enc' => [], 'version' => 1],
        'notified' => ['prefix' => 'ntf', 'part' => null, 'enc' => [], 'version' => 1],
        'changes' => ['prefix' => 'var', 'part' => null, 'enc' => [], 'version' => 1],
        'invoices' => ['prefix' => 'fat', 'part' => ['field' => 'date', 'by' => 'year'], 'enc' => [], 'version' => 1],
        'compensations' => ['prefix' => 'com', 'part' => null, 'enc' => [], 'version' => 1],
        'packages' => ['prefix' => 'pac', 'part' => null, 'enc' => [], 'version' => 1],
        'documents' => ['prefix' => 'doc', 'part' => null, 'enc' => ['contenuto'], 'version' => 1],
        'document_templates' => ['prefix' => 'mod', 'part' => null, 'enc' => [], 'version' => 1],
        'staff_attendance' => ['prefix' => 'prs', 'part' => ['field' => 'date', 'by' => 'year'], 'enc' => [], 'version' => 1],
        'staff_adjustments' => ['prefix' => 'cor', 'part' => null, 'enc' => [], 'version' => 1],
        'stock_items' => ['prefix' => 'art', 'part' => null, 'enc' => [], 'version' => 1],
        'stock_movements' => ['prefix' => 'mov', 'part' => ['field' => 'date', 'by' => 'year'], 'enc' => [], 'version' => 1],
        'audit_log' => ['prefix' => 'aud', 'part' => ['field' => 'at', 'by' => 'month'], 'enc' => [], 'version' => 1],
        'settings' => ['prefix' => 'set', 'part' => null, 'enc' => [], 'version' => 1],
        'counters' => ['prefix' => 'cnt', 'part' => null, 'enc' => [], 'version' => 1],
        'tokens' => ['prefix' => 'tok', 'part' => null, 'enc' => [], 'version' => 1],
        'ai_usage' => ['prefix' => 'aiu', 'part' => ['field' => 'at', 'by' => 'month'], 'enc' => [], 'version' => 1],
        'operator_plans' => ['prefix' => 'opa', 'part' => null, 'enc' => ['azioni','anteprima','risultati'], 'version' => 1],
        'training_documents' => ['prefix' => 'frm', 'part' => null, 'enc' => ['testo'], 'version' => 1],
        'notifications' => ['prefix' => 'not', 'part' => null, 'enc' => [], 'version' => 1],
        'import_log' => ['prefix' => 'imp', 'part' => null, 'enc' => ['righe','estratto'], 'version' => 1],
        'integration_secrets' => ['prefix' => 'sec', 'part' => null, 'enc' => ['valori'], 'version' => 1],
        'otp_challenges' => ['prefix' => 'otp', 'part' => null, 'enc' => [], 'version' => 1],
        'expenses' => ['prefix' => 'spe', 'part' => null, 'enc' => [], 'version' => 1],
        'suppliers' => ['prefix' => 'for', 'part' => null, 'enc' => [], 'version' => 1],
        'booking_windows' => ['prefix' => 'fin', 'part' => null, 'enc' => [], 'version' => 1],
        'review_exports' => ['prefix' => 'exp', 'part' => null, 'enc' => [], 'version' => 1],
        'proposals' => ['prefix' => 'prp', 'part' => null, 'enc' => [], 'version' => 1],
    ];

    /**
     * Migrazioni idempotenti: collezione => [versione di arrivo => funzione(array $records): array].
     * @var array<string,array<int,callable>>
     */
    public static array $migrations = [];

    /** @return array<string,mixed> */
    public static function of(string $collection): array
    {
        return self::COLLECTIONS[$collection] ?? throw new \InvalidArgumentException("Collezione sconosciuta: $collection");
    }

    /** Chiave di partizione di un record ("2026" o "2026-03"), oppure "_" se la collezione è in un solo file. */
    public static function partitionOf(string $collection, array $record): string
    {
        $part = self::of($collection)['part'];
        if ($part === null) {
            return '_';
        }
        $value = (string) ($record[$part['field']] ?? '');
        if (strlen($value) < 7 || !preg_match('/^\d{4}-\d{2}/', $value)) {
            throw new \InvalidArgumentException("Il campo {$part['field']} è obbligatorio per salvare in $collection");
        }
        return $part['by'] === 'year' ? substr($value, 0, 4) : substr($value, 0, 7);
    }
}
