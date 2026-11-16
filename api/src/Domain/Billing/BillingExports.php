<?php
declare(strict_types=1);

namespace App\Domain\Billing;

use App\Services\{Files, Settings};
use App\Store\Store;
use Dompdf\{Dompdf, Options};
use ZipArchive;

/** Uscite della fatturazione: ZIP degli XML con riepilogo CSV, fattura di cortesia in PDF, export per il Sistema TS. */
final class BillingExports
{
    public function __construct(private readonly Store $store, private readonly Files $files, private readonly Settings $settings)
    {
    }

    /** CSV con punto e virgola e BOM, si apre in Excel senza importazione guidata. @param list<array<string,mixed>> $invoices */
    public function summaryCsv(array $invoices): string
    {
        $patients = [];
        $out = "\xEF\xBB\xBF" . implode(';', ['Numero', 'Data', 'Tipo', 'Stato', 'Paziente', 'Codice fiscale', 'Imponibile esente', 'Bollo', 'Totale', 'Pagamento', 'Metodo', 'Tracciabile', 'File XML']) . "\r\n";
        foreach ($invoices as $i) {
            $p = $patients[$i['patient_id']] ??= ($this->store->get('patients', $i['patient_id']) ?? []);
            $h = $i['intestatario'] ?? $p;
            $out .= implode(';', array_map([self::class, 'cell'], [
                $i['numero_testo'], $i['date'], $i['tipo'] === 'nota_credito' ? 'Nota di credito' : 'Fattura', $i['stato'],
                trim(($h['cognome'] ?? '') . ' ' . ($h['nome'] ?? '')), $h['codice_fiscale'] ?? '',
                Money::fmt((int) $i['imponibile_cents']), Money::fmt((int) $i['bollo_cents']), Money::fmt((int) $i['totale_cents']),
                $i['pagamento']['data'] ?? '', $i['pagamento']['metodo'] ?? '', isset($i['pagamento']) ? ($i['pagamento']['tracciabile'] ? 'sì' : 'no') : '', $i['xml_nome'] ?? '',
            ])) . "\r\n";
        }
        return $out;
    }

