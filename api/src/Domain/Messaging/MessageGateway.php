<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Crypto;
use App\Core\Env;
use App\Services\Settings;
use App\Store\Store;

/**
 * Unica porta d'uscita dei messaggi. Ogni invio:
 *  1. sceglie il canale rispettando preferenza e consensi;
 *  2. si registra in `messages` (in_coda) con una chiave di idempotenza: lo stesso messaggio non parte due volte;
 *  3. parte dalla coda con tentativi a intervalli crescenti, fuori dagli orari di silenzio, nel rispetto della modalità prova e del tetto di spesa.
 * Modalità (Impostazioni → Messaggi): «test» registra e non invia; «interno» invia solo al numero/email di prova; «live» invia davvero.
 */
final class MessageGateway
{
    public const BACKOFF_MIN = [2, 10, 30, 120, 360, 720];
    public const CHANNELS = ['whatsapp', 'sms', 'email'];

    /** @var array<string,ChannelSender> */
    private array $senders;

    /** @param array<string,ChannelSender> $senders */
    public function __construct(private readonly Store $store, private readonly Settings $settings, private readonly Templates $templates, array $senders)
    {
        $this->senders = $senders;
    }

    // ------------------------------------------------------------ scelta del canale

    /**
     * @param array<string,mixed> $person paziente o contatto
     * @return array{canale:?string,to:?string,motivo:?string}
     */
    public function route(array $person, bool $marketing = false): array
    {
        $pref = $person['canale_preferito'] ?? $this->settings->get('messaggi.canale_predefinito', 'whatsapp');
        if ($pref === 'nessuno') {
            return ['canale' => null, 'to' => null, 'motivo' => 'non_contattare'];
        }
        if ($marketing && !self::consent($person, 'marketing')) {
            return ['canale' => null, 'to' => null, 'motivo' => 'consenso_marketing_mancante'];
        }
        $phone = $person['telefono'] ?? null;
        $mail = $person['email'] ?? null;
        $can = [
            'whatsapp' => $phone && self::consent($person, 'whatsapp'),
            'sms' => (bool) $phone,
            'email' => (bool) $mail,
        ];
        $order = match ($pref) {
            'whatsapp' => $this->settings->get('messaggi.fallback_sms', true) ? ['whatsapp', 'sms', 'email'] : ['whatsapp', 'email'],
            'sms' => ['sms', 'email'],
            default => ['email', 'sms'],
        };
        foreach ($order as $ch) {
            if ($can[$ch]) {
                return ['canale' => $ch, 'to' => $ch === 'email' ? $mail : $phone, 'motivo' => null];
            }
        }
        return ['canale' => null, 'to' => null, 'motivo' => $phone || $mail ? 'consenso_whatsapp_mancante' : 'nessun_recapito'];
    }

    private static function consent(array $person, string $kind): bool
    {
        if (isset($person['consensi'])) {
            return !empty($person['consensi'][$kind]['valore']);
        }
        return !empty($person['consenso_' . $kind]);   // contatti importati dalla rubrica
    }

    // ------------------------------------------------------------ composizione e accodamento

    /** @return array<string,string> segnaposto comuni a tutti i messaggi */
    public function baseVars(): array
    {
        $s = (array) $this->settings->get('struttura', []);
        $name = trim((string) ($s['ragione_sociale'] ?? '')) ?: 'il Poliambulatorio';
        return ['struttura' => $name, 'telefono' => (string) (($s['telefono'] ?? '') ?: 'la segreteria'), 'indirizzo' => (string) ($s['indirizzo'] ?? ''), 'link_recensione' => (string) ($s['link_recensione'] ?? '')];
    }

