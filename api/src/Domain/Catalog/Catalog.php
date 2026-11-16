<?php
declare(strict_types=1);

namespace App\Domain\Catalog;

use App\Core\ApiError;
use App\Store\Store;
use App\Support\Validator as V;

/** Professionisti, tipi di terapia e risorse: validazione e salvataggio. */
final class Catalog
{
    public const CATEGORIES = ['strumentale', 'manuale', 'palestra_gruppo', 'piscina_gruppo', 'visita', 'altro'];
    public const RESOURCE_KINDS = ['apparecchio', 'sala', 'piscina', 'palestra'];

    public function __construct(private readonly Store $store)
    {
    }

    // ------------------------------------------------------------ professionisti

    public function saveProfessional(array $d): array
    {
        $rec = [
            'tipo' => V::enum($d, 'tipo', ['medico', 'fisioterapista','segreteria','amministrazione','collaboratore'], true), 'email' => V::email($d,'email'), 'telefono' => V::phone($d,'telefono'),
            'nome' => V::str($d, 'nome', true, 80), 'cognome' => V::str($d, 'cognome', false, 80) ?? '',
            'specialita' => array_values(array_filter(array_map(static fn ($s) => trim((string) $s), V::arr($d, 'specialita')))),
            'colore' => $this->color($d['colore'] ?? null),
            'orari' => $this->weekly($d['orari'] ?? null),
            'eccezioni' => $this->exceptions(V::arr($d, 'eccezioni')),
            'ore_contrattuali_settimana' => V::num($d, 'ore_contrattuali_settimana', false, 0, 60) ?? 0.0,
            'percentuale_compenso' => V::num($d, 'percentuale_compenso', false, 0, 100) ?? 0.0,
            'percentuali_tipo' => $this->percentages($d['percentuali_tipo'] ?? null),
            'preferenze_assegnazione' => CatalogRules::preferences($d['preferenze_assegnazione']??[]),
            'prenotabile_online' => V::bool($d, 'prenotabile_online'),
            'titolare' => V::bool($d, 'titolare'),
            'attivo' => V::bool($d, 'attivo', true),
        ];
        if ($rec['tipo'] === 'medico' && $rec['specialita'] === []) {
            throw new ApiError('specialita_mancante', 422, ['campo' => 'specialita']);
        }
        return $this->upsert('professionals', V::id($d, 'id', 'pro'), $rec, V::int($d, 'revision'));
    }

    // ------------------------------------------------------------ tipi di terapia

    public function saveTherapyType(array $d): array
    {
        $cat = V::enum($d, 'categoria', self::CATEGORIES, true);
        $group = V::bool($d, 'di_gruppo', in_array($cat, ['palestra_gruppo', 'piscina_gruppo'], true));
        $rec = [
            'nome' => V::str($d, 'nome', true, 80), 'categoria' => $cat, 'famiglia' => V::enum($d,'famiglia',['TS','TSF','palestra','piscina','visite','altro'],false,'altro'),
            'durata_min' => V::int($d, 'durata_min', true, 5, 480),
            'di_gruppo' => $group, 'impegna_operatore'=>V::bool($d,'impegna_operatore',true),
            'durata_operatore_minuti'=>V::int($d,'durata_operatore_minuti',false,0,480)??0,
            'risorse_aggiuntive'=>CatalogRules::resources($this->store,V::arr($d,'risorse_aggiuntive')), 
            'capienza' => $group ? (V::int($d, 'capienza', false, 2, 6) ?? 5) : 1,
            'risorsa_id' => V::id($d, 'risorsa_id', 'ris'),
            'tariffa' => round(V::num($d, 'tariffa', false, 0, 100000) ?? 0.0, 2),
            'sanitaria' => V::bool($d,'sanitaria',true),
            'codice_sts' => V::str($d, 'codice_sts', false, 6),
            'natura_iva' => V::enum($d, 'natura_iva', ['N4', 'N2.2', 'N1', 'ordinaria'], false, 'N4'),
            'aliquota_iva' => V::num($d, 'aliquota_iva', false, 0, 30) ?? 0.0,
            'followup_giorni' => V::int($d, 'followup_giorni', false, 1, 365) ?? 15,
            'prenotabile_online' => V::bool($d, 'prenotabile_online') && $cat === 'visita',
            'consumi_standard' => $this->consumption(V::arr($d, 'consumi_standard')),
            'attivo' => V::bool($d, 'attivo', true),
        ];
        if(!$rec['impegna_operatore']&&$rec['risorsa_id']===null)throw new ApiError('risorsa_obbligatoria_terapia_fissa',422);
        if($rec['durata_operatore_minuti']>$rec['durata_min'])throw new ApiError('durata_operatore_non_valida',422);
        if($group&&!$rec['impegna_operatore'])throw new ApiError('operatore_obbligatorio_gruppo',422);
        if ($rec['risorsa_id'] !== null && $this->store->get('resources', $rec['risorsa_id']) === null) {
            throw new ApiError('risorsa_non_trovata', 422, ['campo' => 'risorsa_id']);
        }
        if ($rec['natura_iva'] === 'ordinaria' && $rec['aliquota_iva'] <= 0) {
            throw new ApiError('aliquota_mancante', 422, ['campo' => 'aliquota_iva']);
        }
        return $this->upsert('therapy_types', V::id($d, 'id', 'ter'), $rec, V::int($d, 'revision'));
    }

