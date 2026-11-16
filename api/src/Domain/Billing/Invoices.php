<?php
declare(strict_types=1);

namespace App\Domain\Billing;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Agenda\Appointments;
use App\Services\Files;
use App\Services\Settings;
use App\Store\Store;
use App\Support\Validator as V;

/**
 * Fatture e note di credito.
 * - bozza modificabile; numero assegnato solo all'emissione, dentro la transazione dello store (nessun buco, nemmeno con emissioni concorrenti);
 * - una prestazione (appuntamento + paziente) compare al massimo in una fattura non stornata;
 * - dopo l'emissione non si cancella né si modifica: si storna con una nota di credito.
 */
final class Invoices
{
    public const METHODS = ['contanti', 'bonifico', 'carta', 'bancomat', 'assegno'];
    private const BILLABLE = 'eseguito';

    public function __construct(
        private readonly Store $store,
        private readonly Appointments $appointments,
        private readonly Settings $settings,
        private readonly Files $files,
    ) {
    }

    // ------------------------------------------------------------------ proposta righe

    /**
     * Prestazioni eseguite e non ancora fatturate di un paziente, per periodo oppure per percorso.
     * @return list<array<string,mixed>>
     */
    public function candidates(string $patientId, ?string $from, ?string $to, ?string $episodeId, ?string $excludeInvoice = null): array
    {
        $billed = $this->billedMap($excludeInvoice);
        $therapies = [];
        foreach ($this->store->all('therapy_types') as $t) {
            $therapies[$t['id']] = $t;
        }
        $out = [];
        foreach ($this->appointments->forPatient($patientId) as $a) {
            if (($a['stato'] ?? '') === 'annullato') {
                continue;
            }
            foreach (Appointments::refs($a) as $ref) {
                if ($ref['patient_id'] !== $patientId || $ref['stato'] !== self::BILLABLE) {
                    continue;
                }
                $day = substr($a['start'], 0, 10);
                if (($from && $day < $from) || ($to && $day > $to) || ($episodeId && $ref['episode_id'] !== $episodeId)) {
                    continue;
                }
                $key = $a['id'] . '|' . $patientId;
                $t = $therapies[$a['therapy_type_id'] ?? ''] ?? null;
                $out[] = [
                    'appointment_id' => $a['id'], 'data' => $day, 'tipo_prestazione' => 'appuntamento',
                    'therapy_type_id' => $a['therapy_type_id'] ?? null,
                    'descrizione' => ($t['nome'] ?? 'Prestazione') . ' del ' . self::itDate($day),
                    'quantita' => 1, 'prezzo' => (float) ($t['tariffa'] ?? 0), 'codice_sts' => $t['codice_sts'] ?? null,
                    'gia_fatturata' => isset($billed[$key]), 'in_fattura' => $billed[$key] ?? null,
                    'senza_tariffa' => (float) ($t['tariffa'] ?? 0) <= 0,
                ];
            }
        }
        usort($out, static fn ($x, $y) => strcmp($x['data'], $y['data']) ?: strcmp($x['appointment_id'], $y['appointment_id']));
        return $out;
    }

    // ------------------------------------------------------------------ bozza

    /** @param array<string,mixed> $in */
    public function saveDraft(array $in, ?string $id = null, ?int $revision = null): array
    {
        return $this->store->transaction(function () use ($in, $id, $revision) {
            $existing = $id ? ($this->store->get('invoices', $id) ?? throw ApiError::notFound('fattura_non_trovata')) : null;
            if ($existing && $existing['stato'] !== 'bozza') {
                throw new ApiError('fattura_non_modificabile', 409, ['stato' => $existing['stato']]);
            }
            $patientId = V::id($in, 'patient_id', 'paz', true);
            $this->store->get('patients', $patientId) ?? throw new ApiError('paziente_non_trovato', 422);
            $righe = $this->normalizeLines($in['righe'] ?? null, $patientId, $id);
            $rec = ($existing ?? []) + [
                'tipo' => 'fattura', 'stato' => 'bozza', 'date' => Clock::today(), 'numero' => null, 'numero_testo' => null, 'sezionale' => null,
            ];
            $rec['patient_id'] = $patientId;
            $rec['episode_id'] = V::id($in, 'episode_id', 'epi');
            $rec['intestatario'] = $this->holder($in['intestatario'] ?? null);
            $rec['sanitaria']=false;
            foreach($righe as $line){$tt=!empty($line['therapy_type_id'])?$this->store->get('therapy_types',$line['therapy_type_id']):null;if(!$tt||($tt['sanitaria']??true))$rec['sanitaria']=true;}
            $rec['righe'] = $righe;
            $rec['note'] = V::str($in, 'note', false, 500);
            $rec['sts_opposizione'] = V::bool($in, 'sts_opposizione', (bool) ($rec['sts_opposizione'] ?? false));
            $rec = array_merge($rec, $this->totals($righe));
            $rec['bollo_a_carico'] = $this->settings->get('fatturazione.bollo_a_carico', 'paziente');
            return $this->store->put('invoices', $rec, $revision);
        });
    }

