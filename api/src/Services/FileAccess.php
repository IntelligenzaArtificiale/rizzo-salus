<?php
declare(strict_types=1);

namespace App\Services;

use App\Http\Context;
use App\Store\Store;

/** Regole di lettura dei file per tipo. Un tipo sconosciuto è negato: si apre solo ciò che è previsto. */
final class FileAccess
{
    public static function allowed(Store $store, Context $c, array $meta): bool
    {
        return false;
    }
}
