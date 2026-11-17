<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Context;
use App\Support\Validator as V;

/** AI operatore: dati consentiti al ruolo, proposte validate e conferma separata. */
final class AssistantController
{
    public function conferma(Context $c): array
    {
        if (!V::bool($c->body(),'conferma')) throw new \App\Core\ApiError('conferma_operatore_richiesta',422);
        return (new \App\Domain\Assistant\OperatorPlans())->confirm($c,(string)V::id($c->body(),'id','opa',true));
    }
    public function scarta(Context $c): array
    {
        return (new \App\Domain\Assistant\OperatorPlans())->discard($c,(string)V::id($c->body(),'id','opa',true));
    }
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
