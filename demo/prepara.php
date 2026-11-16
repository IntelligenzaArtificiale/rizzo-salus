<?php
declare(strict_types=1);

/**
 * Prepara la demo in locale: crea la configurazione privata (chiavi casuali), le cartelle dei dati
 * e un poliambulatorio di esempio con pazienti, percorsi e agenda già pianificata dal pianificatore.
 *   php demo/prepara.php           (la prima volta)
 *   php demo/prepara.php --reset   (cancella i dati demo e riparte)
 */
$root = dirname(__DIR__);
require $root . '/api/vendor/autoload.php';

use App\Core\Clock;
use App\Core\Env;

$envFile = $root . '/demo/.env.demo';
$dataDir = $root . '/demo/dati';
if (in_array('--reset', $argv, true)) {
    exec('rm -rf ' . escapeshellarg($dataDir) . ' ' . escapeshellarg($root . '/demo/backup'));
}
if (!is_file($envFile)) {
    $port = getenv('PORT') ?: '8081';
    $appUrl = getenv('APP_URL') ?: 'http://localhost:' . $port;
    file_put_contents($envFile, implode("\n", [
        'APP_ENV=local', "APP_URL=$appUrl", 'APP_TIMEZONE=Europe/Rome', "DATA_DIR=$dataDir", 'BACKUP_DIR=' . $root . '/demo/backup',
        'DATA_ENCRYPTION_KEY=' . base64_encode(random_bytes(32)), 'CRON_TOKEN=' . bin2hex(random_bytes(16)),
        'MESSAGING_MODE=test', 'COMPOSIO_USER_ID=poliambulatorio', '',
    ]));
    chmod($envFile, 0600);
}
// Chiave OpenAI: dalla variabile d'ambiente OPENAI_API_KEY o dal file demo/chiave-openai.txt. Resta sul server, mai nel browser.
$key = trim((string) (getenv('OPENAI_API_KEY') ?: (is_file($root . '/demo/chiave-openai.txt') ? file_get_contents($root . '/demo/chiave-openai.txt') : '')));
if ($key !== '') {
    $lines = array_values(array_filter(explode("\n", (string) file_get_contents($envFile)), static fn ($l) => !str_starts_with($l, 'OPENAI_API_KEY=')));
    $lines[] = 'OPENAI_API_KEY=' . $key;
    file_put_contents($envFile, implode("\n", $lines) . "\n");
}
putenv('APP_ENV_FILE=' . $envFile);
Env::load($envFile);
@mkdir($dataDir, 0700, true);
@mkdir(Env::get('BACKUP_DIR'), 0700, true);

$svc = App\Bootstrap::services();
if ($svc->store->all('patients') === []) $svc->store->transaction(fn () => $svc->settings()->update(['ai' => ['attiva' => true, 'modello' => getenv('OPENAI_MODEL') ?: 'gpt-4o-mini']]));
echo $svc->secrets()->get('openai_api_key') !== '' ? "Assistente AI: credenziale disponibile; verifica attivazione e modello nel pannello.\n" : "Assistente AI: da configurare nelle impostazioni del titolare.\n";
if ($svc->store->all('patients') !== []) {
    echo "La demo è già pronta (usa --reset per ripartire da zero).\n";
    exit(0);
}

$svc->store->transaction(function () use ($svc) {
    $svc->seed()->run();
    $svc->settings()->update([
        'struttura' => ['ragione_sociale' => 'Poliambulatorio Rizzo (demo)', 'telefono' => '081 123 4567', 'indirizzo' => 'Via Roma 1', 'cap' => '80100', 'citta' => 'Napoli', 'provincia' => 'NA', 'partita_iva' => '01234567897', 'codice_fiscale' => '01234567897', 'email' => 'segreteria@demo.it', 'link_recensione' => 'https://g.page/r/esempio-demo/review'],
        'messaggi' => ['modalita' => 'test'],
    ]);
});

