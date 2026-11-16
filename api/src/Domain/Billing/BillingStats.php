<?php
declare(strict_types=1);

namespace App\Domain\Billing;

use App\Core\ApiError;
use App\Core\Clock;
use App\Domain\Agenda\Appointments;
use App\Store\Store;

/** Statistiche economiche con confronto col periodo precedente di pari durata. */
final class BillingStats
{
    public function __construct(private readonly Store $store, private readonly Appointments $appointments)
    {
    }

    /** @return array<string,mixed> */
    public function compare(string $from, string $to, ?string $onlyProfessional = null): array
    {
        if ($to < $from) {
            throw new ApiError('periodo_non_valido', 422);
        }
        $days = (int) ((strtotime($to) - strtotime($from)) / 86400) + 1;
        $prevTo = Clock::addDays($from, -1);
        $prevFrom = Clock::addDays($prevTo, -($days - 1));
        return ['periodo' => $this->period($from, $to, $onlyProfessional), 'precedente' => $this->period($prevFrom, $prevTo, $onlyProfessional)];
    }

    /** @return array<string,mixed> */
    public function period(string $from, string $to, ?string $onlyProfessional = null): array
    {
        $pros = [];
        foreach ($this->store->all('professionals') as $p) {
            $pros[$p['id']] = trim($p['nome'] . ' ' . $p['cognome']);
        }
        $types = [];
        foreach ($this->store->all('therapy_types') as $t) {
            $types[$t['id']] = $t['nome'];
        }
        $apptPro = [];
        $apptType = [];
        $fatturato = 0;
        $incassato = 0;
        $perMedico = [];
        $perTerapia = [];
        foreach ($this->store->all('invoices', null, $this->store->partsBetween('invoices', Clock::addDays($from, -366), $to)) as $i) {
            if ($i['stato'] === 'bozza') {
                continue;
            }
            $sign = $i['tipo'] === 'nota_credito' ? -1 : 1;
            $inPeriod = $i['date'] >= $from && $i['date'] <= $to;
            if ($inPeriod) {
                foreach ($i['righe'] as $r) {
                    $proId = '_non_attribuito';
                    $typeId = $r['therapy_type_id'] ?? '_libera';
                    if (!empty($r['appointment_id'])) {
                        $a = $apptPro[$r['appointment_id']] ??= ($this->store->get('appointments', $r['appointment_id']) ?? []);
                        $proId = $a['professional_id'] ?? '_non_attribuito';
                        $typeId = $a['therapy_type_id'] ?? $typeId;
                    }
                    if ($onlyProfessional && $proId !== $onlyProfessional) {
                        continue;
                    }
                    $amount = $sign * (int) $r['importo_cents'];
                    $fatturato += $amount;
                    $perMedico[$proId] = ($perMedico[$proId] ?? 0) + $amount;
                    $perTerapia[$typeId] = ($perTerapia[$typeId] ?? 0) + $amount;
                }
            }
            if (!$onlyProfessional && $i['tipo'] === 'fattura' && ($i['pagamento']['data'] ?? '') >= $from && ($i['pagamento']['data'] ?? '') <= $to && $i['stato'] === 'pagata') {
                $incassato += (int) $i['totale_cents'];
            }
        }
        $count = [];
        $total = 0;
        foreach ($this->appointments->between($from, Clock::addDays($to, 1)) as $a) {
            if (($a['tipo'] ?? '') === 'nota' || ($onlyProfessional && ($a['professional_id'] ?? null) !== $onlyProfessional)) {
                continue;
            }
            foreach (Appointments::refs($a) as $ref) {
                if ($ref['stato'] === 'eseguito') {
                    $name = $types[$a['therapy_type_id'] ?? ''] ?? 'Altro';
                    $count[$name] = ($count[$name] ?? 0) + 1;
                    $total++;
                }
            }
        }
        $newPatients = 0;
        foreach ($this->store->all('patients') as $p) {
            $d = substr((string) $p['created_at'], 0, 10);
            $newPatients += $d >= $from && $d <= $to ? 1 : 0;
        }
        return [
            'da' => $from, 'a' => $to,
            'fatturato_cents' => $fatturato, 'incassato_cents' => $incassato,
            'incassato_su_fatturato' => $fatturato > 0 ? round($incassato / $fatturato * 100, 1) : null,
            'per_medico' => $this->named($perMedico, $pros),
            'per_terapia' => $this->named($perTerapia, $types),
            'prestazioni' => $total, 'prestazioni_per_tipo' => $count,
            'nuovi_pazienti' => $newPatients, 'ritorni' => $this->returns($from, $to),
        ];
    }

    /** Pazienti che aprono un nuovo percorso nel periodo avendone chiuso o avuto uno nei 12 mesi precedenti. */
    private function returns(string $from, string $to): int
    {
        $byPatient = [];
        foreach ($this->store->all('episodes') as $e) {
            $byPatient[$e['patient_id']][] = $e['data_inizio'];
        }
        $n = 0;
        foreach ($byPatient as $dates) {
            sort($dates);
            foreach ($dates as $k => $d) {
                if ($d < $from || $d > $to || $k === 0) {
                    continue;
                }
                if ($dates[$k - 1] >= Clock::addDays($d, -365)) {
                    $n++;
                    break;
                }
            }
        }
        return $n;
    }

    /** @return list<array{id:string,nome:string,cents:int}> */
    private function named(array $sums, array $names): array
    {
        $out = [];
        foreach ($sums as $id => $c) {
            $out[] = ['id' => $id, 'nome' => $names[$id] ?? ($id === '_libera' ? 'Acconti e voci libere' : 'Non attribuito'), 'cents' => $c];
        }
        usort($out, static fn ($a, $b) => $b['cents'] <=> $a['cents']);
        return $out;
    }
}