    // ------------------------------------------------------------ risorse

    public function saveResource(array $d): array
    {
        $rec = [
            'nome' => V::str($d, 'nome', true, 80), 'tipo' => V::enum($d, 'tipo', self::RESOURCE_KINDS, true),
            'capienza' => V::int($d, 'capienza', false, 1, 50) ?? 1,
            'orari' => $this->weekly($d['orari'] ?? null), 'fermi' => $this->exceptions(V::arr($d, 'fermi')),
            'attivo' => V::bool($d, 'attivo', true),
        ];
        return $this->upsert('resources', V::id($d, 'id', 'ris'), $rec, V::int($d, 'revision'));
    }

    // ------------------------------------------------------------ interni

    private function upsert(string $col, ?string $id, array $rec, ?int $revision): array
    {
        return $this->store->transaction(function () use ($col, $id, $rec, $revision) {
            if ($id === null) {
                return $this->store->put($col, $rec);
            }
            $cur = $this->store->get($col, $id) ?? throw ApiError::notFound();
            return $this->store->put($col, array_replace($cur, $rec), $revision);
        });
    }

    private function color(mixed $c): ?string
    {
        if ($c === null || $c === '') {
            return null;
        }
        if (!is_string($c) || !preg_match('/^#[0-9a-fA-F]{6}$/', $c)) {
            throw new ApiError('colore_non_valido', 422, ['campo' => 'colore']);
        }
        return strtoupper($c);
    }

    /** Orari settimanali: null = quelli della struttura; altrimenti {"1":[["08:00","13:00"]],…}. */
    private function weekly(mixed $w): ?array
    {
        if ($w === null) {
            return null;
        }
        if (!is_array($w)) {
            throw new ApiError('orari_non_validi', 422);
        }
        $out = [];
        foreach ($w as $dow => $slots) {
            if (!in_array((string) $dow, ['1', '2', '3', '4', '5', '6', '7'], true) || !is_array($slots)) {
                throw new ApiError('orari_non_validi', 422);
            }
            $clean = [];
            foreach ($slots as $s) {
                if (!is_array($s) || count($s) !== 2 || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $s[0]) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) $s[1]) || $s[0] >= $s[1]) {
                    throw new ApiError('orari_non_validi', 422);
                }
                $clean[] = [$s[0], $s[1]];
            }
            usort($clean, static fn ($a, $b) => strcmp($a[0], $b[0]));
            for ($i = 1; $i < count($clean); $i++) {
                if ($clean[$i][0] < $clean[$i - 1][1]) {
                    throw new ApiError('orari_sovrapposti', 422);
                }
            }
            $out[(string) $dow] = $clean;
        }
        return $out;
    }

    private function exceptions(array $list): array
    {
        $out = [];
        foreach ($list as $e) {
            $x = ['da' => V::date((array) $e, 'da', true), 'a' => V::date((array) $e, 'a') ?? V::date((array) $e, 'da', true),
                'tipo' => V::enum((array) $e, 'tipo', ['ferie', 'assenza', 'malattia', 'permesso', 'fermo_macchina', 'altro','straordinario'], false, 'assenza'), 'motivo' => V::str((array) $e, 'motivo', false, 120)];
            if ($x['a'] < $x['da']) {
                throw new ApiError('intervallo_non_valido', 422);
            }
            if($x['tipo']==='straordinario'){$x['dalle']=V::time($e,'dalle',true);$x['alle']=V::time($e,'alle',true);if($x['dalle']>=$x['alle'])throw new ApiError('fascia_non_valida',422);}
            $out[] = $x;
        }
        return $out;
    }

    private function consumption(array $list): array
    {
        $out = [];
        foreach ($list as $c) {
            $c = (array) $c;
            $out[] = ['articolo_id' => V::id($c, 'articolo_id', 'art', true), 'quantita' => V::num($c, 'quantita', true, 0.001, 10000)];
        }
        return $out;
    }

    /** Percentuali di compenso per tipo di prestazione: id terapia => 0..100. */
    private function percentages(mixed $raw): array
    {
        $out = [];
        foreach (is_array($raw) ? $raw : [] as $id => $v) {
            if (!is_string($id) || !str_starts_with($id, 'ter_') || !is_numeric($v) || $v < 0 || $v > 100) {
                throw new ApiError('percentuale_non_valida', 422, ['campo' => 'percentuali_tipo']);
            }
            $out[$id] = round((float) $v, 2);
        }
        return $out;
    }
}
