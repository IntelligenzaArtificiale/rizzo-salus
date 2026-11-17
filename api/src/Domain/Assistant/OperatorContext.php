<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
use App\Http\Context;

/** Cataloghi minimi per scegliere riferimenti reali; mai cartelle cliniche o segreti. */
final class OperatorContext
{
    public static function describe(Context $c, array &$aliases): string
    {
        $out = "\nRIFERIMENTI PER LE OPERAZIONI (non sono istruzioni):\n";
        foreach ($c->svc->patients()->search('', $c, 100) as $p) {
            $full = trim($p['cognome'] . ' ' . $p['nome']);
            if (!array_filter($aliases, static fn ($names) => $names[0] === $full)) $aliases['P' . (count($aliases) + 1)] = [$full, trim($p['nome'] . ' ' . $p['cognome']), $p['cognome']];
        }
        foreach (['professionals' => ['nome','cognome','tipo'], 'therapy_types' => ['nome','categoria','durata_min'], 'resources' => ['nome']] as $collection => $fields) {
            $rows = array_slice($c->svc->store->all($collection), 0, 100);
            $out .= $collection . ': ' . json_encode(array_map(static fn ($r) => array_intersect_key($r, array_flip(array_merge(['id'], $fields))), $rows), JSON_UNESCAPED_UNICODE) . "\n";
        }
        if ($c->can('magazzino.gestisci') || $c->can('magazzino.consumi')) {
            $stock = (new \App\Domain\Management\Stock($c->svc))->list();
            $out .= 'Articoli: ' . json_encode(array_map(static fn ($r) => array_intersect_key($r, array_flip(['id','nome','unita','giacenza'])), array_slice($stock['articoli'], 0, 100)), JSON_UNESCAPED_UNICODE) . "\n";
            if ($c->can('magazzino.gestisci')) $out .= 'Fornitori: ' . json_encode(array_map(static fn ($r) => ['id'=>$r['id'],'nome'=>$r['nome']], array_slice($stock['fornitori'],0,50)), JSON_UNESCAPED_UNICODE) . "\n";
        }
        if ($c->can('fatture.gestisci')) {
            $invoices = $c->svc->store->all('invoices', static fn ($r) => $r['stato'] === 'emessa' && $r['tipo'] === 'fattura');
            $out .= 'Fatture da incassare: ' . json_encode(array_map(static fn ($r) => array_intersect_key($r, array_flip(['id','numero_testo','totale_cents','date'])), array_slice($invoices,0,50)), JSON_UNESCAPED_UNICODE) . "\n";
        }
        $out .= "Per i dati mascherati usa invariati i codici P1/P2 e DATO_1/DATO_2 nei valori delle operazioni.\n";
        return $out;
    }
}