    public function deleteDraft(string $id): void
    {
        $inv = $this->store->get('invoices', $id) ?? throw ApiError::notFound('fattura_non_trovata');
        if ($inv['stato'] !== 'bozza') {
            throw new ApiError('fattura_non_cancellabile', 409, ['stato' => $inv['stato']]);
        }
        $this->store->softDelete('invoices', $id);
    }

    // ------------------------------------------------------------------ emissione

    public function issue(string $id): array
    {
        return $this->store->transaction(function () use ($id) {
            $inv = $this->store->get('invoices', $id) ?? throw ApiError::notFound('fattura_non_trovata');
            if ($inv['stato'] !== 'bozza') {
                throw new ApiError('fattura_gia_emessa', 409, ['stato' => $inv['stato']]);
            }
            if ($inv['righe'] === []) {
                throw new ApiError('fattura_senza_righe', 422);
            }
            // ricontrollo al momento dell'emissione: nel frattempo un'altra bozza potrebbe averla emessa
            $righe = $this->normalizeLines($inv['righe'], $inv['patient_id'], $id, true);
            $inv = array_merge($inv, ['righe' => $righe], $this->totals($righe));
            $seller = $this->seller();
            $buyer = $this->buyer($inv);

            $today = Clock::today();
            [$n, $sez] = $this->nextNumber('fattura', $today);
            $inv['date'] = $today;
            $inv['numero'] = $n;
            $inv['sezionale'] = $sez;
            $inv['numero_testo'] = $sez . '/' . substr($today, 0, 4) . '/' . $n;
            $inv['stato'] = 'emessa';
            $inv['emessa_il'] = Clock::stamp();
            $inv = $this->attachXml($inv, $seller, $buyer, null);
            return $this->store->put('invoices', $inv);
        });
    }

    public function pay(string $id, string $method, string $date): array
    {
        if (!in_array($method, self::METHODS, true)) {
            throw new ApiError('metodo_pagamento_non_valido', 422);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || $date > Clock::today()) {
            throw new ApiError('data_pagamento_non_valida', 422);
        }
        return $this->store->transaction(function () use ($id, $method, $date) {
            $inv = $this->store->get('invoices', $id) ?? throw ApiError::notFound('fattura_non_trovata');
            if ($inv['tipo'] !== 'fattura' || !in_array($inv['stato'], ['emessa'], true)) {
                throw new ApiError('fattura_non_pagabile', 409, ['stato' => $inv['stato']]);
            }
            $inv['pagamento'] = ['metodo' => $method, 'data' => $date, 'tracciabile' => $method !== 'contanti', 'importo_cents' => $inv['totale_cents']];
            $inv['stato'] = 'pagata';
            return $this->store->put('invoices', $inv);
        });
    }

    /** Storna una fattura emessa o pagata con una nota di credito (numero proprio, sezionale "NC"). */
    public function creditNote(string $id, string $reason): array
    {
        $reason = trim($reason);
        if ($reason === '') {
            throw new ApiError('motivo_obbligatorio', 422, ['campo' => 'motivo']);
        }
        return $this->store->transaction(function () use ($id, $reason) {
            $orig = $this->store->get('invoices', $id) ?? throw ApiError::notFound('fattura_non_trovata');
            if ($orig['tipo'] !== 'fattura' || !in_array($orig['stato'], ['emessa', 'pagata'], true)) {
                throw new ApiError('fattura_non_stornabile', 409, ['stato' => $orig['stato']]);
            }
            $seller = $this->seller();
            $buyer = $this->buyer($orig);
            $today = Clock::today();
            [$n, $sez] = $this->nextNumber('nota_credito', $today);
            $note = [
                'tipo' => 'nota_credito', 'stato' => 'emessa', 'date' => $today, 'numero' => $n, 'sezionale' => $sez,
                'numero_testo' => $sez . '/' . substr($today, 0, 4) . '/' . $n, 'patient_id' => $orig['patient_id'], 'episode_id' => $orig['episode_id'] ?? null,
                'intestatario' => $orig['intestatario'] ?? null, 'righe' => $orig['righe'],
                'sanitaria'=>$orig['sanitaria']??true, 'iva_cents'=>$orig['iva_cents']??0, 'imponibile_cents' => $orig['imponibile_cents'], 'bollo_cents' => $orig['bollo_cents'], 'bollo_a_carico' => $orig['bollo_a_carico'],
                'totale_cents' => $orig['totale_cents'], 'motivo' => $reason, 'storna_id' => $orig['id'], 'emessa_il' => Clock::stamp(),
                'sts_opposizione' => $orig['sts_opposizione'] ?? false, 'note' => null,
            ];
            $note = $this->attachXml($note, $seller, $buyer, $orig);
            $note = $this->store->put('invoices', $note);
            $orig['stato'] = 'annullata';
            $orig['nota_credito_id'] = $note['id'];
            $this->store->put('invoices', $orig);
            return $note;
        });
    }

