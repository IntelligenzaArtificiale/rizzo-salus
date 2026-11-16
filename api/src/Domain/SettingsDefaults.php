<?php
declare(strict_types=1);

namespace App\Domain;

use App\Auth\Permissions;

/** Valori predefiniti prudenti. Nulla di fisso nel codice: tutto si cambia da Impostazioni. */
final class SettingsDefaults
{
    /** @return array<string,mixed> */
    public static function all(): array
    {
        return [
            'struttura' => [
                'ragione_sociale' => '', 'partita_iva' => '', 'codice_fiscale' => '', 'indirizzo' => '', 'cap' => '', 'citta' => '', 'provincia' => '',
                'telefono' => '', 'email' => '', 'pec' => '', 'sito' => '', 'logo' => null, 'link_recensione' => '',
                'regime_fiscale' => 'RF01', 'rea' => '', 'iban' => '',
            ],
            // Orari di apertura per giorno ISO (1 lunedì … 7 domenica): fasce "HH:MM"-"HH:MM".
            'orari' => \App\Domain\Calendar\CalendarProfile::HOURS,
            'chiusure' => [], // [{da, a, motivo}]
            'festivita_nazionali' => true,
            'agenda' => [
                'profilo_specifiche'=>'', 'professionisti_riabilitazione'=>[],
                'gruppi'=>['max_standard'=>5,'max_complesso'=>4,'max_neurologici'=>1],
                'passo_minuti' => 15, 'durata_default' => 15, 'durata_gruppo' => 60, 'mostra_domenica' => false,
                'colori' => [
                    'strumentale' => '#2F7F9E', 'manuale' => '#6B5BB5', 'palestra_gruppo' => '#0369A1', 'piscina_gruppo' => '#1F9CB0',
                    'strumentale_fissa'=>'#A16207', 'prima'=>'#15803D', 'ultima'=>'#B91C1C', 'visita' => '#7C3AED', 'altro' => '#7A8591', 'nota' => '#F5D547',
                ],
                'colore_oggi' => '#2563EB',
                'conferma_spostamenti' => true,
            ],
            'messaggi' => [
                'modalita' => 'test', // test | live
                'canale_predefinito' => 'sms',
                'fallback_sms' => true, 'destinatario_prova_telefono'=>'', 'destinatario_prova_email'=>'',
                'silenzio' => ['da' => '21:00', 'a' => '08:00'],
                'promemoria' => ['attivo' => true, 'giorno' => 5, 'ora' => '13:00', 'finestra_recupero_ore' => 18, 'contenuto' => 'link_riassunto'],
                'variazioni' => ['modalita' => 'manuale', 'attesa_minuti' => 10], // Sempre contatto telefonico prima dell'avviso.
                'followup' => ['attivo' => true, 'giorni_default' => 15, 'recensione_dopo_giorni' => 3, 'recensione_mesi_tra_richieste' => 12],
                'visite' => ['ora_richiesta'=>'12:00','ora_riepilogo_medico'=>'20:00'],
                'scadenze' => ['attivo' => true],
                'tetto_mensile_eur' => 100.0,
                'costo_stimato' => ['whatsapp' => 0.05, 'sms' => 0.07, 'email' => 0.0],
                'campagne' => ['scaglione' => 20, 'pausa_secondi' => 60],
                'composio' => ['whatsapp' => ['slug' => '', 'account' => '', 'campi'=>['destinatario'=>'to','testo'=>'body','oggetto'=>''], 'argomenti_fissi'=>[]], 'sms' => ['slug' => '', 'account' => '', 'campi'=>['destinatario'=>'to','testo'=>'body','oggetto'=>''], 'argomenti_fissi'=>[]], 'email' => ['slug' => '', 'account' => '', 'campi'=>['destinatario'=>'recipient_email','testo'=>'body','oggetto'=>'subject'], 'argomenti_fissi'=>[], 'campo_allegati'=>'', 'allegato_nome'=>'filename', 'allegato_contenuto'=>'content', 'allegato_mime'=>'content_type']],
            ],
            'ai' => ['attiva' => true, 'modello' => '', 'timeout_secondi' => 20, 'tetto_mensile_eur' => 5.0, 'tetto_giornaliero_eur' => 5.0, 'tempo_max_ms' => 2000, 'spostamenti_profondita' => 2, 'costo_per_1k_token_eur' => 0.002],
            'pianificazione' => ['no_giorni_consecutivi' => false, 'max_al_giorno' => 2, 'sedute_contigue' => true],
            'fatturazione' => [
                'sezionale' => 'A', 'bollo_soglia' => 77.47, 'bollo_importo' => 2.00, 'bollo_a_carico' => 'paziente',
                'bollo_modalita' => 'da_configurare', 'bollo_autorizzazione' => '',
                'natura_esenzione' => 'N4', 'riferimento_normativo' => 'Esente IVA ex art. 10 c.1 n.18 DPR 633/72',
                'commercialista_email' => '', 'invio_commercialista' => ['attivo' => false, 'giorno' => 1, 'ora' => '08:00'],
                'trasmissione_sdi' => false, 'sts_attivo' => false,
            ],
            'compensi' => ['prepara_mensile'=>true,'giorno'=>1,'ora'=>'08:30'],
            'personale' => ['consulente_email' => '', 'invio_mensile' => ['attivo' => false, 'giorno' => 1, 'ora' => '09:00'], 'preparazione_conta' => false, 'preparazione_minuti' => 0],
            'prenotazioni' => ['attive' => false, 'conferma' => 'automatica', 'mostra_professionista' => true, 'mostra_prezzi' => false, 'informativa' => '', 'domande' => [], 'otp_scadenza_minuti' => 10, 'anticipo_minimo_ore' => 12, 'orizzonte_giorni' => 60, 'passo_minuti' => 20, 'frame_ancestors' => ''],
            'integrazioni' => [
                'sms' => ['fornitore' => 'composio'],
                'aruba' => ['ambiente' => 'demo', 'username' => '', 'attiva' => false],
                'sts' => ['ambiente' => 'test', 'codice_regione' => '', 'codice_asl' => '', 'codice_struttura' => '', 'cf_proprietario'=>'', 'certificato_cifratura'=>'', 'username' => '', 'collaudo_completato'=>false, 'attiva' => false],
            ],
            'attesa' => ['modalita' => 'semi', 'max_messaggi_per_slot' => 3, 'attesa_risposta_ore' => 12, 'specialita_escluse' => []],
            'documenti' => ['consensi_obbligatori' => ['privacy', 'trattamento'], 'tipo_firma' => 'otp_semplice', 'otp_scadenza_minuti' => 10, 'link_scadenza_giorni' => 14],
            'sicurezza' => [
                'sessione_minuti' => 60, 'max_tentativi' => 5, 'blocco_minuti' => 15,
                'due_fattori_obbligatorio' => ['titolare' => false, 'segreteria' => false],
            ],
            'backup' => ['attivo' => true, 'ora' => '02:30', 'giornalieri' => 7, 'settimanali' => 4, 'mensili' => 12],
            'link_paziente' => ['scadenza_giorni_dopo_settimana' => 7],
            'ruoli' => Permissions::defaultRoles(),
        ];
    }
}
