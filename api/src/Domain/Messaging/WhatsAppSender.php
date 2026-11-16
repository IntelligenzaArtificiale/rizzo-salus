<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

final class WhatsAppSender extends ComposioSender
{
    public function channel(): string
    {
        return 'whatsapp';
    }

    protected function fields(): array
    {
        return ['destinatario' => 'to_number', 'testo' => 'text', 'oggetto' => ''];
    }
}