$pro = [];
$mk = static function (array $d) use ($svc) { return $svc->catalog()->saveProfessional($d); };
$pro['antonio'] = $mk(['tipo' => 'medico', 'nome' => 'Antonio', 'cognome' => 'Rizzo', 'specialita' => ['Fisiatria'], 'titolare' => true, 'colore' => '#E8761A', 'prenotabile_online' => true, 'percentuale_compenso' => 70]);
$pro['marco'] = $mk(['tipo' => 'fisioterapista', 'nome' => 'Marco', 'cognome' => 'Bianchi', 'colore' => '#2F7F9E', 'ore_contrattuali_settimana' => 36, 'percentuale_compenso' => 40]);
$pro['elena'] = $mk(['tipo' => 'fisioterapista', 'nome' => 'Elena', 'cognome' => 'Verdi', 'colore' => '#6B5BB5', 'ore_contrattuali_settimana' => 24]);
$pro['lucia'] = $mk(['tipo' => 'medico', 'nome' => 'Lucia', 'cognome' => 'Neri', 'specialita' => ['Cardiologia'], 'colore' => '#3E8E5A', 'prenotabile_online' => true]);

// Ogni nuova installazione parte con le regole Calendar dell'ultima versione.
(new \App\Domain\Calendar\CalendarProfile($svc))->apply();
$types = array_column($svc->store->all('therapy_types'), null, 'nome');
$svc->store->transaction(function () use ($svc, $pro) {
    foreach ([['titolare@demo.it', 'Antonio', 'Rizzo', 'titolare', $pro['antonio']['id']], ['segreteria@demo.it', 'Giulia', 'Esposito', 'segreteria', null],
        ['fisio@demo.it', 'Marco', 'Bianchi', 'fisioterapista', $pro['marco']['id']], ['medico@demo.it', 'Lucia', 'Neri', 'medico', $pro['lucia']['id']]] as [$email, $n, $c, $role, $proId]) {
        $svc->users()->create(['nome' => $n, 'cognome' => $c, 'email' => $email, 'role' => $role, 'password' => 'DemoPassword2026', 'professional_id' => $proId]);
    }
});

$names = [['Anna', 'Esposito', 'whatsapp'], ['Luca', 'Romano', 'whatsapp'], ['Maria', 'Russo', 'sms'], ['Paolo', 'Ferrara', 'whatsapp'], ['Giulia', 'Gallo', 'email'],
    ['Carlo', 'Conte', 'whatsapp'], ['Sara', 'De Luca', 'sms'], ['Marco', 'Mazza', 'whatsapp'], ['Elisa', 'Rizzo', 'whatsapp'], ['Franco', 'Greco', 'sms']];
