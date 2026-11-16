<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

final class SmsSender extends ComposioSender
{
    public function channel(): string
    {
        return 'sms';
    }

    protected function fields(): array
    {
        return ['destinatario' => 'to', 'testo' => 'body', 'oggetto' => ''];
    }
}
