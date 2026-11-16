<?php
declare(strict_types=1);
namespace App\Domain\Agenda;
use App\Core\{ApiError,Clock};
use App\Store\Store;
use App\Support\Validator as V;
/** Costruzione e riferimenti di un appuntamento, separati dalle transizioni. */
final class AppointmentBuilder
{
 public function __construct(private readonly Store $store,private readonly Appointments $appointments){}
    public function build(array $in, string $origin): array
    {
        $tipo = V::enum($in, 'tipo', ['terapia', 'visita', 'gruppo', 'nota'], true);
        $start = V::stamp($in, 'start', true);
        $a = ['tipo' => $tipo, 'start' => $start, 'stato' => 'programmato', 'origine' => V::enum($in, 'origine', ['manuale', 'copia_settimana', 'ai', 'prenotazione_online', 'lista_attesa'], false, $origin), 'version' => 1, 'notified_version' => null, 'nota' => V::str($in, 'nota', false, 500)];
        if ($tipo === 'nota') {
            $end = V::stamp($in, 'end') ?? Clock::addMinutes($start, 15);
            return $a + ['end' => $end, 'titolo' => V::str($in, 'titolo', true, 200), 'professional_id' => V::id($in, 'professional_id', 'pro'), 'resource_id' => null];
        }
        $pro = V::id($in, 'professional_id', 'pro', true);
        $professional=$this->store->get('professionals', $pro) ?? throw new ApiError('professionista_non_trovato', 422);
        if(empty($professional['attivo'])||!in_array($professional['tipo'],['medico','fisioterapista'],true))throw new ApiError('professionista_non_disponibile',422);
        $ttId = V::id($in, 'therapy_type_id', 'ter', true);
        $tt = $this->store->get('therapy_types', $ttId) ?? throw new ApiError('terapia_non_trovata', 422);
        if(empty($tt['attivo']))throw new ApiError('terapia_non_attiva',422);
        if (($tipo === 'visita') !== ($tt['categoria'] === 'visita')) {
            throw new ApiError('tipo_e_terapia_incoerenti', 422);
        }
        $duration = V::int($in, 'durata_min', false, 5, 480) ?? (int) $tt['durata_min'];
        $a += TherapyRules::snapshot($tt);
        $a += [
            'end' => Clock::addMinutes($start, $duration), 'professional_id' => $pro, 'therapy_type_id' => $ttId, 'categoria' => $tt['categoria'],
            'resource_id' => V::id($in, 'resource_id', 'ris') ?? ($tt['risorsa_id'] ?? null),
        ];
        if ($tipo === 'gruppo') {
            if (empty($tt['di_gruppo'])) {
                throw new ApiError('terapia_non_di_gruppo', 422);
            }
            $a['group_id'] = V::id($in, 'group_id', 'grp');
            $a['capienza'] = (int) $tt['capienza'];
            $a['participants'] = [];
            foreach (V::arr($in, 'participants') as $p) {
                $a['participants'][] = $this->participant((array) $p, $ttId);
            }
            return $a;
        }
        $patient = V::id($in, 'patient_id', 'paz', true);
        $this->store->get('patients', $patient, false) ?? throw new ApiError('paziente_non_trovato', 422);
        $a += ['patient_id' => $patient, 'episode_id' => V::id($in, 'episode_id', 'epi'), 'line_id' => V::str($in, 'line_id', false, 40)];
        $this->assertLine($a['patient_id'], $a['episode_id'], $a['line_id'], $ttId);
        return $a;
    }

    public function participant(array $p, ?string $therapyId = null): array
    {
        $patient = V::id($p, 'patient_id', 'paz', true);
        $this->store->get('patients', $patient, false) ?? throw new ApiError('paziente_non_trovato', 422);
        $out = ['patient_id' => $patient, 'episode_id' => V::id($p, 'episode_id', 'epi'), 'line_id' => V::str($p, 'line_id', false, 40), 'stato' => 'programmato'];
        $this->assertLine($patient, $out['episode_id'], $out['line_id'], $therapyId);
        return $out;
    }

    public function assertLine(string $patientId, ?string $episodeId, ?string $lineId, ?string $therapyTypeId): void
    {
        if ($episodeId === null) {
            return;
        }
        $ep = $this->store->get('episodes', $episodeId, false) ?? throw new ApiError('episodio_non_trovato', 422);
        if ($ep['patient_id'] !== $patientId) {
            throw new ApiError('episodio_di_un_altro_paziente', 422);
        }
        if ($ep['stato'] !== 'aperto') throw new ApiError('episodio_chiuso',422);
        if ($lineId === null) throw new ApiError('riga_terapia_non_valida',422);
        if ($lineId !== null) {
            $line = null;
            foreach ($ep['therapies'] as $l) {
                if ($l['line_id'] === $lineId) {
                    $line = $l;
                }
            }
            if ($line === null || ($therapyTypeId !== null && $line['therapy_type_id'] !== $therapyTypeId)) {
                throw new ApiError('riga_terapia_non_valida', 422);
            }
            $count=0;
            foreach($this->appointments->forEpisodes([$episodeId]) as $a)if($a['stato']!=='annullato')foreach(Appointments::refs($a) as $r)if($r['line_id']===$lineId&&$r['patient_id']===$patientId&&in_array($r['stato'],Appointments::LIVE,true))$count++;
            if($count >= $line['sedute_previste'])throw new ApiError('sedute_esaurite',409);
        }
    }

}
