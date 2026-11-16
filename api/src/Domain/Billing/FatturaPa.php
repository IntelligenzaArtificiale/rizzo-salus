<?php
declare(strict_types=1);

namespace App\Domain\Billing;

use DOMDocument;
use DOMElement;

/**
 * XML FatturaPA formato FPR12 (versione 1.2.2). Un documento per fattura o nota di credito.
 * La validazione usa lo XSD ufficiale in resources/xsd (copia dell'originale; cambia solo il percorso di xmldsig, reso locale).
 */
final class FatturaPa
{
    private const NS = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2';
    private const XSD = __DIR__ . '/../../../resources/xsd/Schema_del_file_xml_FatturaPA_v1.2.2.xsd';

    private const MP = ['contanti' => 'MP01', 'assegno' => 'MP02', 'bonifico' => 'MP05', 'carta' => 'MP08', 'bancomat' => 'MP08'];

    /**
     * @param array<string,mixed> $inv fattura già numerata
     * @param array<string,mixed> $seller impostazioni "struttura"
     * @param array<string,mixed> $buyer intestatario con codice fiscale e sede
     * @param array<string,mixed> $fiscal impostazioni "fatturazione"
     * @param array<string,mixed>|null $original fattura stornata (solo nota di credito)
     */
    public static function build(array $inv, array $seller, array $buyer, array $fiscal, ?array $original, string $progressivo): string
    {
        $doc = new DOMDocument('1.0', 'UTF-8');
        $doc->formatOutput = true;
        $root = $doc->createElementNS(self::NS, 'p:FatturaElettronica');
        $root->setAttribute('versione', 'FPR12');
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:ds', 'http://www.w3.org/2000/09/xmldsig#');
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        $root->setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:schemaLocation', self::NS . ' http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2.2/Schema_del_file_xml_FatturaPA_v1.2.2.xsd');
        $doc->appendChild($root);

        $piva = (string) $seller['partita_iva'];
        $cfSeller = (string) ($seller['codice_fiscale'] ?: $piva);

        $h = self::el($doc, $root, 'FatturaElettronicaHeader');
        $dt = self::el($doc, $h, 'DatiTrasmissione');
        $id = self::el($doc, $dt, 'IdTrasmittente');
        self::txt($doc, $id, 'IdPaese', 'IT');
        self::txt($doc, $id, 'IdCodice', $cfSeller);
        self::txt($doc, $dt, 'ProgressivoInvio', $progressivo);
        self::txt($doc, $dt, 'FormatoTrasmissione', 'FPR12');
        self::txt($doc, $dt, 'CodiceDestinatario', '0000000');

        $cp = self::el($doc, $h, 'CedentePrestatore');
        $da = self::el($doc, $cp, 'DatiAnagrafici');
        $iva = self::el($doc, $da, 'IdFiscaleIVA');
        self::txt($doc, $iva, 'IdPaese', 'IT');
        self::txt($doc, $iva, 'IdCodice', $piva);
        self::txt($doc, $da, 'CodiceFiscale', $cfSeller);
        $an = self::el($doc, $da, 'Anagrafica');
        self::txt($doc, $an, 'Denominazione', (string) $seller['ragione_sociale']);
        self::txt($doc, $da, 'RegimeFiscale', (string) ($seller['regime_fiscale'] ?: 'RF01'));
        self::sede($doc, $cp, $seller);
        if (!empty($seller['rea'])) {
            // formato libero in anagrafica: "UFFICIO NUMERO" (es. "RM 1234567"); se non conforme si omette
            if (preg_match('/^([A-Za-z]{2})\s*[- ]\s*(\d{1,20})$/', trim((string) $seller['rea']), $m)) {
                $rea = self::el($doc, $cp, 'IscrizioneREA');
                self::txt($doc, $rea, 'Ufficio', strtoupper($m[1]));
                self::txt($doc, $rea, 'NumeroREA', $m[2]);
                self::txt($doc, $rea, 'StatoLiquidazione', 'LN');
            }
        }

        $cc = self::el($doc, $h, 'CessionarioCommittente');
        $da2 = self::el($doc, $cc, 'DatiAnagrafici');
        self::txt($doc, $da2, 'CodiceFiscale', strtoupper((string) $buyer['codice_fiscale']));
        $an2 = self::el($doc, $da2, 'Anagrafica');
        self::txt($doc, $an2, 'Nome', (string) $buyer['nome']);
        self::txt($doc, $an2, 'Cognome', (string) $buyer['cognome']);
        self::sede($doc, $cc, $buyer);

        $body = self::el($doc, $root, 'FatturaElettronicaBody');
        $dg = self::el($doc, $body, 'DatiGenerali');
        $dgd = self::el($doc, $dg, 'DatiGeneraliDocumento');
        $credit = $inv['tipo'] === 'nota_credito';
        self::txt($doc, $dgd, 'TipoDocumento', $credit ? 'TD04' : 'TD01');
        self::txt($doc, $dgd, 'Divisa', 'EUR');
        self::txt($doc, $dgd, 'Data', (string) $inv['date']);
        self::txt($doc, $dgd, 'Numero', (string) $inv['numero_testo']);
        if ((int) $inv['bollo_cents'] > 0) {
            $b = self::el($doc, $dgd, 'DatiBollo');
            self::txt($doc, $b, 'BolloVirtuale', 'SI');
            self::txt($doc, $b, 'ImportoBollo', Money::fmt((int) $inv['bollo_cents']));
        }
        self::txt($doc, $dgd, 'ImportoTotaleDocumento', Money::fmt((int) $inv['totale_cents']));
        if ($credit && $original !== null) {
            self::txt($doc, $dgd, 'Causale', mb_substr('Storno della fattura ' . $original['numero_testo'] . ' del ' . $original['date'] . ': ' . (string) ($inv['motivo'] ?? ''), 0, 200));
            $col = self::el($doc, $dg, 'DatiFattureCollegate');
            self::txt($doc, $col, 'IdDocumento', (string) $original['numero_testo']);
            self::txt($doc, $col, 'Data', (string) $original['date']);
        }

        $bs = self::el($doc, $body, 'DatiBeniServizi');
        $n = 0;
        $natura = (string) $fiscal['natura_esenzione'];
        foreach ($inv['righe'] as $r) {
            $n++;
            $dl = self::el($doc, $bs, 'DettaglioLinee');
            self::txt($doc, $dl, 'NumeroLinea', (string) $n);
            self::txt($doc, $dl, 'Descrizione', mb_substr((string) $r['descrizione'], 0, 1000));
            self::txt($doc, $dl, 'Quantita', number_format((float) $r['quantita'], 2, '.', ''));
            self::txt($doc, $dl, 'PrezzoUnitario', number_format(((int) $r['prezzo_cents']) / 100, 2, '.', ''));
            if ((int) $r['sconto_cents'] > 0) {
                $sc = self::el($doc, $dl, 'ScontoMaggiorazione');
                self::txt($doc, $sc, 'Tipo', 'SC');
                self::txt($doc, $sc, 'Importo', Money::fmt((int) $r['sconto_cents']));
            }
            self::txt($doc, $dl, 'PrezzoTotale', Money::fmt((int) $r['importo_cents']));
            $rate=(float)($r['aliquota_iva']??0);
            self::txt($doc,$dl,'AliquotaIVA',number_format($rate,2,'.',''));
            if($rate===0.0)self::txt($doc,$dl,'Natura',$r['natura_iva']??$natura);
        }
        $extra = 0;
        if ((int) $inv['bollo_cents'] > 0 && ($inv['bollo_a_carico'] ?? 'paziente') === 'paziente') {
            // bollo a carico del cliente: rimborso di spesa anticipata in nome e per conto (art. 15 DPR 633/72) — DA VERIFICARE con la commercialista
            $n++;
            $extra = (int) $inv['bollo_cents'];
            $dl = self::el($doc, $bs, 'DettaglioLinee');
            self::txt($doc, $dl, 'NumeroLinea', (string) $n);
            self::txt($doc, $dl, 'Descrizione', 'Rimborso imposta di bollo');
            self::txt($doc, $dl, 'Quantita', '1.00');
            self::txt($doc, $dl, 'PrezzoUnitario', Money::fmt($extra));
            self::txt($doc, $dl, 'PrezzoTotale', Money::fmt($extra));
            self::txt($doc, $dl, 'AliquotaIVA', '0.00');
            self::txt($doc, $dl, 'Natura', 'N1');
        }
        $summaries=[];
        foreach($inv['righe'] as $r){$rate=(float)($r['aliquota_iva']??0);$nature=$rate>0?'':($r['natura_iva']??$natura);$key=$rate.'|'.$nature;$summaries[$key]??=['rate'=>$rate,'nature'=>$nature,'net'=>0,'vat'=>0];$summaries[$key]['net']+=(int)$r['importo_cents'];$summaries[$key]['vat']+=(int)($r['iva_cents']??0);}
        foreach($summaries as $sum){
            $rie=self::el($doc,$bs,'DatiRiepilogo');self::txt($doc,$rie,'AliquotaIVA',number_format($sum['rate'],2,'.',''));
            if($sum['nature']!=='')self::txt($doc,$rie,'Natura',$sum['nature']);
            self::txt($doc,$rie,'ImponibileImporto',Money::fmt($sum['net']));self::txt($doc,$rie,'Imposta',Money::fmt($sum['vat']));
            if($sum['nature']!=='')self::txt($doc,$rie,'RiferimentoNormativo',mb_substr((string)$fiscal['riferimento_normativo'],0,100));
        }
        if ($extra > 0) {
            $r2 = self::el($doc, $bs, 'DatiRiepilogo');
            self::txt($doc, $r2, 'AliquotaIVA', '0.00');
            self::txt($doc, $r2, 'Natura', 'N1');
            self::txt($doc, $r2, 'ImponibileImporto', Money::fmt($extra));
            self::txt($doc, $r2, 'Imposta', '0.00');
            self::txt($doc, $r2, 'RiferimentoNormativo', 'Escluso art. 15 DPR 633/72');
        }

        if (!empty($inv['pagamento']) && !$credit) {
            $dp = self::el($doc, $body, 'DatiPagamento');
            self::txt($doc, $dp, 'CondizioniPagamento', 'TP02');
            $det = self::el($doc, $dp, 'DettaglioPagamento');
            self::txt($doc, $det, 'ModalitaPagamento', self::MP[$inv['pagamento']['metodo']] ?? 'MP01');
            self::txt($doc, $det, 'DataRiferimentoTerminiPagamento', (string) $inv['pagamento']['data']);
            self::txt($doc, $det, 'ImportoPagamento', Money::fmt((int) $inv['totale_cents']));
        }
        return (string) $doc->saveXML();
    }

