<?php
declare(strict_types=1);
/** Configura un archivio appena generato, senza copiare i dati della demo in uso. Solo CLI. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
use App\Core\{Env, Crypto};
$target = $argv[1] ?? '';
$source = $argv[2] ?? '';
if (!is_file($target)) throw new RuntimeException('Configurazione destinazione mancante');
require dirname($target, 2) . '/api/vendor/autoload.php';
$key = '';
if ($source !== '') {
    if (!is_file($source)) throw new RuntimeException('Configurazione sorgente mancante');
    putenv('APP_ENV_FILE=' . $source);
    $local = App\Bootstrap::services();
    $key = $local->secrets()->get('openai_api_key');
}
putenv('APP_ENV_FILE=' . $target);
Env::load($target);
Crypto::useKey(null);
$remote = App\Bootstrap::services();
$remote->settings()->update(['ai' => ['attiva' => true, 'modello' => 'gpt-4.1-mini', 'timeout_secondi' => 30,
    'tetto_giornaliero_eur' => 5.0, 'tetto_mensile_eur' => 5.0], 'messaggi' => ['modalita' => 'test']]);
if ($key !== '') $remote->secrets()->save(['openai_api_key' => $key]);
echo 'Runtime configurato; assistente: ' . ($key !== '' ? 'credenziale cifrata presente' : 'da configurare') . ".\n";
