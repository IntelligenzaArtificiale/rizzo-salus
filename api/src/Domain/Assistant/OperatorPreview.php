<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
/** Uscita intenzionale dalla transazione di anteprima: lo Store scarta tutte le scritture. */
final class OperatorPreview extends \RuntimeException
{
    public function __construct(public readonly array $items, public readonly array $versions) { parent::__construct('anteprima_operatore'); }
}
