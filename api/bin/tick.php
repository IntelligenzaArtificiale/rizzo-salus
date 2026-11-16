<?php
declare(strict_types=1);

// Cron ogni 5 minuti (alternativa all'endpoint /api/cron/tick):
//   crontab:  ogni 5 minuti  php /percorso/api/bin/tick.php
require __DIR__ . '/../vendor/autoload.php';

$svc = App\Bootstrap::services();
$out = $svc->scheduler()->tick();
foreach ($out as $id => $r) {
    fwrite(STDOUT, date('c') . " $id {$r['esito']}\n");
}
