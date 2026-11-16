<?php
declare(strict_types=1);

namespace App\Domain\Agenda;

use App\Core\Clock;
use App\Domain\Calendar\Hours;
use App\Services\Settings;
use App\Store\Store;

/**
 * Controlli di un appuntamento prima del salvataggio.
 * Conflitti (bloccanti): professionista occupato, paziente già impegnato, risorsa occupata/piena/ferma, gruppo oltre la capienza.
 * Avvisi (si possono confermare): fuori orario, struttura chiusa, professionista assente o fuori turno, paziente non disponibile.
 */
final class Checker
{
    public function __construct(private readonly Store $store, private readonly Settings $settings, private readonly Hours $hours, private readonly Appointments $appointments)
    {
    }

    /**
     * @param array<string,mixed> $a appuntamento candidato (start, end, professional_id, resource_id, tipo, partecipanti)
     * @return array{conflitti:list<array>,avvisi:list<array>}
     */
    public function check(array $a, ?string $ignoreId = null, array $pending = []): array
    {
        $conflicts = [];
        $warnings = [];
        if (($a['tipo'] ?? '') === 'nota' || $a['stato'] === 'annullato') {
            return ['conflitti' => [], 'avvisi' => []];
        }
        $date = substr($a['start'], 0, 10);
        $s = Clock::minutes($a['start']);
        $e = Clock::diffMinutes($a['start'], $a['end']) + $s;
        $near = array_merge($this->appointments->between(Clock::addDays($date, -1), Clock::addDays($date, 2)),$pending);
        $persons = self::present($a);
        $needPersons = max(1, count($persons));

        foreach ($near as $o) {
            if ($o['id'] === $ignoreId || ($o['tipo'] ?? '') === 'nota' || $o['stato'] === 'assente' || !self::overlap($a, $o)) {
                continue;
            }
            if (!empty($a['professional_id']) && ($o['professional_id'] ?? null) === $a['professional_id'] && TherapyRules::operatorOverlap($a,$o)) {
                $conflicts[] = ['codice' => 'professionista_occupato', 'con' => $o['id'], 'inizio' => $o['start']];
            }
            $mine = array_column($persons, 'patient_id');
            $theirs = array_column(self::present($o), 'patient_id');
            if (array_intersect($mine, $theirs) !== []) {
                $conflicts[] = ['codice' => 'paziente_occupato', 'con' => $o['id'], 'inizio' => $o['start']];
            }
        }

        if(($a['impegna_operatore']??true)===false&&empty($a['resource_id']))$conflicts[]=['codice'=>'risorsa_non_disponibile'];
        $resources=ResourceConstraints::check($this->store,$this->hours,$a,$near,$ignoreId);
        $conflicts=array_merge($conflicts,$resources['conflitti']);$warnings=array_merge($warnings,$resources['avvisi']);
        if($a['tipo']==='gruppo')$conflicts=array_merge($conflicts,GroupLimits::inspect($this->store,Appointments::refs($a),(int)$a['capienza'])['conflitti']);
        foreach($persons as $ref){$ep=$this->store->get('episodes',$ref['episode_id']??'');foreach($ep['therapies']??[] as $line)if($line['line_id']===$ref['line_id']&&!empty($line['vincolo_professionista'])&&!empty($line['professional_preferito_id'])&&$line['professional_preferito_id']!==($a['professional_id']??null))$conflicts[]=['codice'=>'vincolo_professionista','paziente'=>$ref['patient_id']];}
        $closed = $this->hours->closedReason($date);
        if ($closed !== null) {
            $warnings[] = ['codice' => 'struttura_chiusa', 'motivo' => $closed];
        } elseif (!Hours::fits($this->hours->structureWindows($date), $s, $e)) {
            $warnings[] = ['codice' => 'fuori_orario_struttura'];
        }
        if (!empty($a['professional_id'])) {
            $pro = $this->store->get('professionals', $a['professional_id']);
            if ($pro === null || empty($pro['attivo']))$conflicts[]=['codice'=>'professionista_non_disponibile'];
            if ($pro !== null) {
                $abs = $this->hours->absenceReason($pro, $date);
                if ($abs !== null) {
                    $warnings[] = ['codice' => 'professionista_assente', 'motivo' => $abs];
                } elseif ($closed === null && !Hours::fits($this->hours->professionalWindows($pro, $date), $s, $e)) {
                    $warnings[] = ['codice' => 'fuori_turno_professionista'];
                }
            }
        }
        foreach ($persons as $r) {
            if ($r['episode_id'] && !$this->patientAvailable($r['episode_id'], $date, $s, $e)) {
                $warnings[] = ['codice' => 'paziente_non_disponibile', 'paziente' => $r['patient_id']];
            }
        }
        $conflicts=array_merge($conflicts,CycleConstraints::check($this->store,$a,$ignoreId,$pending));
        return ['conflitti' => $conflicts, 'avvisi' => $warnings];
    }

    /** Le fasce del paziente sono un'indicazione: se non ne ha dichiarate, è sempre disponibile. */
    public function patientAvailable(string $episodeId, string $date, int $s, int $e): bool
    {
        $ep = $this->store->get('episodes', $episodeId, false);
        $general = $ep['availability'] ?? [];
        if ($general === []) $general = $this->store->get('patients',$ep['patient_id'] ?? '')['disponibilita'] ?? [];
        $slots = array_values(array_filter($general, static fn ($x) => (empty($x['valida_dal']) || $date >= $x['valida_dal']) && (empty($x['valida_al']) || $date <= $x['valida_al'])));
        if ($general === []) {
            return true;
        }
        $dow = Clock::dow($date);
        foreach ($slots as $x) {
            if ((int) $x['giorno'] === $dow && Clock::minutes($x['da']) <= $s && Clock::minutes($x['a']) >= $e) {
                return true;
            }
        }
        return false;
    }

    /** Persone che occupano davvero lo slot: chi è segnato assente lo libera. */
    private static function present(array $a): array
    {
        return array_values(array_filter(Appointments::refs($a), static fn ($r) => $r['stato'] !== 'assente'));
    }

    public static function overlap(array $a, array $b): bool
    {
        return $a['start'] < $b['end'] && $b['start'] < $a['end'];
    }
}
