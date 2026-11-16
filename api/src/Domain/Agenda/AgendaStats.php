<?php
declare(strict_types=1);

namespace App\Domain\Agenda;

use App\Core\Clock;
use App\Domain\Calendar\Hours;
use App\Store\Store;

/** Statistiche di agenda su un periodo: saturazione, assenze, mix di terapie, uso delle risorse. */
final class AgendaStats
{
    public function __construct(
        private readonly Store $store,
        private readonly Appointments $appointments,
        private readonly Hours $hours,
    ) {
    }

    /** @return array<string,mixed> */
    public function period(string $from, string $toInclusive): array
    {
        $to = Clock::addDays($toInclusive, 1);
        $rows = $this->appointments->between($from, $to, true);
        $byPro = [];
        $byType = [];
        $byRes = [];
        $tot = ['programmati' => 0, 'eseguiti' => 0, 'assenti' => 0, 'annullati' => 0, 'minuti_occupati' => 0];

        foreach ($rows as $a) {
            if (($a['tipo'] ?? '') === 'nota') {
                continue;
            }
            $min = Clock::diffMinutes($a['start'], $a['end']);
            $pid = $a['professional_id'] ?? '-';
            $byPro[$pid] ??= ['programmati' => 0, 'eseguiti' => 0, 'assenti' => 0, 'annullati' => 0, 'minuti_occupati' => 0];
            $n = max(1, count(Appointments::refs($a)));
            $stato = $a['stato'];
            if ($stato === 'annullato') {
                $byPro[$pid]['annullati']++;
                $tot['annullati']++;
                continue;
            }
            $absent = 0;
            foreach (Appointments::refs($a) as $r) {
                if ($r['stato'] === 'assente') {
                    $absent++;
                }
            }
            if ($stato === 'assente' || ($absent > 0 && $absent === count(Appointments::refs($a)))) {
                $byPro[$pid]['assenti']++;
                $tot['assenti']++;
                continue;   // lo slot è libero: non conta come occupato
            }
            $byPro[$pid]['programmati']++;
            $tot['programmati']++;
            if ($stato === 'eseguito') {
                $byPro[$pid]['eseguiti']++;
                $tot['eseguiti']++;
            }
            $byPro[$pid]['minuti_occupati'] += $min;
            $tot['minuti_occupati'] += $min;
            if (!empty($a['therapy_type_id'])) {
                $byType[$a['therapy_type_id']] = ($byType[$a['therapy_type_id']] ?? 0) + $n;
            }
            if (!empty($a['resource_id'])) {
                $byRes[$a['resource_id']] = ($byRes[$a['resource_id']] ?? 0) + $min;
            }
        }

        $out = [];
        $availTotal = 0;
        foreach ($this->store->all('professionals') as $p) {
            if (($p['attivo'] ?? true) === false || !in_array($p['tipo'] ?? '', ['fisioterapista', 'medico', 'terapista'], true)) {
                continue;
            }
            $avail = $this->availableMinutes($p, $from, $toInclusive);
            $availTotal += $avail;
            $work=Workload::summarize($rows,$p['id']);
            $s = $byPro[$p['id']] ?? ['programmati' => 0, 'eseguiti' => 0, 'assenti' => 0, 'annullati' => 0, 'minuti_occupati' => 0];
            $s['minuti_occupati']=$work['minuti_programmati'];
            $registered=0;foreach($this->store->all('staff_attendance') as $attendance)if($attendance['professional_id']===$p['id']&&$attendance['date']>=$from&&$attendance['date']<=$toInclusive)$registered+=(int)$attendance['minuti'];
            $out[] = ['minuti_presenze_registrate'=>$registered,'professional_id' => $p['id'], 'nome' => trim(($p['nome'] ?? '') . ' ' . ($p['cognome'] ?? '')),
                'minuti_disponibili' => $avail, 'saturazione' => $avail > 0 ? round($work['minuti_programmati'] / $avail * 100, 1) : null] + $work + $s;
        }
        $tipi = [];
        foreach ($byType as $id => $n) {
            $t = $this->store->get('therapy_types', $id, false);
            $tipi[] = ['therapy_type_id' => $id, 'nome' => $t['nome'] ?? $id, 'sedute' => $n];
        }
        usort($tipi, static fn ($a, $b) => $b['sedute'] <=> $a['sedute']);
        $res = [];
        foreach ($byRes as $id => $m) {
            $r = $this->store->get('resources', $id, false);
            $res[] = ['resource_id' => $id, 'nome' => $r['nome'] ?? $id, 'minuti' => $m];
        }
        usort($res, static fn ($a, $b) => $b['minuti'] <=> $a['minuti']);

        $tot['minuti_occupati']=array_sum(array_column($out,'minuti_programmati'));
        $chiamate = $tot['programmati'] + $tot['assenti'];
        return [
            'dal' => $from, 'al' => $toInclusive,
            'totali' => $tot + ['minuti_disponibili' => $availTotal, 'saturazione' => $availTotal > 0 ? round($tot['minuti_occupati'] / $availTotal * 100, 1) : null,
                'tasso_assenze' => $chiamate > 0 ? round($tot['assenti'] / $chiamate * 100, 1) : 0.0],
            'professionisti' => $out, 'terapie' => $tipi, 'risorse' => $res,
            'presenze_per_famiglia'=>CareStats::summarize($this->store,$rows)['famiglie'],
            'esiti_per_paziente'=>CareStats::summarize($this->store,$rows)['pazienti'],
        ];
    }

    private function availableMinutes(array $pro, string $from, string $to): int
    {
        $sum = 0;
        for ($d = $from; $d <= $to; $d = Clock::addDays($d, 1)) {
            if ($this->hours->closedReason($d) !== null) {
                continue;
            }
            foreach ($this->hours->professionalWindows($pro, $d) as [$a, $b]) {
                $sum += $b - $a;
            }
        }
        return $sum;
    }
}
