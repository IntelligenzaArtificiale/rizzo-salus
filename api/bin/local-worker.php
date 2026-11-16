<?php
declare(strict_types=1);
/** Attivatore locale subordinato al server: nessuna installazione nel cron del computer. */
require dirname(__DIR__).'/vendor/autoload.php';
$parent=(int)($argv[1]??0);
if($parent<2)exit(2);
while(is_dir('/proc/'.$parent)){
    try{\App\Bootstrap::services()->scheduler()->tick();}
    catch(\Throwable $e){\App\Bootstrap::logger()($e);}
    for($i=0;$i<6&&is_dir('/proc/'.$parent);$i++)sleep(10);
}