    /**
     * Compone e accoda un messaggio a una persona. Ritorna sempre il record (anche se non c'è un canale utile: allora è un errore visibile alla segreteria).
     * @param array<string,mixed> $person
     * @param array<string,scalar|null> $vars
     * @param array{marketing?:bool,urgente?:bool,bozza?:bool,dopo?:string,paziente_id?:string,contatto_id?:string,campagna_id?:string,canale?:string,collega?:array} $opt
     */
    public function enqueue(array $person, string $templateKey, array $vars, string $idempotencyKey, array $opt = []): array
    {
        $tpl = $this->templates->get($templateKey);
        $route = isset($opt['canale']) ? $this->forced($person, $opt['canale'], !empty($opt['marketing'])) : $this->route($person, !empty($opt['marketing']));
        $vars += ['nome' => (string) ($person['nome'] ?? ''), 'cognome' => (string) ($person['cognome'] ?? '')] + $this->baseVars();
        $base = ['template_key' => $templateKey, 'patient_id' => $opt['paziente_id'] ?? null, 'contact_id' => $opt['contatto_id'] ?? null, 'campaign_id' => $opt['campagna_id'] ?? null,
            'urgente' => !empty($opt['urgente']), 'marketing' => !empty($opt['marketing']), 'collega' => $opt['collega'] ?? null];
        if ($route['canale'] === null) {
            return $this->store->transaction(fn () => $this->findByKey($idempotencyKey) ?? $this->store->put('messages', $base + [
                'channel' => 'nessuno', 'to' => '', 'kind' => $templateKey, 'subject' => null, 'body' => '', 'status' => 'errore', 'attempts' => 0, 'idempotency_key' => $idempotencyKey,
                'error' => $route['motivo'], 'cost_eur' => 0.0, 'next_attempt_at' => null, 'provider_id' => null, 'definitivo' => true]));
        }
        $body = Templates::render($tpl['testo'], $vars);
        $subject = $route['canale'] === 'email' ? Templates::render($tpl['oggetto'] ?? '', $vars) : null;
        return $this->store->transaction(function () use ($route, $body, $subject, $idempotencyKey, $templateKey, $base, $opt) {
            if (($dup = $this->findByKey($idempotencyKey)) !== null) {
                return $dup;
            }
            $draft = !empty($opt['bozza']);
            return $this->store->put('messages', $base + [
                'channel' => $route['canale'], 'to' => $route['to'], 'kind' => $templateKey, 'subject' => $subject, 'body' => $body,
                'status' => $draft ? 'bozza' : 'in_coda', 'attempts' => 0, 'idempotency_key' => $idempotencyKey, 'error' => null, 'cost_eur' => 0.0,
                'next_attempt_at' => $draft ? null : ($opt['dopo'] ?? Clock::stamp()), 'provider_id' => null,
            ]);
        });
    }

    /** Messaggio libero verso un indirizzo (email al commercialista, ecc.). */
    public function enqueueRaw(string $channel, string $to, string $kind, string $body, ?string $subject, string $idempotencyKey, array $extra = []): array
    {
        return $this->store->transaction(fn () => $this->findByKey($idempotencyKey) ?? $this->store->put('messages', $extra + [
            'channel' => $channel, 'to' => $to, 'kind' => $kind, 'subject' => $subject, 'body' => $body, 'status' => 'in_coda', 'attempts' => 0, 'idempotency_key' => $idempotencyKey,
            'error' => null, 'cost_eur' => 0.0, 'next_attempt_at' => Clock::stamp(), 'provider_id' => null, 'urgente' => false, 'marketing' => false, 'tecnico' => true]));
    }

    private function forced(array $person, string $channel, bool $marketing = false): array
    {
        if (($person['canale_preferito']??'')==='nessuno' || ($marketing&&!self::consent($person,'marketing')) || ($channel==='whatsapp'&&!self::consent($person,'whatsapp'))) return ['canale'=>null,'to'=>null,'motivo'=>'consenso_mancante'];
        $to = $channel === 'email' ? ($person['email'] ?? null) : ($person['telefono'] ?? null);
        return $to ? ['canale' => $channel, 'to' => $to, 'motivo' => null] : ['canale' => null, 'to' => null, 'motivo' => 'nessun_recapito'];
    }