    /** @param list<array<string,mixed>> $invoices @return string contenuto dello ZIP */
    public function xmlArchive(array $invoices): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'xmlz');
        $zip = new ZipArchive();
        $zip->open($tmp, ZipArchive::OVERWRITE);
        $emitted = array_values(array_filter($invoices, static fn ($i) => !empty($i['xml_file_id'])));
        foreach ($emitted as $i) {
            $zip->addFromString($i['xml_nome'], $this->files->read($i['xml_file_id'])['bytes']);
        }
        $zip->addFromString('riepilogo.csv', $this->summaryCsv($emitted));
        $zip->close();
        $bytes = (string) file_get_contents($tmp);
        @unlink($tmp);
        return $bytes;
    }

    /** Fattura di cortesia: copia leggibile per il paziente, non sostituisce l'XML. */
    public function courtesyPdf(array $inv): string
    {
        $s = (array) $this->settings->get('struttura', []);
        $f = (array) $this->settings->get('fatturazione', []);
        $h = $inv['intestatario'] ?? ($this->store->get('patients', $inv['patient_id']) ?? []);
        $e = static fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $rows = '';
        foreach ($inv['righe'] as $r) {
            $rows .= '<tr><td>' . $e($r['descrizione']) . '</td><td class="n">' . $e(rtrim(rtrim(number_format((float) $r['quantita'], 2, ',', ''), '0'), ',')) . '</td><td class="n">'
                . Money::human((int) $r['prezzo_cents']) . '</td><td class="n">' . ($r['sconto_cents'] ? '−' . Money::human((int) $r['sconto_cents']) : '') . '</td><td class="n">' . Money::human((int) $r['importo_cents']) . '</td></tr>';
        }
        $title = $inv['tipo'] === 'nota_credito' ? 'Nota di credito' : 'Fattura';
        $bollo = (int) $inv['bollo_cents'] > 0
            ? '<p>Imposta di bollo: ' . Money::human((int) $inv['bollo_cents']) . ($inv['bollo_a_carico'] === 'paziente' ? ' (a carico del cliente, inclusa nel totale)' : ' (a carico della struttura)') . '</p>' : '';
        $pay = !empty($inv['pagamento']) ? '<p>Pagata il ' . $e($inv['pagamento']['data']) . ' con ' . $e($inv['pagamento']['metodo']) . ($inv['pagamento']['tracciabile'] ? ' (pagamento tracciabile)' : '') . '.</p>' : '';
        $html = '<html><head><meta charset="utf-8"><style>body{font-family:DejaVu Sans,sans-serif;font-size:10pt;color:#222}h1{font-size:16pt;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:14px}'
            . 'th,td{border-bottom:1px solid #ccc;padding:6px;text-align:left}th{background:#f2f2f2}.n{text-align:right}.tot{font-size:12pt;font-weight:bold;text-align:right;margin-top:10px}.box{margin-top:12px}.small{font-size:8pt;color:#555;margin-top:22px}</style></head><body>'
            . '<h1>' . $e($s['ragione_sociale'] ?? '') . '</h1><div>' . $e($s['indirizzo'] ?? '') . ' - ' . $e($s['cap'] ?? '') . ' ' . $e($s['citta'] ?? '') . ' (' . $e($s['provincia'] ?? '') . ')<br>P. IVA ' . $e($s['partita_iva'] ?? '') . '</div>'
            . '<h2>' . $title . ' n. ' . $e($inv['numero_testo']) . ' del ' . $e(substr($inv['date'], 8, 2) . '/' . substr($inv['date'], 5, 2) . '/' . substr($inv['date'], 0, 4)) . '</h2>'
            . ($inv['tipo'] === 'nota_credito' ? '<p>Storno della fattura collegata. Motivo: ' . $e($inv['motivo'] ?? '') . '</p>' : '')
            . '<div class="box"><b>Intestatario</b><br>' . $e(($h['cognome'] ?? '') . ' ' . ($h['nome'] ?? '')) . '<br>CF ' . $e($h['codice_fiscale'] ?? '') . '<br>' . $e($h['indirizzo'] ?? '') . ' ' . $e($h['cap'] ?? '') . ' ' . $e($h['citta'] ?? '') . '</div>'
            . '<table><tr><th>Descrizione</th><th class="n">Q.tà</th><th class="n">Prezzo</th><th class="n">Sconto</th><th class="n">Importo</th></tr>' . $rows . '</table>'
            . '<p>Trattamento IVA secondo le singole prestazioni — ' . $e($f['riferimento_normativo'] ?? '') . '</p>' . $bollo
            . '<p>IVA: '.Money::human((int)($inv['iva_cents']??0)).'</p>' . '<div class="tot">Totale ' . Money::human((int) $inv['totale_cents']) . '</div>' . $pay
            . '<p class="small">Documento per il paziente. Le fatture sanitarie a persone fisiche non sono destinate al Sistema di Interscambio. Conservare secondo le procedure fiscali della struttura.</p></body></html>';
        $opt = new Options();
        $opt->set('isRemoteEnabled', false);
        $opt->set('chroot', sys_get_temp_dir());
        $pdf = new Dompdf($opt);
        $pdf->loadHtml($html, 'UTF-8');
        $pdf->setPaper('A4');
        $pdf->render();
        return (string) $pdf->output();
    }

    /**
     * Export per il Sistema Tessera Sanitaria. Il tracciato è quello operativo comune (una riga per spesa); formato, cifratura del
     * codice fiscale e periodicità vanno confermati prima dell'invio diretto: [DA VERIFICARE]. Le fatture con opposizione sono escluse.
     * @param list<array<string,mixed>> $invoices
     */
    public function stsCsv(array $invoices): string
    {
        $patients = [];
        $s = (array) $this->settings->get('struttura', []);
        $out = "\xEF\xBB\xBF" . implode(';', ['PartitaIvaStruttura', 'CodiceFiscalePaziente', 'DataDocumento', 'NumeroDocumento', 'Tipo', 'TipoSpesa', 'Importo', 'FlagPagamentoTracciato', 'DocumentoCollegato']) . "\r\n";
        foreach ($invoices as $i) {
            if (!empty($i['sts_opposizione']) || $i['stato'] === 'bozza' || ($i['tipo'] === 'fattura' && $i['stato'] === 'annullata')) {
                continue;
            }
            $p = $patients[$i['patient_id']] ??= ($this->store->get('patients', $i['patient_id']) ?? []);
            $cf = $i['intestatario']['codice_fiscale'] ?? ($p['codice_fiscale'] ?? '');
            $byType = [];
            foreach ($i['righe'] as $r) {
                $k = (string) ($r['codice_sts'] ?: 'SP');
                $byType[$k] = ($byType[$k] ?? 0) + (int) $r['importo_cents'];
            }
            foreach ($byType as $code => $cents) {
                $credit = $i['tipo'] === 'nota_credito';
                $out .= implode(';', array_map([self::class, 'cell'], [
                    $s['partita_iva'] ?? '', $cf, $i['date'], $i['numero_testo'], $credit ? 'R' : 'F', $code, Money::fmt($cents),
                    !$credit && !empty($i['pagamento']) ? ($i['pagamento']['tracciabile'] ? 'SI' : 'NO') : '', $credit ? ($i['storna_id'] ?? '') : '',
                ])) . "\r\n";
            }
        }
        return $out;
    }

    private static function cell(mixed $v): string
    {
        $v = (string) $v;
        if ($v !== '' && strpbrk($v[0], "=+-@\t\r") !== false && !is_numeric($v)) {
            $v = "'" . $v;   // evita che un nome diventi una formula in Excel
        }
        return str_contains($v, ';') || str_contains($v, '"') || str_contains($v, "\n") ? '"' . str_replace('"', '""', $v) . '"' : $v;
    }

    /** Prospetto compensi per il professionista (CSV apribile in Excel). */
    public function compensationCsv(array $c): string
    {
        $out = "\xEF\xBB\xBF" . implode(';', ['Data', 'Prestazione', 'Base', 'Percentuale', 'Quota professionista', 'Quota struttura', 'Fatturata']) . "\r\n";
        foreach ($c['righe'] as $r) {
            $out .= implode(';', array_map([self::class, 'cell'], [$r['data'], $r['descrizione'], Money::fmt((int) $r['base_cents']), str_replace('.', ',', (string) $r['percentuale']) . '%',
                Money::fmt((int) $r['quota_professionista_cents']), Money::fmt((int) $r['quota_struttura_cents']), $r['fatturata'] ? 'sì' : 'no'])) . "\r\n";
        }
        $out .= implode(';', ['Totale', '', Money::fmt((int) $c['totale_base_cents']), '', Money::fmt((int) $c['quota_professionista_cents']), Money::fmt((int) $c['quota_struttura_cents']), '']) . "\r\n";
        return $out;
    }
}
