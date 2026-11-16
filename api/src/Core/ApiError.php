<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;

/** Errore atteso del dominio: il codice decide il messaggio mostrato dal frontend. */
final class ApiError extends RuntimeException
{
    /** @param array<string,mixed> $extra campi aggiuntivi nella risposta (mai dati sensibili) */
    public function __construct(
        public readonly string $errorCode,
        public readonly int $status = 400,
        public readonly array $extra = [],
    ) {
        parent::__construct($errorCode);
    }

    public static function forbidden(string $code = 'non_autorizzato'): self
    {
        return new self($code, 403);
    }

    public static function notFound(string $code = 'non_trovato'): self
    {
        return new self($code, 404);
    }

    public static function conflict(string $code, array $extra = []): self
    {
        return new self($code, 409, $extra);
    }
}
