<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
use App\Http\Context;
use App\Core\ApiError;

/** Lista chiusa di azioni e campi; il modello non sceglie endpoint, permessi o codice. */
final class OperatorDefinitions
{
    public const ACTIONS = [
        'appuntamento_crea' => ['Crea appuntamento', ['agenda.modifica'], 'paziente professionista prestazione start durata_min tipo titolo nota'],
        'prenotazione_crea' => ['Prenota visita medica', ['agenda.modifica'], 'paziente professionista prestazione start durata_min nota'],
        'attesa_aggiungi' => ['Aggiungi alla lista di attesa', ['prenotazioni.liste_attesa'], 'paziente professionista prestazione nota'],
        'appuntamento_sposta' => ['Sposta appuntamento', ['agenda.modifica'], 'appuntamento start professionista'],
        'appuntamento_stato' => ['Aggiorna esito appuntamento', ['agenda.segna_eseguita','agenda.modifica'], 'appuntamento stato paziente'],
        'appuntamento_annulla' => ['Annulla appuntamento', ['agenda.modifica'], 'appuntamento paziente'],
        'gruppo_aggiungi' => ['Aggiungi paziente al gruppo', ['agenda.modifica'], 'appuntamento paziente'],
        'paziente_crea' => ['Crea paziente', ['pazienti.anagrafica'], 'nome cognome telefono email data_nascita codice_fiscale indirizzo cap citta provincia sesso canale_preferito note_amministrative'],
        'paziente_modifica' => ['Modifica paziente', ['pazienti.anagrafica'], 'paziente nome cognome telefono email data_nascita codice_fiscale indirizzo cap citta provincia sesso canale_preferito note_amministrative medico_curante'],
        'spesa_salva' => ['Registra uscita o costo', ['statistiche.economiche'], 'spesa descrizione date importo categoria pagata data_pagamento scadenza ricorrenza nota fornitore'],
        'fattura_incasso' => ['Registra incasso fattura', ['fatture.gestisci'], 'fattura metodo data importo'],
        'presenza_salva' => ['Registra presenza o assenza', ['personale.presenze'], 'presenza professionista date tipo da a pausa_minuti nota'],
        'contratto_salva' => ['Aggiorna monte ore', ['personale.presenze'], 'professionista mese ore nota'],
        'professionista_salva' => ['Crea o modifica personale', ['impostazioni.gestisci'], 'professionista nome cognome tipo email telefono ore_contrattuali_settimana percentuale_compenso specialita attivo'],
        'articolo_salva' => ['Crea o modifica articolo', ['magazzino.gestisci'], 'articolo nome codice unita soglia_minima costo fornitore attivo'],
        'magazzino_movimento' => ['Registra carico o scarico', ['magazzino.gestisci','magazzino.consumi'], 'articolo quantita date motivo'],
        'fornitore_salva' => ['Crea o modifica fornitore', ['magazzino.gestisci'], 'fornitore nome partita_iva email telefono'],
    ];

    public static function allowed(Context $c): array
    {
        return array_filter(self::ACTIONS, static fn ($a) => count(array_intersect($a[1], $c->perms)) > 0);
    }

    public static function data(Context $c, array $action): array
    {
        $type = $action['tipo'] ?? '';
        if (!is_string($type)) throw new ApiError('azione_ai_non_consentita',422);
        $def = self::ACTIONS[$type] ?? throw new ApiError('azione_ai_non_consentita', 422);
        $c->need(...$def[1]);
        $input = $action['dati'] ?? [];
        if (!is_array($input) || count($input) > 25) throw new ApiError('azione_ai_non_valida', 422);
        $out = [];
        foreach ($input as $entry) {
            if (!is_array($entry)) throw new ApiError('azione_ai_non_valida',422);
            $key = $entry['campo'] ?? '';
            $value = $entry['valore'] ?? null;
            if (!in_array($key, explode(' ', $def[2]), true) || array_key_exists($key, $out) || !is_string($value) || mb_strlen($value) > 2000) {
                throw new ApiError('campo_operatore_non_valido', 422, ['campo' => $key]);
            }
            $out[$key] = trim($value);
        }
        return $out;
    }

    public static function tools(Context $c): array
    {
        $allowed = self::allowed($c);
        if (!$allowed) return [];
        $description = "Prepara un piano da mostrare e confermare, senza applicarlo. Campi ammessi per tipo:\n";
        foreach ($allowed as $key => $def) $description .= "$key: {$def[2]}\n";
        $description .= 'Riferimenti con ID forniti o nomi completi univoci. Date YYYY-MM-DD, start YYYY-MM-DDTHH:MM:SS. '
            . 'Numeri decimali con punto, booleani true/false. Non inventare dati obbligatori; chiedi quelli mancanti. '
            . 'Entrate finanziarie: fattura_incasso di fattura emessa, solo saldo intero e metodo esplicito; niente emissioni fiscali. '
            . 'Uscite: spesa_salva. Entrata/uscita personale: presenza_salva con da/a e data. '
            . 'Per una spesa pagata=true è obbligatorio indicare data_pagamento; se l’utente dice pagata oggi usa la data odierna. '
            . 'Nuovo paziente: nome e cognome; nuovo professionista: nome, cognome e tipo (medico/fisioterapista/segreteria/amministrazione/collaboratore). '
            . 'presenza_salva tipo=presenza/ferie/malattia/permesso/assenza; fattura_incasso metodo=contanti/bonifico/carta/bancomat/assegno. '
            . 'Magazzino: quantita positiva carico, negativa scarico; nuovo articolo richiede nome e unita, movimento richiede motivo. '
            . 'Per modifica identifica prima il record: paziente, professionista, articolo, spesa, presenza o fornitore. '
            . 'Per una prenotazione interna di visita usa prenotazione_crea; per una lista di attesa usa attesa_aggiungi. Non generare OTP né prenotazioni pubbliche. '
            . 'Per appuntamento_crea ometti tipo: lo ricava il gestionale dalla prestazione; usa tipo=nota soltanto per appunti, con titolo e start. '
            . 'Non modificare diagnosi, consensi, password o permessi. Non inviare messaggi. Massimo 8 azioni.';
        $object = static fn ($properties) => ['type' => 'object', 'properties' => $properties, 'required' => array_keys($properties), 'additionalProperties' => false];
        $schema = $object(['risposta' => ['type' => 'string'], 'azioni' => ['type' => 'array', 'items' => $object([
            'tipo' => ['type' => 'string', 'enum' => array_keys($allowed)],
            'dati' => ['type' => 'array', 'items' => $object(['campo' => ['type' => 'string'], 'valore' => ['type' => 'string']])],
        ])]]);
        return [['type' => 'function', 'function' => ['name' => 'prepara_operazioni', 'description' => $description, 'strict' => true, 'parameters' => $schema]]];
    }
}