    private function findByKey(string $key): ?array
    {
        foreach ($this->store->all('messages', static fn ($m) => ($m['idempotency_key'] ?? null) === $key) as $m) {
            return $m;
        }
        return null;
    }

    // ------------------------------------------------------------ coda

    /** Spedisce i messaggi in scadenza. @return array{inviati:int,rinviati:int,errori:int,saltati:int} */
    public function process(int $limit = 40, float $seconds = 45.0): array
    {
        $out = ['inviati' => 0, 'rinviati' => 0, 'errori' => 0, 'saltati' => 0];
        $deadline = microtime(true) + $seconds;
        $this->recoverStuck();
        $now = Clock::stamp();
        $due = $this->store->all('messages', static fn ($m) => $m['status'] === 'in_coda' && ($m['next_attempt_at'] ?? '') <= $now);
        usort($due, static fn ($a, $b) => [$a['next_attempt_at'], $a['created_at']] <=> [$b['next_attempt_at'], $b['created_at']]);
        foreach (array_slice($due, 0, $limit) as $m) {
            if (microtime(true) > $deadline) {
                break;
            }
            $r = $this->deliver($m['id']);
            $out[$r] = ($out[$r] ?? 0) + 1;
        }
        return $out;
    }

    /** @return 'inviati'|'rinviati'|'errori'|'saltati' */
    public function deliver(string $id): string
    {
        $claimed = $this->store->transaction(function () use ($id) {
            $m = $this->store->get('messages', $id);
            if ($m === null || $m['status'] !== 'in_coda') {
                return null;
            }
            $block = $this->blockedReason($m);
            if ($block !== null) {
                if ($block['definitivo']) {
                    $this->fail($m, $block['motivo'], true);
                    return 'errori';
                }
                $this->store->put('messages', array_replace($m, ['next_attempt_at' => $block['dopo']]));
                return 'rinviati';
            }
            $mode = $this->mode();
            if ($mode === 'test') {
                $this->store->put('messages', array_replace($m, ['status' => 'inviato', 'simulato' => true, 'sent_at' => Clock::stamp(), 'provider_id' => 'prova', 'attempts' => $m['attempts'] + 1, 'error' => null]));
                return 'inviati';
            }
            if (!isset($this->senders[$m['channel']])) {
                $this->fail($m, 'canale_non_supportato', true);
                return 'errori';
            }
            return $this->store->put('messages', array_replace($m, ['status' => 'in_invio', 'claimed_at' => Clock::stamp(), 'attempts' => $m['attempts'] + 1]));
        });
        if (is_string($claimed)) {
            return $claimed;
        }
        if ($claimed === null) {
            return 'saltati';
        }
        $m = $claimed;
        $send = $m;
        if ($this->mode() === 'interno') {
            $send['to'] = $m['channel'] === 'email' ? ($this->settings->get('messaggi.destinatario_prova_email','')?:Env::get('TEST_RECIPIENT_EMAIL')) : ($this->settings->get('messaggi.destinatario_prova_telefono','')?:Env::get('TEST_RECIPIENT_PHONE'));
            $send['body'] = '[PROVA — destinatario reale: ' . $m['to'] . "]\n" . $m['body'];
            if ($send['to'] === '') {
                return $this->store->transaction(function () use ($m) {
                    $this->fail($m, 'destinatario_di_prova_mancante', true);
                    return 'errori';
                });
            }
        }
        try {
            $r = $this->senders[$m['channel']]->send($send);
        } catch (\Throwable $e) {
            $r = ['ok' => false, 'provider_id' => null, 'error' => 'errore_interno_invio', 'permanent' => false, 'cost_eur' => null];
        }
        return $this->store->transaction(function () use ($m, $r) {
            $cur = $this->store->get('messages', $m['id']) ?? $m;
            if ($r['ok']) {
                $cost = $r['cost_eur'] ?? (float) $this->settings->get('messaggi.costo_stimato.' . $m['channel'], 0.0);
                $this->store->put('messages', array_replace($cur, ['status' => 'inviato', 'sent_at' => Clock::stamp(), 'provider_id' => $r['provider_id'], 'cost_eur' => round($cost, 4), 'error' => null, 'simulato' => false]));
                return 'inviati';
            }
            if ($r['permanent'] || $cur['attempts'] >= count(self::BACKOFF_MIN)) {
                $this->fail($cur, $r['permanent'] ? (string) $r['error'] : 'tentativi_esauriti:' . $r['error'], true);
                return 'errori';
            }
            $wait = self::BACKOFF_MIN[$cur['attempts'] - 1] ?? 720;
            $this->store->put('messages', array_replace($cur, ['status' => 'in_coda', 'error' => (string) $r['error'], 'next_attempt_at' => Clock::addMinutes(Clock::stamp(), $wait)]));
            return 'rinviati';
        });
    }

