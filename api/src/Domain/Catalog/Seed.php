<?php
declare(strict_types=1);

namespace App\Domain\Catalog;

use App\Store\Store;

/**
 * Configurazione iniziale di produzione: solo tipi di terapia con durate e colori predefiniti.
 * Nessun dato di prova, nessuna tariffa inventata: le tariffe restano a 0 finché il titolare non le imposta.
 * Idempotente: non tocca ciò che esiste già.
 */
final class Seed
{
    /** nome, categoria, durata, gruppo, capienza, followup giorni, risorsa */
    private const TYPES = [
        ['Tecarterapia', 'strumentale', 15, false, 1, 15, 'Tecar'],
        ['Laserterapia', 'strumentale', 15, false, 1, 15, 'Laser'],
        ['Ultrasuoni', 'strumentale', 15, false, 1, 15, 'Ultrasuoni'],
        ['Magnetoterapia', 'strumentale', 15, false, 1, 15, 'Magnetoterapia'],
        ['Elettrostimolazione', 'strumentale', 15, false, 1, 15, 'Elettrostimolatore'],
        ['Onde d’urto', 'strumentale', 15, false, 1, 40, 'Onde d’urto'],
        ['Terapia manuale', 'manuale', 15, false, 1, 15, null],
        ['Massoterapia', 'manuale', 15, false, 1, 15, null],
        ['Linfodrenaggio', 'manuale', 15, false, 1, 15, null],
        ['Rieducazione motoria', 'palestra_gruppo', 60, true, 6, 40, 'Palestra'],
        ['Idrokinesiterapia', 'piscina_gruppo', 60, true, 4, 40, 'Piscina'],
        ['Visita fisiatrica', 'visita', 30, false, 1, 15, null],
        ['Visita ortopedica', 'visita', 30, false, 1, 15, null],
        ['Visita cardiologica', 'visita', 30, false, 1, 365, null],
        ['Visita medico-sportiva', 'visita', 30, false, 1, 365, null],
    ];
    private const RESOURCES = [
        ['Tecar', 'apparecchio', 1], ['Laser', 'apparecchio', 1], ['Ultrasuoni', 'apparecchio', 1], ['Magnetoterapia', 'apparecchio', 1],
        ['Elettrostimolatore', 'apparecchio', 1], ['Onde d’urto', 'apparecchio', 1], ['Palestra', 'palestra', 6], ['Piscina', 'piscina', 4],
    ];

    public function __construct(private readonly Store $store)
    {
    }

    public function run(): array
    {
        return $this->store->transaction(function () {
            $res = [];
            foreach ($this->store->all('resources') as $r) {
                $res[$r['nome']] = $r['id'];
            }
            $added = ['risorse' => 0, 'terapie' => 0];
            foreach (self::RESOURCES as [$nome, $tipo, $cap]) {
                if (!isset($res[$nome])) {
                    $res[$nome] = $this->store->put('resources', ['nome' => $nome, 'tipo' => $tipo, 'capienza' => $cap, 'orari' => null, 'fermi' => [], 'attivo' => true])['id'];
                    $added['risorse']++;
                }
            }
            $have = array_column($this->store->all('therapy_types'), 'nome');
            foreach (self::TYPES as [$nome, $cat, $dur, $group, $cap, $follow, $risorsa]) {
                if (in_array($nome, $have, true)) {
                    continue;
                }
                $this->store->put('therapy_types', [
                    'nome' => $nome, 'categoria' => $cat, 'durata_min' => $dur, 'di_gruppo' => $group, 'capienza' => $cap,
                    'risorsa_id' => $risorsa ? ($res[$risorsa] ?? null) : null, 'tariffa' => 0.0, 'codice_sts' => $cat === 'visita' ? 'SP' : 'SP',
                    'natura_iva' => 'N4', 'aliquota_iva' => 0.0, 'followup_giorni' => $follow, 'prenotabile_online' => $cat === 'visita',
                    'consumi_standard' => [], 'attivo' => true,
                ]);
                $added['terapie']++;
            }
            return $added;
        });
    }
}
