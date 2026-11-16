<?php
declare(strict_types=1);

namespace App\Core;

final class Ids
{
    public static function new(string $prefix): string
    {
        return $prefix . '_' . bin2hex(random_bytes(8));
    }
}
