<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Context;

/** Professionisti, tipi di terapia, risorse e gruppi: lettura per tutti gli utenti dell'app, modifica per chi gestisce la struttura. */
final class CatalogController
{
    public function elenco(Context $c): array
    {
        $s = $c->svc->store;
        $pro = array_map(static fn ($p) => array_diff_key($p, $c->can('compensi.vedi_tutti') ? ['note_interne'=>1] : ['note_interne'=>1,'percentuale_compenso'=>1,'percentuali_tipo'=>1,'ore_contrattuali_settimana'=>1,'email'=>1,'telefono'=>1]), $s->all('professionals'));
        return [
            'professionisti' => array_values($pro),
            'terapie' => array_values($s->all('therapy_types')),
            'risorse' => array_values($s->all('resources')),
            'gruppi' => array_values($s->all('groups')),
        ];
    }

    public function professionistaSalva(Context $c): array
    {
        $r = $c->svc->catalog()->saveProfessional($c->body());
        $c->svc->audit()->log('professionista.salva', 'professionals', $r['id'], null, ['nome' => $r['nome'] ?? null, 'cognome' => $r['cognome'] ?? null]);
        return $r;
    }

    public function terapiaSalva(Context $c): array
    {
        $r = $c->svc->catalog()->saveTherapyType($c->body());
        $c->svc->audit()->log('terapia.salva', 'therapy_types', $r['id'], null, ['nome' => $r['nome'] ?? null]);
        return $r;
    }

    public function risorsaSalva(Context $c): array
    {
        $r = $c->svc->catalog()->saveResource($c->body());
        $c->svc->audit()->log('risorsa.salva', 'resources', $r['id'], null, ['nome' => $r['nome'] ?? null]);
        return $r;
    }

    public function gruppoSalva(Context $c): array
    {
        $r = $c->svc->agenda()->saveGroup($c->body());
        $c->svc->audit()->log('gruppo.salva', 'groups', $r['id'], null, ['nome' => $r['nome'] ?? null]);
        return $r;
    }
}
