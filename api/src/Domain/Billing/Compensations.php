<?php
declare(strict_types=1);

namespace App\Domain\Billing;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Agenda\Appointments;
use App\Store\Store;

/**
 * Compensi dei professionisti per periodo. Percentuale: eccezione sulla singola prestazione, poi quella per tipo di
 * terapia del professionista, poi quella generale del professionista. Base: importo della riga di fattura emessa
 * (con sconti), altrimenti la tariffa. Stati: calcolato → approvato → liquidato; le prestazioni già in un compenso
 * approvato o liquidato non rientrano in un altro.
 */
final class Compensations
{
    public function __construct(private readonly Store $store, private readonly Appointments $appointments)
    {
    }

    /**
     * @param array<string,float> $overrides appointment_id => percentuale
     * @return array<string,mixed>
     */
    public function calculate(string $professionalId, string $from, string $to, array $overrides = []): array
    {
        return $this->store->transaction(function () use ($professionalId, $from, $to, $overrides) {
            $pro = $this->store->get('professionals', $professionalId) ?? throw new ApiError('professionista_non_trovato', 422);
            $existing = $this->find($professionalId, $from, $to);
            if ($existing && $existing['stato'] !== 'calcolato') {
                throw new ApiError('compenso_non_ricalcolabile', 409, ['stato' => $existing['stato']]);
            }
            $locked = $this->lockedAppointments($existing['id'] ?? null);
            $billed = [];
            foreach ($this->store->all('invoices') as $i) {
                if ($i['tipo'] === 'fattura' && !in_array($i['stato'], ['bozza', 'annullata'], true)) {
                    foreach ($i['righe'] as $r) {
                        if (!empty($r['appointment_id'])) {
                            $billed[$r['appointment_id'] . '|' . $i['patient_id']] = (int) $r['importo_cents'];
                        }
                    }
                }
            }
            $tariff = [];
            foreach ($this->store->all('therapy_types') as $t) {
                $tariff[$t['id']] = $t;
            }
            $rows = [];
            foreach ($this->appointments->between($from, Clock::addDays($to, 1)) as $a) {
                if (($a['professional_id'] ?? null) !== $professionalId || in_array($a['tipo'] ?? '', ['nota'], true)) {
                    continue;
                }
                foreach (Appointments::refs($a) as $ref) {
                    $key = $a['id'] . '|' . $ref['patient_id'];
                    if ($ref['stato'] !== 'eseguito' || isset($locked[$key])) {
                        continue;
                    }
                    $t = $tariff[$a['therapy_type_id'] ?? ''] ?? null;
                    $isBilled = isset($billed[$key]);
                    $base = $isBilled ? $billed[$key] : Money::cents($t['tariffa'] ?? 0);
                    $cost = min($base, max(0,(int)($a['compenso_materiali_cents']??0)));
                    $pct = $overrides[$a['id']] ?? $a['compenso_percentuale'] ?? (float) ($pro['percentuali_tipo'][$a['therapy_type_id'] ?? ''] ?? $pro['percentuale_compenso'] ?? 0);
                    $quota = (int) round(($base - $cost) * $pct / 100);
                    $rows[] = [
                        'appointment_id' => $a['id'], 'patient_id' => $ref['patient_id'], 'data' => substr($a['start'], 0, 10), 'therapy_type_id' => $a['therapy_type_id'] ?? null,
                        'descrizione' => $t['nome'] ?? 'Prestazione', 'base_cents' => $base, 'fatturata' => $isBilled, 'percentuale' => $pct,
                        'eccezione' => isset($overrides[$a['id']]), 'quota_professionista_cents' => $quota, 'quota_struttura_cents' => $base - $cost - $quota, 'materiali_cents'=>$cost, 'nota_materiali'=>$a['compenso_nota']??null,
                    ];
                }
            }
            usort($rows, static fn ($x, $y) => strcmp($x['data'], $y['data']) ?: strcmp($x['appointment_id'], $y['appointment_id']));
            $rec = ($existing ?? []) + ['stato' => 'calcolato'];
            $rec += ['professional_id' => $professionalId, 'da' => $from, 'a' => $to];
            $rec['righe'] = $rows;
            $rec['totale_base_cents'] = array_sum(array_column($rows, 'base_cents'));
            $rec['quota_professionista_cents'] = array_sum(array_column($rows, 'quota_professionista_cents'));
            $rec['quota_struttura_cents'] = array_sum(array_column($rows, 'quota_struttura_cents'));
            $rec['senza_fattura'] = count(array_filter($rows, static fn ($r) => !$r['fatturata']));
            $rec['calcolato_il'] = Clock::stamp();
            return $this->store->put('compensations', $rec);
        });
    }

    public function advance(string $id, string $to): array
    {
        $order = ['calcolato' => 0, 'approvato' => 1, 'liquidato' => 2];
        if (!isset($order[$to]) || $to === 'calcolato') {
            throw new ApiError('stato_non_valido', 422);
        }
        return $this->store->transaction(function () use ($id, $to, $order) {
            $c = $this->store->get('compensations', $id) ?? throw ApiError::notFound('compenso_non_trovato');
            if ($order[$to] !== $order[$c['stato']] + 1) {
                throw new ApiError('passaggio_di_stato_non_consentito', 409, ['da' => $c['stato'], 'a' => $to]);
            }
            if ($to === 'liquidato' && empty($c['ricevuta'])) throw new ApiError('ricevuta_richiesta',422);
            $c['stato'] = $to;
            if ($to === 'liquidato') $this->store->put('expenses',['descrizione'=>'Compenso professionista '.$c['da'].' / '.$c['a'],'date'=>Clock::today(),'scadenza'=>null,'categoria'=>'compensi','importo_cents'=>$c['quota_professionista_cents'],'pagata'=>true,'data_pagamento'=>Clock::today(),'ricorrenza'=>'nessuna','fine_ricorrenza'=>null,'fornitore_id'=>null,'nota'=>null,'compenso_id'=>$c['id']]);
            $c[$to . '_il'] = Clock::stamp();
            $c[$to . '_da'] = $this->store->actor();
            return $this->store->put('compensations', $c);
        });
    }

    /** @return list<array<string,mixed>> */
    public function list(?string $professionalId, ?string $from, ?string $to): array
    {
        $rows = $this->store->all('compensations', static fn ($c) => (!$professionalId || $c['professional_id'] === $professionalId)
            && (!$from || $c['a'] >= $from) && (!$to || $c['da'] <= $to));
        usort($rows, static fn ($a, $b) => strcmp($b['da'], $a['da']));
        return $rows;
    }

    public function get(string $id): array
    {
        return $this->store->get('compensations', $id) ?? throw ApiError::notFound('compenso_non_trovato');
    }

    /** @return array<string,mixed>|null */
    private function find(string $professionalId, string $from, string $to): ?array
    {
        foreach ($this->store->all('compensations') as $c) {
            if ($c['professional_id'] === $professionalId && $c['da'] === $from && $c['a'] === $to) {
                return $c;
            }
        }
        return null;
    }

    /** @return array<string,true> prestazioni già comprese in compensi approvati o liquidati */
    private function lockedAppointments(?string $exceptId): array
    {
        $out = [];
        foreach ($this->store->all('compensations') as $c) {
            if ($c['stato'] === 'calcolato' || $c['id'] === $exceptId) {
                continue;
            }
            foreach ($c['righe'] as $r) {
                $out[$r['appointment_id'] . '|' . $r['patient_id']] = true;
            }
        }
        return $out;
    }
}
