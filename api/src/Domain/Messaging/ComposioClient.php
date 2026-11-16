<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

use App\Core\Env;

/**
 * Unico adattatore verso Composio (REST, solo da server). Cambiare fornitore o versione dell'API tocca solo questo file.
 * Gli «slug» delle azioni si impostano in Impostazioni → Messaggi o nel .env: qui non se ne inventa nessuno.
 */
final class ComposioClient
{
    /** @var callable|null function(string $method, string $url, array $headers, ?string $body, int $timeout): array{status:int,body:string} */
    private $transport;

    public function __construct(?callable $transport = null, private readonly ?\App\Services\IntegrationSecrets $secrets = null)
    {
        $this->transport = $transport;
    }

    public function configured(): bool
    {
        return ($this->secrets?->get('composio_api_key') ?: Env::get('COMPOSIO_API_KEY')) !== '';
    }

    /**
     * Esegue un'azione (strumento) per l'utente della struttura.
     * @param array<string,mixed> $arguments
     * @return array{ok:bool,status:int,data:array<string,mixed>,error:?string,temporary:bool}
     */
    public function execute(string $slug, array $arguments, ?string $connectedAccountId = null): array
    {
        $base = rtrim(Env::get('COMPOSIO_BASE_URL', 'https://backend.composio.dev'), '/');
        $payload = ['user_id' => Env::get('COMPOSIO_USER_ID', 'poliambulatorio'), 'arguments' => $arguments];
        if ($connectedAccountId !== null && $connectedAccountId !== '') {
            $payload['connected_account_id'] = $connectedAccountId;
        }
        $res = ($this->transport ?? [$this, 'http'])('POST', $base . '/api/v3/tools/execute/' . rawurlencode($slug),
            ['Content-Type: application/json', 'x-api-key: ' . ($this->secrets?->get('composio_api_key') ?: Env::get('COMPOSIO_API_KEY'))], json_encode($payload, JSON_UNESCAPED_UNICODE), 30);
        $data = json_decode($res['body'], true);
        $data = is_array($data) ? $data : [];
        $okHttp = $res['status'] >= 200 && $res['status'] < 300;
        $successful = $okHttp && ($data['successful'] ?? $data['successfull'] ?? true) !== false && empty($data['error']);
        $error = null;
        if (!$successful) {
            $error = (string) ($data['error'] ?? $data['message'] ?? $data['error']['message'] ?? ($res['status'] === 0 ? 'rete_non_raggiungibile' : 'errore_' . $res['status']));
            if (is_array($data['error'] ?? null)) {
                $error = (string) ($data['error']['message'] ?? 'errore');
            }
        }
        // Temporaneo: rete, limiti di velocità, errori del fornitore. Definitivo: richiesta rifiutata (dati o configurazione sbagliati).
        $temporary = !$successful && ($res['status'] === 0 || $res['status'] === 408 || $res['status'] === 429 || $res['status'] >= 500);
        return ['ok' => $successful, 'status' => $res['status'], 'data' => $data, 'error' => $error, 'temporary' => $temporary];
    }

    /** @return array{status:int,body:string} */
    private function http(string $method, string $url, array $headers, ?string $body, int $timeout): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER => $headers, CURLOPT_POSTFIELDS => $body]);
        $out = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ['status' => $status, 'body' => is_string($out) ? $out : ''];
    }
}
