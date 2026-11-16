<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Store\Store;
/** Vista e segnali del ciclo calcolati senza cambiare gli appuntamenti. */
final class AgendaView
{
 public function __construct(private readonly Store $store,private readonly Appointments $appointments){}
    public function view(string $from, string $toExclusive, array $filters = [], bool $withCancelled = false): array
    {
        $rows = $this->appointments->between($from, $toExclusive, $withCancelled);
        $rows = array_values(array_filter($rows, static function ($a) use ($filters) {
            return (empty($filters['professional_id']) || ($a['professional_id'] ?? null) === $filters['professional_id'])
                && (empty($filters['resource_id']) || ($a['resource_id'] ?? null) === $filters['resource_id'])
                && (empty($filters['categoria']) || ($a['categoria'] ?? 'nota') === $filters['categoria']);
        }));
        $epIds = [];
        foreach ($rows as $a) {
            foreach (Appointments::refs($a) as $r) {
                if ($r['episode_id']) {
                    $epIds[$r['episode_id']] = true;
                }
            }
        }
        $all = $epIds ? $this->appointments->forEpisodes(array_keys($epIds)) : [];
        $num = Appointments::numbering($all);
        $planned = [];
        foreach (array_keys($epIds) as $eid) {
            foreach ($this->store->get('episodes', $eid, false)['therapies'] ?? [] as $l) {
                $planned[$eid . '|' . $l['line_id']] = (int) $l['sedute_previste'];
            }
        }
        foreach ($rows as &$a) {
            $a['segnali'] = [];
            if($a['tipo']==='gruppo')$a['limiti_gruppo']=GroupLimits::inspect($this->store,Appointments::refs($a),(int)$a['capienza']);
            foreach (Appointments::refs($a) as $r) {
                $n = $num["{$a['id']}|{$r['patient_id']}"] ?? null;
                $tot = $planned[$r['episode_id'] . '|' . $r['line_id']] ?? null;
                $a['segnali'][] = [
                    'patient_id' => $r['patient_id'], 'numero' => $n, 'previste' => $tot,
                    'prima' => $r['prima_manuale'] || $n === 1, 'ultima' => $r['ultima_manuale'] || ($n !== null && $tot !== null && $n === $tot),
                ];
            }
        }
        return $rows;
    }
}
