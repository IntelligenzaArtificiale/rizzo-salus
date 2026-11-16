<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

final class EmailSender extends ComposioSender
{
    public function channel(): string
    {
        return 'email';
    }

    protected function fields(): array
    {
        return ['destinatario' => 'recipient_email', 'testo' => 'body', 'oggetto' => 'subject'];
    }
}