    /** @return list<string> errori (vuoto se valido) */
    public static function validate(string $xml): array
    {
        $prev = libxml_use_internal_errors(true);
        libxml_clear_errors();
        $d = new DOMDocument();
        $errors = [];
        if (!@$d->loadXML($xml, LIBXML_NONET)) {
            $errors[] = 'XML non leggibile';
        } elseif (!@$d->schemaValidate(self::XSD)) {
            foreach (libxml_get_errors() as $e) {
                $errors[] = trim($e->message) . ' (riga ' . $e->line . ')';
            }
        }
        libxml_clear_errors();
        libxml_use_internal_errors($prev);
        return $errors;
    }

    /** Nome conforme: IT + codice fiscale del trasmittente + "_" + progressivo (alfanumerico, 5 caratteri). */
    public static function fileName(string $cfSeller, string $progressivo): string
    {
        return 'IT' . $cfSeller . '_' . $progressivo . '.xml';
    }

    private static function sede(DOMDocument $doc, DOMElement $parent, array $a): void
    {
        $s = self::el($doc, $parent, 'Sede');
        self::txt($doc, $s, 'Indirizzo', (string) $a['indirizzo']);
        self::txt($doc, $s, 'CAP', (string) $a['cap']);
        self::txt($doc, $s, 'Comune', (string) $a['citta']);
        if (!empty($a['provincia'])) {
            self::txt($doc, $s, 'Provincia', strtoupper((string) $a['provincia']));
        }
        self::txt($doc, $s, 'Nazione', 'IT');
    }

    private static function el(DOMDocument $doc, DOMElement $parent, string $name): DOMElement
    {
        $e = $doc->createElement($name);
        $parent->appendChild($e);
        return $e;
    }

    private static function txt(DOMDocument $doc, DOMElement $parent, string $name, string $value): void
    {
        $e = $doc->createElement($name);
        $e->appendChild($doc->createTextNode($value));
        $parent->appendChild($e);
    }
}