    public function setStsOpposition(string $id, bool $opposed): array
    {
        return $this->store->transaction(function () use ($id, $opposed) {
            $inv = $this->store->get('invoices', $id) ?? throw ApiError::notFound('fattura_non_trovata');
            $inv['sts_opposizione'] = $opposed;
            return $this->store->put('invoices', $inv);
        });
    }

    // ------------------------------------------------------------------ lettura

    public function get(string $id): array
    {
        return $this->store->get('invoices', $id) ?? throw ApiError::notFound('fattura_non_trovata');
    }

    /** @return list<array<string,mixed>> */
    public function list(?string $from, ?string $to, ?string $patientId, ?string $state): array
    {
        $years = $from && $to ? $this->store->partsBetween('invoices', $from, $to) : null;
        $rows = $this->store->all('invoices', static function ($i) use ($from, $to, $patientId, $state) {
            return (!$from || $i['date'] >= $from) && (!$to || $i['date'] <= $to)
                && (!$patientId || $i['patient_id'] === $patientId) && (!$state || $i['stato'] === $state);
        }, $years);
        usort($rows, static fn ($a, $b) => strcmp($b['date'], $a['date']) ?: strcmp((string) $b['numero_testo'], (string) $a['numero_testo']));
        return $rows;
    }

    // ------------------------------------------------------------------ interni

    /** @return array<string,string> "appuntamento|paziente" => id fattura, per le fatture emesse e non stornate (le bozze non bloccano: conta l'emissione) */
    private function billedMap(?string $exclude = null): array
    {
        $map = [];
        foreach ($this->store->all('invoices') as $i) {
            if ($i['tipo'] !== 'fattura' || in_array($i['stato'], ['bozza', 'annullata'], true) || $i['id'] === $exclude) {
                continue;
            }
            foreach ($i['righe'] as $r) {
                if (!empty($r['appointment_id'])) {
                    $map[$r['appointment_id'] . '|' . $i['patient_id']] = $i['id'];
                }
            }
        }
        return $map;
    }