    /** Un messaggio rimasto «in_invio» per più di 15 minuti ha esito incerto: non si rispedisce da soli (rischio doppio invio). */
    private function recoverStuck(): void
    {
        $limit = Clock::addMinutes(Clock::stamp(), -15);
        foreach ($this->store->all('messages', static fn ($m) => $m['status'] === 'in_invio' && ($m['claimed_at'] ?? '') < $limit) as $m) {
            $this->store->transaction(fn () => $this->fail($m, 'esito_incerto', true));
        }
    }

    /** @return array{definitivo:bool,motivo:string,dopo:string}|null */
    private function blockedReason(array $m): ?array
    {
        $now = Clock::stamp();
        if (!empty($m['patient_id']) && !empty($m['marketing'])) {
            $p=$this->store->get('patients',$m['patient_id']);
            if (!$p || !self::consent($p,'marketing') || ($p['canale_preferito']??'')==='nessuno' || ($m['channel']==='whatsapp'&&!self::consent($p,'whatsapp'))) return ['definitivo'=>true,'motivo'=>'consenso_revocato','dopo'=>$now];
        }
        if(!empty($m['patient_id'])&&in_array($m['kind'],['promemoria_link','promemoria_testo','variazione','conferma_visita'],true) && !(new \App\Domain\Patients\Documents(new \App\Services\Services($this->store)))->releaseAllowed($m['patient_id']))return ['definitivo'=>true,'motivo'=>'consensi_mancanti','dopo'=>$now];
        $essential = in_array($m['kind'], Templates::ESSENTIAL, true) || !empty($m['urgente']) || !empty($m['tecnico']);
        $cap = (float) $this->settings->get('messaggi.tetto_mensile_eur', 100.0);
        if ($cap > 0 && $this->spentThisMonth() >= ($essential ? $cap * 1.5 : $cap)) {
            return ['definitivo' => true, 'motivo' => $essential ? 'tetto_sicurezza_raggiunto' : 'tetto_mensile_raggiunto', 'dopo' => $now];
        }
        if (empty($m['urgente'])) {
            $quiet = $this->quietEnd($now);
            if ($quiet !== null) {
                return ['definitivo' => false, 'motivo' => 'silenzio', 'dopo' => $quiet];
            }
        }
        return null;
    }

    /** Se «adesso» cade negli orari di silenzio, l'istante in cui finiscono. */
    public function quietEnd(string $now): ?string
    {
        $q = (array) $this->settings->get('messaggi.silenzio', []);
        if (empty($q['da']) || empty($q['a'])) {
            return null;
        }
        $t = Clock::minutes($now);
        $from = Clock::minutes($q['da']);
        $to = Clock::minutes($q['a']);
        $date = substr($now, 0, 10);
        $inside = $from > $to ? ($t >= $from || $t < $to) : ($t >= $from && $t < $to);
        if (!$inside) {
            return null;
        }
        $endDate = ($from > $to && $t >= $from) ? Clock::addDays($date, 1) : $date;
        return $endDate . 'T' . $q['a'] . ':00';
    }

