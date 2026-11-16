<?php
declare(strict_types=1);
/** Controlli prima di installare o avviare la demo; non legge dati o credenziali. */
$errors = [];
if (PHP_VERSION_ID < 80300) $errors[] = 'Richiesto PHP 8.3 o successivo.';
foreach (['sodium', 'mbstring', 'dom', 'gd', 'zip'] as $extension) {
    if (!extension_loaded($extension)) $errors[] = 'Estensione PHP mancante: ' . $extension;
}
$port = getenv('PORT') ?: '8081';
if (!ctype_digit($port) || (int) $port < 1 || (int) $port > 65535) $errors[] = 'PORT deve essere un numero tra 1 e 65535.';
if ($errors) {
    fwrite(STDERR, implode(PHP_EOL, $errors) . PHP_EOL . 'Consulta README.md per installare i requisiti.' . PHP_EOL);
    exit(1);
}
echo 'Runtime PHP pronto: ' . PHP_VERSION . PHP_EOL;