    /**
     * @param mixed $raw
     * @return list<array<string,mixed>>
     */
    private function normalizeLines(mixed $raw, string $patientId, ?string $invoiceId, bool $stored = false): array
    {
        if (!is_array($raw) || $raw === []) {
            throw new ApiError('righe_obbligatorie', 422, ['campo' => 'righe']);
        }
        $billed = $this->billedMap($invoiceId);
        $seen = [];
        $out = [];
        foreach (array_values($raw) as $i => $r) {
            if (!is_array($r)) {
                throw new ApiError('riga_non_valida', 422, ['riga' => $i + 1]);
            }
            $qty = $stored ? (float) $r['quantita'] : (V::num($r, 'quantita', false, 0.01, 9999) ?? 1.0);
            if ($stored) {
                $price = (int) $r['prezzo_cents'];
                $discount = (int) $r['sconto_cents'];
            } else {
                $price = Money::cents(V::num($r, 'prezzo', true, 0, 1000000) ?? 0);
                $discount = Money::cents(V::num($r, 'sconto', false, 0, 1000000) ?? 0);
            }
            $reason = $stored ? ($r['sconto_motivo'] ?? null) : V::str($r, 'sconto_motivo', false, 200);
            if ($discount > 0 && ($reason === null || trim($reason) === '')) {
                throw new ApiError('motivo_sconto_obbligatorio', 422, ['riga' => $i + 1]);
            }
            $gross = (int) round($qty * $price);
            if ($discount > $gross) {
                throw new ApiError('sconto_maggiore_del_prezzo', 422, ['riga' => $i + 1]);
            }
            $appointmentId = $r['appointment_id'] ?? null;
            $tipo = $stored ? ($r['tipo_prestazione'] ?? 'appuntamento') : V::enum($r, 'tipo_prestazione', ['appuntamento', 'libera'], false, $appointmentId ? 'appuntamento' : 'libera');
            if ($appointmentId !== null) {
                $key = $appointmentId . '|' . $patientId;
                if (isset($seen[$key])) {
                    throw new ApiError('prestazione_duplicata_nella_fattura', 409, ['riga' => $i + 1]);
                }
                $seen[$key] = true;
                if (isset($billed[$key])) {
                    throw new ApiError('prestazione_gia_fatturata', 409, ['riga' => $i + 1, 'fattura_id' => $billed[$key]]);
                }
                $a = $this->store->get('appointments', (string) $appointmentId) ?? throw new ApiError('appuntamento_non_trovato', 422, ['riga' => $i + 1]);
                $mine = array_values(array_filter(Appointments::refs($a), static fn ($x) => $x['patient_id'] === $patientId));
                if ($mine === [] || $mine[0]['stato'] !== self::BILLABLE) {
                    throw new ApiError('prestazione_non_eseguita', 422, ['riga' => $i + 1]);
                }
            } elseif ($tipo === 'appuntamento') {
                throw new ApiError('appuntamento_obbligatorio', 422, ['riga' => $i + 1]);
            }
            $typeId=$appointmentId?($a['therapy_type_id']??null):($r['therapy_type_id']??null);
            $therapy=$typeId?$this->store->get('therapy_types',$typeId):null;
            if($typeId&&!$therapy)throw new ApiError('terapia_non_trovata',422);
            $nature=$stored?($r['natura_iva']??'N4'):($therapy['natura_iva']??'N4');
            $rate=$stored?(float)($r['aliquota_iva']??0):($nature==='ordinaria'?(float)($therapy['aliquota_iva']??0):0.0);
            $desc = $stored ? (string) $r['descrizione'] : (V::str($r, 'descrizione', true, 300) ?? '');
            $out[] = [
                'appointment_id' => $appointmentId, 'tipo_prestazione' => $tipo, 'therapy_type_id' => $typeId, 'natura_iva'=>$nature, 'aliquota_iva'=>$rate, 'iva_cents'=>(int)round(($gross-$discount)*$rate/100),
                'descrizione' => $desc, 'quantita' => $qty, 'prezzo_cents' => $price, 'sconto_cents' => $discount, 'sconto_motivo' => $discount > 0 ? trim((string) $reason) : null,
                'importo_cents' => $gross - $discount, 'codice_sts' => $stored?($r['codice_sts']??null):($therapy['codice_sts']??null), 'data_prestazione' => $r['data_prestazione'] ?? $r['data'] ?? null,
            ];
        }
        return $out;
    }

    /** @return array{imponibile_cents:int,bollo_cents:int,totale_cents:int} */
    private function totals(array $righe): array
    {
        return InvoiceTax::totals($righe,$this->settings);
    }

    private function holder(mixed $h): ?array
    {
        if (!is_array($h) || $h === []) {
            return null;
        }
        $cf = V::str($h, 'codice_fiscale', true, 16);
        if ($cf === null || !\App\Support\FiscalCode::isValid(strtoupper($cf))) {
            throw new ApiError('codice_fiscale_non_valido', 422, ['campo' => 'intestatario.codice_fiscale']);
        }
        return [
            'nome' => V::str($h, 'nome', true, 80), 'cognome' => V::str($h, 'cognome', true, 80), 'codice_fiscale' => strtoupper($cf),
            'indirizzo' => V::str($h, 'indirizzo', true, 160), 'cap' => V::str($h, 'cap', true, 5), 'citta' => V::str($h, 'citta', true, 80), 'provincia' => V::str($h, 'provincia', false, 2),
        ];
    }

    /** @return array<string,mixed> */
    private function seller(): array
    {
        $s = (array) $this->settings->get('struttura', []);
        $missing = [];
        foreach (['ragione_sociale', 'partita_iva', 'indirizzo', 'cap', 'citta', 'provincia'] as $k) {
            if (trim((string) ($s[$k] ?? '')) === '') {
                $missing[] = $k;
            }
        }
        if (!empty($s['partita_iva']) && !self::vatOk((string) $s['partita_iva'])) {
            $missing[] = 'partita_iva_non_valida';
        }
        if (!empty($s['cap']) && !preg_match('/^\d{5}$/', (string) $s['cap'])) {
            $missing[] = 'cap_non_valido';
        }
        if ($missing) {
            throw new ApiError('struttura_incompleta', 422, ['campi' => $missing]);
        }
        return $s;
    }

