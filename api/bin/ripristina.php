<?php
declare(strict_types=1);

/**
 * Ripristino da riga di comando:  php bin/ripristina.php <id-copia> <cartella-vuota>
 * Ripristina in una cartella NUOVA e vuota; poi si punta DATA_DIR a quella cartella.
 * Non sovrascrive mai i dati in uso.
 */
require __DIR__ . '/../vendor/autoload.php';

if ($argc < 3) {
    fwrite(STDERR, "Uso: php bin/ripristina.php <id-copia> <cartella-vuota>\n");
    exit(1);
}
$svc = App\Bootstrap::services();
if (!$svc->backup()->verify($argv[1])) {
    fwrite(STDERR, "La copia non supera il controllo di integrità: non ripristino.\n");
    exit(2);
}
$n = $svc->backup()->restore($argv[1], $argv[2]);
echo "Ripristinati $n file in {$argv[2]}.\nOra imposta DATA_DIR={$argv[2]} nel file .env.\n";
