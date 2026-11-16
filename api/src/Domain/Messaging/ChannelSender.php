<?php
declare(strict_types=1);

namespace App\Domain\Messaging;

/** Un invio su un canale. Il dominio parla solo con questa interfaccia: cambiare fornitore non lo tocca. */
interface ChannelSender
{
    public function channel(): string;

    /**
     * @param array<string,mixed> $message record di `messages` (to, subject, body, template…)
     * @return array{ok:bool,provider_id:?string,error:?string,permanent:bool,cost_eur:?float}
     */
    public function send(array $message): array;
}