    private function spentThisMonth(): float
    {
        $first = substr(Clock::today(), 0, 8) . '01';
        $sum = 0.0;
        foreach ($this->store->all('messages', null, $this->store->partsBetween('messages', $first, Clock::today())) as $m) {
            $sum += (float) ($m['cost_eur'] ?? 0);
        }
        return $sum;
    }

    private function mode(): string
    {
        $m = (string) $this->settings->get('messaggi.modalita', 'test');
        return in_array($m, ['test', 'interno', 'live'], true) ? $m : 'test';
    }

    /** Errore definitivo: lo vede la segreteria. Se era WhatsApp e c'è un telefono, parte l'SMS al suo posto. */
    private function fail(array $m, string $reason, bool $final): array
    {
        $saved = $this->store->put('messages', array_replace($m, ['status' => 'errore', 'error' => $reason, 'definitivo' => $final, 'next_attempt_at' => null]));
        if ($final && $m['channel'] === 'whatsapp' && $this->settings->get('messaggi.fallback_sms', true) && !str_starts_with((string) $m['idempotency_key'], 'sms:') && empty($m['fallback_di']) && !empty($m['patient_id'])
            && !in_array($reason, ['tetto_mensile_raggiunto', 'tetto_sicurezza_raggiunto', 'esito_incerto','consenso_revocato','consensi_mancanti'], true)) {
            $p = $this->store->get('patients', $m['patient_id'], false);
            if ($p !== null && !empty($p['telefono']) && $p['telefono'] === $m['to']) {
                $this->store->put('messages', array_replace(array_diff_key($m, array_flip(['id', 'revision', 'created_at', 'updated_at', 'created_by', 'updated_by'])), [
                    'channel' => 'sms', 'subject' => null, 'status' => 'in_coda', 'attempts' => 0, 'error' => null, 'idempotency_key' => 'sms:' . $m['idempotency_key'],
                    'next_attempt_at' => Clock::stamp(), 'fallback_di' => $m['id'], 'definitivo' => false,
                ]));
            }
        }
        $this->notifyFailure($saved);
        return $saved;
    }

    private function notifyFailure(array $m): void
    {
        foreach ($this->store->all('notifications', static fn ($n) => ($n['tipo'] ?? '') === 'messaggio_fallito' && ($n['messaggio_id'] ?? '') === $m['id']) as $_) {
            return;
        }
        $this->store->put('notifications', ['tipo' => 'messaggio_fallito', 'messaggio_id' => $m['id'], 'giorno' => Clock::today(), 'testo' => 'Un messaggio non è partito: ' . $m['error'], 'dati' => ['kind' => $m['kind'], 'patient_id' => $m['patient_id'] ?? null], 'letta' => false]);
    }

    // ------------------------------------------------------------ gestione dalla segreteria

    public function approve(string $id): array
    {
        $m=$this->store->get('messages',$id);if(($m['kind']??'')==='variazione')throw new ApiError('telefonata_richiesta',422);
        return $this->store->transaction(function () use ($id) {
            $m = $this->store->get('messages', $id) ?? throw ApiError::notFound();
            if ($m['status'] !== 'bozza') {
                throw new ApiError('messaggio_non_in_bozza', 409);
            }
            return $this->store->put('messages', array_replace($m, ['status' => 'in_coda', 'next_attempt_at' => Clock::stamp()]));
        });
    }

    public function cancel(string $id): array
    {
        return $this->store->transaction(function () use ($id) {
            $m = $this->store->get('messages', $id) ?? throw ApiError::notFound();
            if (!in_array($m['status'], ['bozza', 'in_coda', 'errore'], true)) {
                throw new ApiError('messaggio_non_annullabile', 409);
            }
            return $this->store->put('messages', array_replace($m, ['status' => 'annullato', 'next_attempt_at' => null]));
        });
    }

