<?php
declare(strict_types=1);

namespace App\Domain\Billing;

/** Importi in centesimi interi: nessun errore di arrotondamento nei totali. */
final class Money
{
    public static function cents(float|int|string $euro): int
    {
        return (int) round(((float) $euro) * 100);
    }

    public static function fmt(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    public static function human(int $cents): string
    {
        return number_format($cents / 100, 2, ',', '.') . ' €';
    }
}
