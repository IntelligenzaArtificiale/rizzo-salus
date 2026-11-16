<?php
declare(strict_types=1);

namespace App\Auth;

/**
 * Permessi granulari. La matrice ruolo × permesso sta nelle impostazioni (modificabile dal titolare);
 * ogni utente può avere eccezioni (permessi_extra: aggiunti/tolti). Il titolare ha sempre tutto.
 */
final class Permissions
{
    /** chiave => [gruppo, etichetta] */
    public const ALL = [
        'agenda.vedi_tutto' => ['Agenda', 'Vedere l’agenda di tutti'],
        'agenda.vedi_propria' => ['Agenda', 'Vedere la propria agenda'],
        'agenda.modifica' => ['Agenda', 'Creare, spostare e cancellare appuntamenti'],
        'agenda.segna_eseguita' => ['Agenda', 'Segnare una seduta come eseguita o assente'],
        'pazienti.anagrafica' => ['Pazienti', 'Vedere e modificare l’anagrafica'],
        'pazienti.essenziali' => ['Pazienti', 'Vedere i dati essenziali dei propri pazienti'],
        'pazienti.tutti' => ['Pazienti', 'Vedere tutti i pazienti, non solo i propri'],
        'pazienti.clinica' => ['Pazienti', 'Vedere diagnosi, referti e allegati clinici'],
        'pazienti.note_terapeutiche' => ['Pazienti', 'Vedere e scrivere le note terapeutiche'],
        'documenti.referti_crea' => ['Documenti', 'Scrivere referti e diagnosi'],
        'documenti.moduli' => ['Documenti', 'Usare i modelli e la modulistica'],
        'ai.assistente' => ['Assistente','Usare l’assistente'],
        'ai.pianificazione' => ['Pianificazione', 'Usare la pianificazione intelligente'],
        'messaggi.invia' => ['Messaggi', 'Inviare messaggi e campagne'],
        'prenotazioni.liste_attesa' => ['Prenotazioni', 'Gestire prenotazioni online e liste d’attesa'],
        'prenotazioni.liste_attesa_proprie' => ['Prenotazioni', 'Vedere le proprie liste d’attesa'],
        'fatture.gestisci' => ['Fatture', 'Emettere e gestire le fatture'],
        'compensi.vedi_tutti' => ['Fatture', 'Vedere i compensi di tutti'],
        'compensi.vedi_propri' => ['Fatture', 'Vedere i propri compensi'],
        'statistiche.economiche' => ['Statistiche', 'Vedere le statistiche economiche'],
        'statistiche.economiche_proprie' => ['Statistiche', 'Vedere le proprie statistiche economiche'],
        'personale.presenze' => ['Personale', 'Gestire presenze e assenze di tutti'],
        'personale.propria_scheda' => ['Personale', 'Vedere la propria scheda presenze'],
        'magazzino.gestisci' => ['Magazzino', 'Gestire il magazzino'],
        'magazzino.consumi' => ['Magazzino', 'Registrare i consumi'],
        'impostazioni.gestisci' => ['Struttura', 'Cambiare impostazioni, utenti e ruoli'],
        'audit.vedi' => ['Struttura', 'Consultare il registro delle attività'],
        'backup.gestisci' => ['Struttura', 'Gestire backup ed esportazioni'],
    ];

    /** @return array<string,list<string>> */
    public static function defaultRoles(): array
    {
        $all = array_keys(self::ALL);
        return [
            'titolare' => $all,
            'segreteria' => array_values(array_diff($all,['impostazioni.gestisci','audit.vedi','backup.gestisci'])),
            'medico' => [
                'agenda.vedi_propria', 'pazienti.anagrafica', 'pazienti.clinica', 'pazienti.note_terapeutiche',
                'documenti.referti_crea', 'documenti.moduli', 'prenotazioni.liste_attesa_proprie', 'compensi.vedi_propri',
                'statistiche.economiche_proprie', 'personale.propria_scheda',
            ],
            'fisioterapista' => [
                'agenda.vedi_propria', 'pazienti.essenziali', 'pazienti.note_terapeutiche',
                'documenti.moduli', 'personale.propria_scheda', 'magazzino.consumi',
            ],
            'amministrazione' => ['fatture.gestisci', 'compensi.vedi_tutti', 'statistiche.economiche'],
        ];
    }

    public const ROLES = ['titolare', 'segreteria', 'medico', 'fisioterapista', 'amministrazione'];

    /**
     * @param array<string,list<string>> $matrix matrice delle impostazioni
     * @param array{aggiunti?:list<string>,tolti?:list<string>} $extra
     */
    public static function effective(string $role, array $matrix, array $extra = []): array
    {
        if ($role === 'titolare') {
            return array_keys(self::ALL);
        }
        $base = $matrix[$role] ?? [];
        $set = array_flip($base);
        foreach ($extra['aggiunti'] ?? [] as $p) {
            $set[$p] = true;
        }
        foreach ($extra['tolti'] ?? [] as $p) {
            unset($set[$p]);
        }
        return array_values(array_intersect(array_keys(self::ALL), array_keys($set)));
    }
}