    /** @return array<string,mixed> */
    private function buyer(array $inv): array
    {
        $h = $inv['intestatario'] ?? null;
        if (!$h) {
            $p = $this->store->get('patients', $inv['patient_id']) ?? throw new ApiError('paziente_non_trovato', 422);
            $h = array_intersect_key($p, array_flip(['nome', 'cognome', 'codice_fiscale', 'indirizzo', 'cap', 'citta', 'provincia']));
        }
        $missing = [];
        foreach (['nome', 'cognome', 'codice_fiscale', 'indirizzo', 'cap', 'citta'] as $k) {
            if (trim((string) ($h[$k] ?? '')) === '') {
                $missing[] = $k;
            }
        }
        if (!empty($h['cap']) && !preg_match('/^\d{5}$/', (string) $h['cap'])) {
            $missing[] = 'cap_non_valido';
        }
        if ($missing) {
            throw new ApiError('dati_intestatario_incompleti', 422, ['campi' => $missing]);
        }
        return $h;
    }

    /** @return array{0:int,1:string} numero e sezionale; il contatore vive nella transazione, quindi un errore successivo non lascia buchi */
    private function nextNumber(string $kind, string $date): array
    {
        $sez = $kind === 'nota_credito' ? 'NC' : (string) $this->settings->get('fatturazione.sezionale', 'A');
        if (!preg_match('/^[A-Z0-9]{1,5}$/', $sez)) {
            throw new ApiError('sezionale_non_valido', 422);
        }
        $year = substr($date, 0, 4);
        $cid = "cnt_fat_{$sez}_{$year}";
        $c = $this->store->get('counters', $cid) ?? ['id' => $cid, 'n' => 0, 'last_date' => '0000-00-00'];
        if ($date < $c['last_date']) {
            throw new ApiError('data_precedente_ultima_fattura', 409, ['ultima' => $c['last_date']]);
        }
        $c['n'] = (int) $c['n'] + 1;
        $c['last_date'] = $date;
        $this->store->put('counters', $c);
        return [$c['n'], $sez];
    }

    /** Genera, valida contro lo XSD e archivia l'XML. Se non è valido l'emissione fallisce e non si consuma il numero. */
    private function attachXml(array $inv, array $seller, array $buyer, ?array $orig): array
    {
        $xid = 'cnt_fat_xml';
        $c = $this->store->get('counters', $xid) ?? ['id' => $xid, 'n' => 0];
        $c['n'] = (int) $c['n'] + 1;
        $this->store->put('counters', $c);
        $prog = str_pad((string) $c['n'], 5, '0', STR_PAD_LEFT);
        $fiscal = (array) $this->settings->get('fatturazione', []);
        $xml = FatturaPa::build($inv, $seller, $buyer, $fiscal, $orig, $prog);
        $errors = FatturaPa::validate($xml);
        if ($errors) {
            throw new ApiError('xml_non_valido', 422, ['errori' => array_slice($errors, 0, 5)]);
        }
        $cf = (string) ($seller['codice_fiscale'] ?: $seller['partita_iva']);
        $name = FatturaPa::fileName($cf, $prog);
        $f = $this->files->put($xml, $name, 'application/xml', 'fattura_xml', 'invoices', $inv['id'] ?? null);
        $inv['xml_file_id'] = $f['id'];
        $inv['xml_nome'] = $name;
        $inv['xml_sha256'] = $f['sha256'];
        $inv['xml_valido'] = true;
        $inv['sts_stato'] = ($inv['sts_opposizione'] ?? false) ? 'opposizione' : 'da_inviare';
        return $inv;
    }

    public static function vatOk(string $v): bool
    {
        if (!preg_match('/^\d{11}$/', $v)) {
            return false;
        }
        $s = 0;
        for ($i = 0; $i < 10; $i++) {
            $d = (int) $v[$i];
            if ($i % 2 === 1) {
                $d *= 2;
                if ($d > 9) {
                    $d -= 9;
                }
            }
            $s += $d;
        }
        return (10 - $s % 10) % 10 === (int) $v[10];
    }

    private static function itDate(string $ymd): string
    {
        return substr($ymd, 8, 2) . '/' . substr($ymd, 5, 2) . '/' . substr($ymd, 0, 4);
    }
}
