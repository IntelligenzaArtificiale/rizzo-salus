<?php
declare(strict_types=1);

/** Copia manuale:  php bin/backup.php */
require __DIR__ . '/../vendor/autoload.php';

$svc = App\Bootstrap::services();
$b = $svc->backup()->create('manuale');
$svc->backup()->rotate();
echo "Creata {$b['id']} (" . number_format($b['dimensione'] / 1024, 1) . " KB)\n";