$plans = [
    [['Terapia manuale', 6, 'marco'], ['Tecarterapia', 6, 'marco']], [['Tecarterapia', 8, 'marco']], [['Terapia manuale', 5, 'elena']], [['Laserterapia', 6, 'elena']],
    [['Terapia manuale', 4, 'marco']], [['Tecarterapia', 6, 'elena'], ['Terapia manuale', 6, 'elena']], [['Terapia manuale', 6, 'marco']], [['Tecarterapia', 5, 'marco']], [['Terapia manuale', 8, 'elena']], [['Tecarterapia', 4, 'marco']],
];
$avail = [
    [[1, '09:00', '12:00', 'alta'], [3, '09:00', '12:00', 'media']], [[2, '15:00', '19:00', 'alta'], [4, '15:00', '19:00', 'media']], [[1, '14:30', '18:00', 'alta'], [5, '09:00', '12:00', 'media']],
    [[3, '15:00', '19:00', 'alta']], [[2, '09:00', '12:00', 'alta'], [4, '09:00', '12:00', 'alta']], [[1, '16:00', '19:30', 'alta'], [3, '16:00', '19:30', 'alta'], [5, '16:00', '19:30', 'media']],
    [[2, '08:00', '10:00', 'alta'], [4, '08:00', '10:00', 'alta']], [[1, '08:00', '11:00', 'alta'], [2, '08:00', '11:00', 'media']], [[3, '09:00', '13:00', 'alta'], [5, '09:00', '13:00', 'alta']], [[4, '17:00', '20:00', 'alta']],
];
$episodes = [];
foreach ($names as $i => [$nome, $cognome, $canale]) {
    $p = $svc->patients()->create(['nome' => $nome, 'cognome' => $cognome, 'telefono' => '33312345' . sprintf('%02d', $i), 'email' => strtolower($nome . '.' . str_replace(' ', '', $cognome)) . '@esempio.it', 'canale_preferito' => $canale,
        'consensi' => ['whatsapp' => ['valore' => true], 'privacy' => ['valore' => true], 'marketing' => ['valore' => $i % 2 === 0]]], true);
    $lines = array_map(static fn ($l) => ['therapy_type_id' => $types[$l[0]]['id'], 'sedute_previste' => $l[1], 'professional_preferito_id' => $pro[$l[2]]['id'], 'frequenza_min' => 1, 'frequenza_max' => 3], $plans[$i]);
    $episodes[] = $svc->episodes()->save(['patient_id' => $p['id'], 'titolo' => ['Spalla destra', 'Lombalgia', 'Cervicale', 'Ginocchio', 'Caviglia', 'Anca', 'Gomito', 'Schiena', 'Postura', 'Spalla sinistra'][$i],
        'diagnosi' => 'Dato clinico di esempio', 'terapie' => $lines, 'disponibilita' => array_map(static fn ($a) => ['giorno' => $a[0], 'da' => $a[1], 'a' => $a[2], 'preferenza' => $a[3]], $avail[$i])], null, null);
}
$ids = array_column(array_slice($episodes, 0, 8), 'id');
$prop = $svc->planner()->propose($ids, Clock::today(), Clock::addDays(Clock::today(), 42), 'demo');
$svc->planner()->approve($prop['id'], 'demo');
foreach ([[0, 1, '10:00'], [3, 2, '16:00']] as [$epi, $dayOff, $time]) {
    $d = Clock::addDays(Clock::weekStart(Clock::today()), 7 + $dayOff);
    try {
        $svc->agenda()->create(['tipo' => 'visita', 'start' => "{$d}T$time:00", 'professional_id' => $pro['antonio']['id'], 'therapy_type_id' => $types['Visita fisiatrica']['id'],
            'patient_id' => $episodes[$epi]['patient_id']], true);
    } catch (Throwable $e) {
    }
}
// Fatturazione demo: tariffe, dati fiscali dei pazienti, sedute della settimana scorsa già eseguite
foreach (['Terapia manuale' => 40, 'Tecarterapia' => 30, 'Laserterapia' => 25, 'Visita fisiatrica' => 100] as $n => $eur) {
    if (isset($types[$n])) { $svc->store->patch('therapy_types', $types[$n]['id'], ['tariffa' => (float) $eur]); }
}
$cfs = ['SPSNNA80A41F839', 'RMNLCU75B12F839', 'RSSMRA82C50F839'];
foreach ($cfs as $k => $cf15) {
    $ep = $episodes[$k];
    $svc->store->patch('patients', $ep['patient_id'], ['codice_fiscale' => $cf15 . \App\Support\FiscalCode::checkChar($cf15), 'indirizzo' => 'Via Toledo ' . (10 + $k), 'cap' => '80134', 'citta' => 'Napoli', 'provincia' => 'NA']);
    $last = Clock::addDays(Clock::weekStart(Clock::today()), -7);
    foreach ([0, 2, 4] as $j => $off) {
        try {
            $a = $svc->agenda()->create(['tipo' => 'terapia', 'start' => Clock::addDays($last, $off) . 'T' . sprintf('%02d', 9 + $k) . ':00:00', 'professional_id' => $ep['therapies'][0]['professional_preferito_id'],
                'therapy_type_id' => $ep['therapies'][0]['therapy_type_id'], 'patient_id' => $ep['patient_id'], 'episode_id' => $ep['id'], 'line_id' => $ep['therapies'][0]['line_id']], true);
            $svc->agenda()->setStatus($a['id'], 'eseguito');
        } catch (Throwable $e) {
        }
    }
}
$r = $svc->weeklyReminder()->run();
$svc->gateway()->process();
echo "Demo pronta: {$prop['riepilogo']['sedute_nuove']} sedute pianificate, " . $r['accodati'] . " promemoria in coda (modalità prova: nessun messaggio esce davvero).\n";
echo "Utenti: titolare@demo.it, segreteria@demo.it, fisio@demo.it, medico@demo.it — password: DemoPassword2026\n";
