<?php
declare(strict_types=1);
namespace App\Domain\Planning;
use App\Core\{ApiError,Clock};
use App\Domain\Calendar\Hours;
use App\Domain\Agenda\Appointments;
/** Parte del motore di proposta: responsabilità separata, nessuna scrittura autonoma. */
trait PlanningAvailability
{
    private function blockers(array $c, array $d, array $ignore, array $extraBlock): array
    {
        $date = $c['date'];
        if(!empty($d['type']['di_gruppo'])&&!PlanningRules::canJoin($this->store,['refs'=>[]],$d))return ['*'];
        $week = Clock::weekStart($date);
        if (($d['weeks'][$week] ?? 0) >= (int) $d['line']['frequenza_max']) {
            return ['*'];
        }
        $interval=(int)($d['line']['intervallo_min_giorni']??0);
        if($interval>0)foreach($this->busy as $dt=>$entries) {
            if(abs(strtotime($dt)-strtotime($date))/86400 >= $interval)continue;
            foreach($entries as $entry) {
                if(isset($ignore[$entry['id']]))continue;
                foreach($entry['refs']??[] as $ref)if($ref['patient_id']===$d['patient_id'] && $ref['line_id']===$d['line_id'])return ['*'];
            }
        }
        $perDay = 0;
        $adjacent = false;
        foreach ([-1, 0, 1] as $off) {
            foreach ($this->busy[Clock::addDays($date, $off)] ?? [] as $b) {
                if (isset($ignore[$b['id']]) || !in_array($d['patient_id'], $b['pat'], true)) {
                    continue;
                }
                if ($off === 0) {
                    $perDay++;
                } elseif ($d['rules']['no_consecutivi'] && $b['ep'] === $d['episode_id'] && $b['line'] === $d['line_id']) {
                    return ['*'];
                }
            }
        }
        if ($perDay >= $d['rules']['max_giorno']) {
            return ['*'];
        }
        $resourceBlocks=PlanningRules::resources($this->store,$this->hours,$c,$d,$this->busy[$date]??[],$ignore);
        if($resourceBlocks===['*'])return ['*'];
        $blockers = array_fill_keys($resourceBlocks,true);
        $opEnd=PlanningRules::operatorEnd($d['type'],$c['s'],$c['e']);
        foreach ($this->busy[$date] ?? [] as $b) {
            if (isset($ignore[$b['id']]) || !($c['s'] < $b['e'] && $b['s'] < $c['e'])) {
                continue;
            }
            $join = !empty($d['type']['di_gruppo']) && $b['tipo']==='gruppo' && $b['pro']===$c['pro'] && ($b['type']??null)===$d['type']['id'] && $b['s']===$c['s'] && $b['e']===$c['e'] && PlanningRules::canJoin($this->store,$b,$d);
            if (($b['pro'] === $c['pro'] && !$join && $opEnd>$c['s'] && ($b['op_end']??$b['e'])>$b['s'] && $c['s']<($b['op_end']??$b['e']) && $b['s']<PlanningRules::operatorEnd($d['type'],$c['s'],$c['e'])) || in_array($d['patient_id'], $b['pat'], true)) {
                $blockers[$b['id']] = true;
                if (in_array($d['patient_id'], $b['pat'], true)) {
                    return ['*'];   // il paziente è già impegnato: spostare altri non aiuta
                }
            }

        }
        $candidateResources=array_filter(array_merge([$c['res']],$d['type']['risorse_aggiuntive']??[]));
        foreach ($extraBlock as $x) {
            if($x['date']!==$date||$c['s']>=$x['e']||$x['s']>=$c['e'])continue;
            $operator=$x['pro']===$c['pro']&&$opEnd>$c['s']&&($x['op_end']??$x['e'])>$x['s']&&$c['s']<($x['op_end']??$x['e'])&&$x['s']<$opEnd;
            if($operator||array_intersect($candidateResources,$x['resources']??array_filter([$x['res']])))return ['*'];
        }
        return array_keys($blockers);
    }


}
