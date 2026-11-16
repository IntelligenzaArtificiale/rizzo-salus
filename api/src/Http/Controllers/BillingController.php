<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\ApiError;
use App\Http\Context;
use App\Http\Response;
use App\Support\Validator as V;

/** Fatture: proposta righe, bozza, emissione, pagamento, nota di credito. Permesso fatture.gestisci su tutte le rotte. */
final class BillingController
{
    public function proponi(Context $c): array
    {
        $b = $c->body();
        $rows = $c->svc->invoices()->candidates(
            (string) V::id($b, 'patient_id', 'paz', true),
            V::date($b, 'da'),
            V::date($b, 'a'),
            V::id($b, 'episode_id', 'epi'),
            V::id($b, 'fattura_id', 'fat'),
        );
        return ['righe' => $rows, 'da_fatturare' => count(array_filter($rows, static fn ($r) => !$r['gia_fatturata']))];
    }

    public function elenco(Context $c): array
    {
        $b = $c->body();
        return ['fatture' => $c->svc->invoices()->list(V::date($b, 'da'), V::date($b, 'a'), V::id($b, 'patient_id', 'paz'), V::str($b, 'stato', false, 20))];
    }

    public function dettaglio(Context $c): array
    {
        return $c->svc->invoices()->get((string) V::id($c->body(), 'id', 'fat', true));
    }

    public function bozzaSalva(Context $c): array
    {
        $b = $c->body();
        $r = $c->svc->invoices()->saveDraft($b, V::id($b, 'id', 'fat'), V::int($b, 'revision'));
        $c->svc->audit()->log('fattura.bozza', 'invoices', $r['id'], null, ['totale_cents' => $r['totale_cents']]);
        return $r;
    }

    public function bozzaElimina(Context $c): array
    {
        $id = (string) V::id($c->body(), 'id', 'fat', true);
        $c->svc->invoices()->deleteDraft($id);
        $c->svc->audit()->log('fattura.bozza_eliminata', 'invoices', $id);
        return ['id' => $id];
    }

    public function emetti(Context $c): array
    {
        $r = $c->svc->invoices()->issue((string) V::id($c->body(), 'id', 'fat', true));
        $c->svc->audit()->log('fattura.emessa', 'invoices', $r['id'], null, ['numero' => $r['numero_testo'], 'totale_cents' => $r['totale_cents']]);
        return $r;
    }

    public function paga(Context $c): array
    {
        $b = $c->body();
        $r = $c->svc->invoices()->pay((string) V::id($b, 'id', 'fat', true), (string) V::str($b, 'metodo', true, 20), (string) V::date($b, 'data', true));
        $c->svc->audit()->log('fattura.pagata', 'invoices', $r['id'], null, ['metodo' => $r['pagamento']['metodo']]);
        return $r;
    }

    public function notaCredito(Context $c): array
    {
        $b = $c->body();
        $r = $c->svc->invoices()->creditNote((string) V::id($b, 'id', 'fat', true), (string) V::str($b, 'motivo', true, 300));
        $c->svc->audit()->log('fattura.nota_credito', 'invoices', $r['id'], null, ['storna' => $r['storna_id'], 'numero' => $r['numero_testo']]);
        return $r;
    }

    public function opposizioneSts(Context $c): array
    {
        $b = $c->body();
        $r = $c->svc->invoices()->setStsOpposition((string) V::id($b, 'id', 'fat', true), V::bool($b, 'opposizione'));
        $c->svc->audit()->log('fattura.sts_opposizione', 'invoices', $r['id'], null, ['opposizione' => $r['sts_opposizione']]);
        return $r;
    }

    // ------------------------------------------------------------------ esportazioni

    public function scaricaXml(Context $c): Response
    {
        $inv = $c->svc->invoices()->get((string) V::id($c->body(), 'id', 'fat', true));
        $f = $c->svc->files()->read((string) ($inv['xml_file_id'] ?? throw ApiError::notFound('xml_non_presente')));
        return Response::file($f['bytes'], 'application/xml', $inv['xml_nome']);
    }

    public function scaricaPdf(Context $c): Response
    {
        $inv = $c->svc->invoices()->get((string) V::id($c->body(), 'id', 'fat', true));
        if ($inv['stato'] === 'bozza') {
            throw new ApiError('fattura_non_emessa', 409);
        }
        $name = 'cortesia-' . str_replace('/', '-', $inv['numero_testo']) . '.pdf';
        return Response::file($c->svc->billingExports()->courtesyPdf($inv), 'application/pdf', $name, true);
    }

