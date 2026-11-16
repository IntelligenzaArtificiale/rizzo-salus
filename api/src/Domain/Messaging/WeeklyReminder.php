<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Env;
use App\Domain\Agenda\Appointments;
use App\Services\Settings;
use App\Services\Tokens;
use App\Store\Store;

/**
 * Promemoria della settimana successiva. Parte da solo ogni venerdì alle 13:00 (giorno e ora si cambiano da Impostazioni).
 * Ogni paziente riceve un link personale a una pagina che mostra sempre lo stato aggiornato dei suoi appuntamenti.
 */
final class WeeklyReminder
{
    public const SCOPE = 'agenda_paziente';

    public function __construct(
        private readonly Store $store,
        private readonly Settings $settings,
        private readonly Appointments $appointments,
        private readonly MessageGateway $gateway,
        private readonly Tokens $tokens,
        private readonly Notified $notified,
        private readonly Lines $lines,
    ) {
    }

    /** @return array{settimana:string,pazienti:int,accodati:int,gia_inviati:int,senza_canale:int,errori:int} */
    public function run(?string $today = null): array
    {
        $today ??= Clock::today();
        $week = Clock::addDays(Clock::weekStart($today), 7);
        return $this->forWeek($week);
    }

    /** @return array{settimana:string,pazienti:int,accodati:int,gia_inviati:int,senza_canale:int,errori:int} */
    public function forWeek(string $week, ?array $onlyPatients = null): array
    {
        $end = Clock::addDays($week, 7);
        $byPatient = [];
        foreach ($this->appointments->between($week, $end) as $a) {
            if (($a['tipo'] ?? '') === 'nota' || $a['stato'] === 'annullato') {
                continue;
            }
            foreach (Notified::people($a) as $p) {
                $byPatient[$p['patient_id']][$a['id']] = $a;
            }
        }
        $res = ['settimana' => $week, 'pazienti' => 0, 'accodati' => 0, 'gia_inviati' => 0, 'senza_canale' => 0, 'errori' => 0];
        foreach ($byPatient as $pid => $appts) {
            if ($onlyPatients !== null && !in_array($pid, $onlyPatients, true)) {
                continue;
            }
            $patient = $this->store->get('patients', $pid, false);
            if ($patient === null || !(new \App\Domain\Patients\Documents(new \App\Services\Services($this->store)))->releaseAllowed($pid)) {
                continue;
            }
            $res['pazienti']++;
            $key = self::key($pid, $week);
            foreach ($this->store->all('messages', static fn ($m) => ($m['idempotency_key'] ?? null) === $key) as $_) {
                $res['gia_inviati']++;
                continue 2;
            }
            $m = $this->compose($patient, array_values($appts), $week);
            if ($m['status'] === 'errore') {
                $m['channel'] === 'nessuno' ? $res['senza_canale']++ : $res['errori']++;
                continue;
            }
            $res['accodati']++;
            foreach ($appts as $a) {
                $this->notified->mark($a, $pid, 'promemoria');
            }
        }
        return $res;
    }

    public static function key(string $patientId, string $week): string
    {
        return "promemoria:$patientId:$week";
    }

    /** @param list<array> $appts */
    private function compose(array $patient, array $appts, string $week): array
    {
        $mode = (string) $this->settings->get('messaggi.promemoria.contenuto', 'link_riassunto');
        $vars = ['elenco_appuntamenti' => $this->lines->byDay($appts)];
        $key = self::key($patient['id'], $week);
        if ($mode === 'testo') {
            return $this->gateway->enqueue($patient, 'promemoria_testo', $vars, $key, ['paziente_id' => $patient['id'], 'canale' => 'sms']);
        }
        $link = $this->link($patient['id'], $week);
        $vars += ['link' => $link, 'riassunto' => $mode === 'link' ? 'Trova tutti i dettagli nel link.' : $this->lines->summary($appts)];
        return $this->gateway->enqueue($patient, 'promemoria_link', $vars, $key, ['paziente_id' => $patient['id'], 'canale' => 'sms']);
    }

    /** Link personale: scade a fine settimana + 7 giorni. In chiaro solo qui, sul server resta l'hash. */
    private function link(string $patientId, string $week): string
    {
        $expires = Clock::addDays($week, 14) . 'T00:00:00';
        $minutes = max(60, Clock::diffMinutes(Clock::stamp(), $expires));
        $raw = $this->tokens->issue(self::SCOPE, $patientId, $minutes, ['dal' => $week, 'al' => Clock::addDays($week, 6), 'paziente_id' => $patientId], false);
        return rtrim(Env::get('APP_URL'), '/') . '/s/' . $raw;
    }

    /** Pagina pubblica del paziente. @return array<string,mixed> */
    public function publicView(string $rawToken): array
    {
        $t = $this->tokens->peek(self::SCOPE, $rawToken);
        $pid = $t['data']['paziente_id'];
        if (!(new \App\Domain\Patients\Documents(new \App\Services\Services($this->store)))->releaseAllowed($pid)) throw new ApiError('consensi_mancanti',403);
        $from = $t['data']['dal'];
        $to = $t['data']['al'];
        $patient = $this->store->get('patients', $pid, false) ?? throw new ApiError('link_scaduto', 410);
        $rows = array_values(array_filter($this->appointments->between($from, Clock::addDays($to, 1), true), static function ($a) use ($pid) {
            return ($a['tipo'] ?? '') !== 'nota' && in_array($pid, array_column(Notified::people($a), 'patient_id'), true);
        }));
        $updated = null;
        foreach ($rows as $a) {
            if (($a['updated_at'] ?? '') > ($t['created_at'] ?? '') && ($updated === null || $a['updated_at'] > $updated)) {
                $updated = $a['updated_at'];
            }
        }
        $days = [];
        foreach ($rows as $a) {
            if ($a['stato'] === 'annullato') {
                continue;
            }
            $d = substr($a['start'], 0, 10);
            $days[$d]['data'] = $d;
            $days[$d]['giorno'] = ucfirst(Lines::dayName($d)) . ' ' . substr($d, 8, 2) . '/' . substr($d, 5, 2);
            $days[$d]['appuntamenti'][] = ['dalle' => substr($a['start'], 11, 5), 'alle' => substr($a['end'], 11, 5), 'tipo' => $this->lines->typeName($a)];
        }
        ksort($days);
        $s = (array) $this->settings->get('struttura', []);
        return [
            'nome' => $patient['nome'], 'dal' => $from, 'al' => $to, 'giorni' => array_values($days),
            'aggiornato_il' => $updated, 'struttura' => ['nome' => $s['ragione_sociale'] ?: 'Poliambulatorio', 'telefono' => $s['telefono'] ?? '', 'indirizzo' => $s['indirizzo'] ?? ''],
        ];
    }

    public function revoke(string $patientId): int
    {
        return $this->tokens->revokeFor(self::SCOPE, $patientId);
    }
}
