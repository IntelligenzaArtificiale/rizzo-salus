<?php
declare(strict_types=1);

/**
 * Prima installazione:  php bin/install.php [email-del-titolare]
 * Crea le cartelle, verifica la configurazione e stampa il link monouso per creare il titolare.
 */
require __DIR__ . '/../vendor/autoload.php';

use App\Core\Env;

Env::load();
$errors = [];
foreach (['DATA_DIR', 'BACKUP_DIR', 'DATA_ENCRYPTION_KEY', 'CRON_TOKEN', 'APP_URL'] as $k) {
    if (Env::get($k) === '') {
        $errors[] = "$k manca nel file .env";
    }
}
if (version_compare(PHP_VERSION, '8.3.0', '<')) {
    $errors[] = 'serve PHP 8.3 o successivo';
}
foreach (['sodium', 'mbstring', 'zip', 'dom', 'gd'] as $ext) {
    if (!extension_loaded($ext)) {
        $errors[] = "manca l'estensione PHP $ext";
    }
}
if ($errors) {
    fwrite(STDERR, "Installazione non possibile:\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}
$svc = App\Bootstrap::services();
@mkdir(Env::get('BACKUP_DIR'), 0700, true);
$svc->store->transaction(fn () => null);
if (!$svc->auth()->firstRunNeeded()) {
    echo "Il titolare esiste già: installazione già completata.\n";
    exit(0);
}
echo "Cartelle pronte.\nApri questo link (valido 24 ore, una sola volta) per creare il titolare:\n\n  " . $svc->auth()->issueFirstRunLink($argv[1] ?? (Env::get('OWNER_EMAIL') ?: null)) . "\n";
