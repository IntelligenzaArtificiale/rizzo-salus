<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Context;
use App\Support\Validator as V;

/** Assistente AI: risponde sui dati che il ruolo può vedere; nessun dato personale lascia il server. */
final class AssistantController
{
    public function chiedi(Context $c): array
    {
        $c->need('ai.assistente');
        $b = $c->body();
        $hist = array_values(array_filter(V::arr($b, 'storia'), 'is_array'));
        $r = $c->svc->assistant()->ask($c, (string) V::str($b, 'domanda', true, 600), $hist);
        if (!$c->can('impostazioni.gestisci')) {
            unset($r['inviato_al_fornitore']);
        }
        return $r;
    }

    public function stato(Context $c): array
    {
        $c->need('ai.assistente');
        return ['configurata' => $c->svc->ai()->enabled()];
    }
}
