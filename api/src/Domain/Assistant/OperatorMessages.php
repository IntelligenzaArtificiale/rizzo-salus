<?php
declare(strict_types=1);
namespace App\Domain\Assistant;
use App\Core\ApiError;

/** Richieste di chiarimento concrete; nessuna falsa conferma quando il piano non è valido. */
final class OperatorMessages
{
    public static function explain(ApiError $e): string
    {
        if ($e->errorCode === 'dati_operatore_mancanti') {
            $fields = array_map(static fn ($field) => $field === 'start' ? 'giorno e ora' : $field, $e->extra['campi']);
            return 'Mi indichi ' . implode(', ', $fields) . '?';
        }
        if ($e->errorCode === 'nome_mancante') return 'Qual è il nome del paziente?';
        if ($e->errorCode === 'cognome_mancante') return 'Qual è il cognome del paziente?';
        $prefix='Non ho salvato modifiche. ';
        $message=match($e->errorCode) {
            'riferimento_operatore_ambiguo','percorso_operatore_ambiguo'=>'Ci sono più corrispondenze. Indica il nome completo e, per un appuntamento, data e orario o il suo riferimento.',
            'riferimento_operatore_non_trovato'=>'Non trovo il riferimento indicato fra i dati accessibili. Specifica il nome completo o scegli il record dal gestionale.',
            'riferimento_operatore_mancante'=>'Indica quale record vuoi modificare, con il nome completo o il suo riferimento.',
            'conflitto'=>'L’orario richiesto ha un conflitto con disponibilità, paziente o risorse. Indica un altro orario o usa le proposte dell’agenda.',
            'avvisi'=>'L’inserimento richiede una verifica aggiuntiva delle regole dell’agenda. Apri il dettaglio per esaminare gli avvisi.',
            'scorta_insufficiente'=>'La quantità da scaricare supera la giacenza disponibile. Indica una quantità compatibile.',
            'possibile_duplicato'=>'Esiste già un paziente con dati simili. Indica il paziente esistente da aggiornare.',
            'presenza_sovrapposta'=>'Esiste già una presenza o assenza nello stesso intervallo. Specifica il record esistente da correggere.',
            'presenza_futura'=>'Le presenze effettive si registrano soltanto per oggi o per date passate.',
            'data_pagamento_mancante'=>'Per una spesa già pagata serve la data del pagamento. Indicala nella richiesta.',
            'incasso_parziale_non_supportato'=>'Il gestionale registra il saldo completo della fattura. Specifica la fattura e il metodo di pagamento del saldo.',
            'fattura_non_pagabile'=>'La fattura non è nello stato emessa e non può essere registrata come un nuovo incasso.',
            'non_autorizzato'=>'Il tuo ruolo non consente questa operazione.',
            'sedute_esaurite'=>'Il ciclo non ha sedute residue disponibili: verifica prima la prescrizione del percorso.',
            default=>isset($e->extra['campo'])?'Completa o correggi il campo «'.str_replace('_',' ',$e->extra['campo']).'» nella richiesta.':'Servono dati validi per questa operazione. Specifica il record, i dati obbligatori e gli eventuali riferimenti al calendario.',
        };
        return $prefix.$message;
    }
}