    /** Riprova un messaggio finito in errore (nuova chiave, stesso testo). */
    public function retry(string $id): array
    {
        return $this->store->transaction(function () use ($id) {
            $m = $this->store->get('messages', $id) ?? throw ApiError::notFound();
            if ($m['status'] !== 'errore' || $m['channel'] === 'nessuno') {
                throw new ApiError('messaggio_non_riprovabile', 409);
            }
            return $this->store->put('messages', array_replace($m, ['status' => 'in_coda', 'attempts' => 0, 'error' => null, 'definitivo' => false, 'next_attempt_at' => Clock::stamp()]));
        });
    }

    /** Invio di prova verso il numero/email interni, sempre reale se i recapiti di prova esistono. @return array<string,mixed> */
    public function sendTest(string $channel, string $templateKey, array $vars = []): array
    {
        if (($person['canale_preferito']??'')==='nessuno' || ($marketing&&!self::consent($person,'marketing')) || ($channel==='whatsapp'&&!self::consent($person,'whatsapp'))) return ['canale'=>null,'to'=>null,'motivo'=>'consenso_mancante'];
        $to = $channel === 'email' ? Env::get('TEST_RECIPIENT_EMAIL') : Env::get('TEST_RECIPIENT_PHONE');
        if ($to === '') {
            throw new ApiError('destinatario_di_prova_mancante', 422);
        }
        $tpl = $this->templates->get($templateKey);
        $vars += $this->baseVars() + ['nome' => 'Prova', 'cognome' => 'Prova', 'link' => 'https://esempio.invalid/s/prova', 'riassunto' => 'Lun 10:00 Terapia manuale', 'elenco_appuntamenti' => 'Lunedì 10:00 Terapia manuale',
            'elenco_variazioni' => 'Spostato a lunedì 10:00', 'tipo_scadenza' => 'certificato sportivo', 'data_scadenza' => '01/01/2030', 'slot' => 'lunedì alle 10:00', 'ore' => '12', 'codice' => '123456', 'minuti' => '10', 'stato' => 'confermata'];
        $body = '[PROVA] ' . Templates::render($tpl['testo'], $vars);
        $subject = $channel === 'email' ? '[PROVA] ' . Templates::render($tpl['oggetto'] ?? 'Prova', $vars) : null;
        $sender = $this->senders[$channel] ?? throw new ApiError('canale_non_supportato', 422);
        $r = $sender->send(['to' => $to, 'body' => $body, 'subject' => $subject, 'channel' => $channel]);
        return ['inviato' => $r['ok'], 'errore' => $r['error'], 'anteprima' => $body];
    }

    /** Anteprima di un modello senza inviare. */
    public function preview(string $templateKey, array $vars = []): array
    {
        $tpl = $this->templates->get($templateKey);
        $vars += $this->baseVars() + ['nome' => 'Anna', 'cognome' => 'Rossi', 'link' => 'https://esempio.invalid/s/anteprima', 'riassunto' => 'Lun 10:00 Terapia manuale', 'elenco_appuntamenti' => 'Lunedì 10:00 Terapia manuale',
            'elenco_variazioni' => 'Spostato a lunedì 10:00', 'tipo_scadenza' => 'certificato sportivo', 'data_scadenza' => '01/01/2030', 'slot' => 'lunedì alle 10:00', 'ore' => '12', 'codice' => '123456', 'minuti' => '10', 'stato' => 'confermata'];
        return ['testo' => Templates::render($tpl['testo'], $vars), 'oggetto' => Templates::render($tpl['oggetto'] ?? '', $vars)];
    }

    public static function newKey(): string
    {
        return Crypto::token(12);
    }
}