    public function archivioPeriodo(Context $c): Response
    {
        [$from, $to] = $this->period($c);
        $rows = $c->svc->invoices()->list($from, $to, null, null);
        $c->svc->audit()->log('fattura.archivio_scaricato', 'invoices', null, null, ['da' => $from, 'a' => $to, 'n' => count($rows)]);
        return Response::file($c->svc->billingExports()->xmlArchive($rows), 'application/zip', "fatture-$from-$to.zip");
    }

    public function riepilogoCsv(Context $c): Response
    {
        [$from, $to] = $this->period($c);
        return Response::file($c->svc->billingExports()->summaryCsv($c->svc->invoices()->list($from, $to, null, null)), 'text/csv', "riepilogo-fatture-$from-$to.csv");
    }

    public function stsCsv(Context $c): Response
    {
        [$from, $to] = $this->period($c);
        $c->svc->audit()->log('fattura.sts_export', 'invoices', null, null, ['da' => $from, 'a' => $to]);
        return Response::file($c->svc->billingExports()->stsCsv($c->svc->invoices()->list($from, $to, null, null)), 'text/csv', "sts-$from-$to.csv");
    }

    /** @return array{0:string,1:string} */
    private function period(Context $c): array
    {
        $b = $c->body();
        return [(string) V::date($b, 'da', true), (string) V::date($b, 'a', true)];
    }

    // ------------------------------------------------------------------ compensi e statistiche

    public function compensoCalcola(Context $c): array
    {
        $c->need('compensi.vedi_tutti');
        $b = $c->body();
        $over = [];
        foreach (V::arr($b, 'eccezioni') as $apptId => $pct) {
            if (is_string($apptId) && is_numeric($pct) && $pct >= 0 && $pct <= 100) {
                $over[$apptId] = (float) $pct;
            }
        }
        $r = $c->svc->compensations()->calculate((string) V::id($b, 'professional_id', 'pro', true), (string) V::date($b, 'da', true), (string) V::date($b, 'a', true), $over);
        $c->svc->audit()->log('compenso.calcolato', 'compensations', $r['id'], null, ['quota_cents' => $r['quota_professionista_cents']]);
        return $r;
    }

    public function compensoStato(Context $c): array
    {
        $c->need('compensi.vedi_tutti');
        $b = $c->body();
        $r = $c->svc->compensations()->advance((string) V::id($b, 'id', 'com', true), (string) V::str($b, 'stato', true, 12));
        $c->svc->audit()->log('compenso.' . $r['stato'], 'compensations', $r['id']);
        return $r;
    }

    public function compensiElenco(Context $c): array
    {
        $b = $c->body();
        $pro = $this->ownOr($c, V::id($b, 'professional_id', 'pro'), 'compensi.vedi_tutti', 'compensi.vedi_propri');
        return ['compensi' => $c->svc->compensations()->list($pro, V::date($b, 'da'), V::date($b, 'a'))];
    }

    public function compensoDettaglio(Context $c): array
    {
        $r = $c->svc->compensations()->get((string) V::id($c->body(), 'id', 'com', true));
        $this->ownOr($c, $r['professional_id'], 'compensi.vedi_tutti', 'compensi.vedi_propri');
        return $r;
    }

    public function compensoProspetto(Context $c): Response
    {
        $r = $c->svc->compensations()->get((string) V::id($c->body(), 'id', 'com', true));
        $this->ownOr($c, $r['professional_id'], 'compensi.vedi_tutti', 'compensi.vedi_propri');
        return Response::file($c->svc->billingExports()->compensationCsv($r), 'text/csv', 'prospetto-compensi-' . $r['da'] . '-' . $r['a'] . '.csv');
    }

    public function statistiche(Context $c): array
    {
        $b = $c->body();
        $pro = $this->ownOr($c, V::id($b, 'professional_id', 'pro'), 'statistiche.economiche', 'statistiche.economiche_proprie');
        return $c->svc->billingStats()->compare((string) V::date($b, 'da', true), (string) V::date($b, 'a', true), $pro);
    }

    /**
     * Chi ha il permesso "tutti" vede ciò che chiede; chi ha solo il permesso "propri" vede soltanto il proprio professionista.
     */
    private function ownOr(Context $c, ?string $requested, string $all, string $own): ?string
    {
        if ($c->can($all)) {
            return $requested;
        }
        $c->need($own);
        $mine = $c->user['professional_id'] ?? null;
        if (!$mine || ($requested !== null && $requested !== $mine)) {
            throw ApiError::forbidden();
        }
        return $mine;
    }
}
