<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Auth\Permissions;
use App\Core\ApiError;
use App\Http\Context;
use App\Support\Validator as V;

final class SettingsController
{
    /** Sezioni leggibili da chiunque sia collegato: servono a disegnare agenda e moduli. */
    private const PUBLIC_SECTIONS = ['struttura', 'orari', 'chiusure', 'festivita_nazionali', 'agenda', 'pianificazione'];
    /** Dati della struttura mostrati nel sito pubblico (mai email contabili, IBAN, parametri AI). */
    private const PUBLIC_STRUTTURA = ['ragione_sociale', 'indirizzo', 'cap', 'citta', 'provincia', 'telefono', 'email', 'sito', 'logo', 'link_recensione'];

    public function profiloCalendar(\App\Http\Context $c):array {$c->need('impostazioni.gestisci');return (new \App\Domain\Calendar\CalendarProfile($c->svc))->apply();}

    public function leggi(Context $c): array
    {
        $all = $c->svc->settings()->all();
        $full = $c->can('impostazioni.gestisci');
        $out = $full ? $all : array_intersect_key($all, array_flip(self::PUBLIC_SECTIONS));
        if (!$full) {
            $out['struttura'] = array_intersect_key($all['struttura'], array_flip(self::PUBLIC_STRUTTURA));
        }
        return [
            'valori' => $out, 'revision' => $c->svc->settings()->revision(),
            'permessi_utente' => $c->perms,
            'catalogo_permessi' => $full ? Permissions::ALL : new \stdClass(),
        ];
    }

    public function segretiStato(Context $c): array
    {
        if ($c->role() !== 'titolare') throw ApiError::forbidden();
        return $c->svc->secrets()->status();
    }

    public function segretiSalva(Context $c): array
    {
        if ($c->role() !== 'titolare') throw ApiError::forbidden();
        $out = $c->svc->secrets()->save($c->body()['dati'] ?? []);
        $c->svc->audit()->log('integrazioni.credenziali', 'settings', 'segreti', null, ['campi'=>array_keys($c->body()['dati'] ?? [])]);
        return $out;
    }

    public function salva(Context $c): array
    {
        $b = $c->body();
        $patch = $b['dati'] ?? null;
        if (!is_array($patch)) {
            throw new ApiError('dati_mancanti', 422);
        }
        $before = $c->svc->settings()->all();
        $after = $c->svc->settings()->update($patch, V::int($b, 'revision'));
        foreach (array_keys($patch) as $section) {
            $c->svc->audit()->log('impostazioni_modificate', 'settings', $section, [$section => $before[$section] ?? null], [$section => $after[$section] ?? null]);
        }
        return ['valori' => $after, 'revision' => $c->svc->settings()->revision()];
    }
}
