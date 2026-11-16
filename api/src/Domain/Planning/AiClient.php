<?php
declare(strict_types=1);

namespace App\Domain\Planning;

use App\Core\ApiError;
use App\Core\Clock;
use App\Core\Env;
use App\Services\Settings;
use App\Store\Store;

/**
 * Unico punto da cui si parla con OpenAI. Regole:
 *  - mai dati identificativi del paziente nel testo inviato;
 *  - tetto di spesa giornaliero, tempo massimo, modello scelto dalle impostazioni;
 *  - se non è configurato o scade il tetto, il resto del gestionale continua a funzionare senza.
 */
final class AiClient
{
    /** @var callable|null function(array $payload, string $key, int $timeout): array{status:int,body:string} */
    private $transport;

    public function __construct(private readonly Store $store, private readonly Settings $settings, ?callable $transport = null)
    {
        $this->transport = $transport;
    }

    public function enabled(): bool
    {
        return (bool) $this->settings->get('ai.attiva', true) && trim((string) $this->settings->get('ai.modello', '')) !== '' && ((new \App\Services\IntegrationSecrets($this->store))->get('openai_api_key') ?? '') !== '';
    }

    /** @return array{costo_oggi:float,tetto:float,attiva:bool,configurata:bool} */
    public function status(): array
    {
        return ['costo_mese' => round($this->spentMonth(),4), 'tetto_mensile' => (float) $this->settings->get('ai.tetto_mensile_eur',5.0), 'costo_oggi' => round($this->spentToday(), 4), 'tetto' => (float) $this->settings->get('ai.tetto_giornaliero_eur', 5.0),
            'attiva' => (bool) $this->settings->get('ai.attiva', true), 'configurata' => trim((string) $this->settings->get('ai.modello', '')) !== '' && ((new \App\Services\IntegrationSecrets($this->store))->get('openai_api_key') ?? '') !== ''];
    }

    /**
     * @return array{testo:string,json:?array<string,mixed>}
     * @throws ApiError ai_non_configurata | tetto_ai_raggiunto | ai_non_disponibile
     */
    public function complete(string $purpose, string $system, string $user, bool $json = false): array
    {
        if (!$this->enabled()) {
            throw new ApiError('ai_non_configurata', 503);
        }
        $cap = (float) $this->settings->get('ai.tetto_giornaliero_eur', 5.0);
        if ($this->spentToday() >= $cap || $this->spentMonth() >= (float) $this->settings->get('ai.tetto_mensile_eur', 5.0)) {
            throw new ApiError('tetto_ai_raggiunto', 429);
        }
        $reserve=(strlen($system)+strlen($user)+1536)/1000*(float)$this->settings->get('ai.costo_per_1k_token_eur',0.002);
        $reservation=$this->store->transaction(function()use($reserve,$purpose,$cap){
            if($this->spentToday()+$reserve>$cap || $this->spentMonth()+$reserve>(float)$this->settings->get('ai.tetto_mensile_eur',5.0))throw new ApiError('tetto_ai_raggiunto',429);
            return $this->store->put('ai_usage',['at'=>Clock::stamp(),'giorno'=>Clock::today(),'scopo'=>$purpose,'token'=>0,'costo_eur'=>$reserve,'stato'=>'riservato']);
        });
        $payload = ['max_completion_tokens'=>1024,'model' => (string) $this->settings->get('ai.modello'), 'messages' => [['role' => 'system', 'content' => $system], ['role' => 'user', 'content' => $user]], 'temperature' => 0.2];
        if ($json) {
            $payload['response_format'] = ['type' => 'json_object'];
        }
        $timeout = max(3, min(60, (int) $this->settings->get('ai.timeout_secondi', 20)));
        $res = ($this->transport ?? [$this, 'http'])($payload, (string) (new \App\Services\IntegrationSecrets($this->store))->get('openai_api_key'), $timeout);
        $data = json_decode($res['body'], true);
        if ($res['status'] !== 200 || !is_array($data) || !isset($data['choices'][0]['message']['content'])) {
            throw new ApiError('ai_non_disponibile', 503);
        }
        $tokens = (int) ($data['usage']['total_tokens'] ?? 0);
        $cost = $tokens / 1000 * (float) $this->settings->get('ai.costo_per_1k_token_eur', 0.002);
        $this->store->transaction(fn () => $this->store->put('ai_usage', array_replace($reservation,['token'=>$tokens,'costo_eur'=>round($cost,6),'stato'=>'consuntivo'])));
        $text = (string) $data['choices'][0]['message']['content'];
        return ['testo' => $text, 'json' => $json ? (json_decode($text, true) ?: null) : null];
    }

    private function spentMonth(): float
    {
        $month = substr(Clock::today(), 0, 7);
        return array_sum(array_column($this->store->all('ai_usage', static fn ($r) => substr($r['at'], 0, 7) === $month, [$month]), 'costo_eur'));
    }

    private function spentToday(): float
    {
        $today = Clock::today();
        $sum = 0.0;
        foreach ($this->store->all('ai_usage', static fn ($r) => $r['giorno'] === $today, $this->store->partsBetween('ai_usage', $today, $today)) as $r) {
            $sum += (float) $r['costo_eur'];
        }
        return $sum;
    }

    /** @return array{status:int,body:string} */
    private function http(array $payload, string $key, int $timeout): array
    {
        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $key], CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE)]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['status' => $status, 'body' => is_string($body) ? $body : ''];
    }
}
