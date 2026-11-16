<?php
declare(strict_types=1);
namespace App\Domain\Planning;
use App\Core\{ApiError,Clock};
use App\Domain\Calendar\Hours;
use App\Domain\Agenda\Appointments;
/** Parte del motore di proposta: responsabilità separata, nessuna scrittura autonoma. */
trait PlanningCandidates
{
    private function candidates(array $d, string $from, string $to, bool $freeOnly, array $ignore = [], array $extraBlock = []): array
    {
        $dur = (int) $d['type']['durata_min'];
        $res = $d['type']['risorsa_id'] ?? null;
        $pref = $d['line']['professional_preferito_id'] ?? null;
        $list = [];
        $slotsAll = $this->episodes[$d['episode_id']]['availability'] ?? [];
        if ($slotsAll === []) $slotsAll = $this->store->get('patients',$d['patient_id'])['disponibilita'] ?? [];
        $today = substr($this->now, 0, 10);
        for ($date = max($from, $today); $date <= $to; $date = Clock::addDays($date, 1)) {
            if ($this->hours->closedReason($date) !== null) {
                continue;
            }
            $dow = Clock::dow($date);
            $valid = array_values(array_filter($slotsAll, static fn ($x) => (empty($x['valida_dal']) || $date >= $x['valida_dal']) && (empty($x['valida_al']) || $date <= $x['valida_al'])));
            $pw = [];
            if ($slotsAll === []) {
                foreach ($this->hours->structureWindows($date) as [$a, $b]) {
                    $pw[] = [$a, $b, 1];
                }
            } else {
                foreach ($valid as $x) {
                    if ((int) $x['giorno'] === $dow) {
                        $pw[] = [Clock::minutes($x['da']), Clock::minutes($x['a']), ['alta' => 0, 'media' => 1, 'bassa' => 2][$x['preferenza'] ?? 'media'] ?? 1];
                    }
                }
            }
            if ($pw === []) {
                continue;
            }
            $order = $pref !== null && isset($this->pros[$pref]) ? [$pref] : [];
            foreach ($this->pros as $id => $p) {
                if (($p['tipo'] === 'fisioterapista'||!empty($p['titolare'])) && $id !== $pref) {
                    $order[] = $id;
                }
            }
            if(!empty($d['line']['vincolo_professionista']))$order=$pref&&isset($this->pros[$pref])?[$pref]:[];
            $dayOffset = Clock::diffMinutes($from . 'T00:00:00', $date . 'T00:00:00') / 1440;
            foreach ($order as $proId) {
                $pro = $this->pros[$proId];
                $windows = $this->hours->professionalWindows($pro, $date);
                foreach ($pw as [$pa, $pb, $prefLevel]) {
                    foreach (Hours::intersect($windows, [[$pa, $pb]]) as [$wa, $wb]) {
                        $first = (int) (ceil($wa / self::STEP) * self::STEP);
                        for ($s = $first; $s + $dur <= $wb; $s += self::STEP) {
                            if ($date === $today && sprintf('%sT%02d:%02d:00', $date, intdiv($s, 60), $s % 60) <= $this->now) {
                                continue;
                            }
                            $score = $prefLevel * 100 + $dayOffset * ((int)($d['line']['intervallo_min_giorni']??0)>0?1000:10) + ($proId === $pref || $pref === null ? 0 : 200) + $s / 1440;
                            $score-=PlanningRules::preference($pro,$d['type']['categoria'],$s,$s+$dur);
                            $c = ['date' => $date, 's' => $s, 'e' => $s + $dur, 'pro' => $proId, 'res' => $res, 'score' => $score, 'pref' => $prefLevel, 'preferred_pro' => $proId === $pref];
                            $c['op_end']=PlanningRules::operatorEnd($d['type'],$s,$s+$dur);
                            $c['resources']=array_values(array_filter(array_merge([$res],$d['type']['risorse_aggiuntive']??[])));
                            if ($freeOnly && !$this->isFree($c, $d, $ignore, $extraBlock)) {
                                continue;
                            }
                            $list[] = $c;
                        }
                    }
                }
            }
        }
        usort($list, static fn ($a, $b) => [$a['score'], $a['date'], $a['s'], $a['pro']] <=> [$b['score'], $b['date'], $b['s'], $b['pro']]);
        return $list;
    }


}
