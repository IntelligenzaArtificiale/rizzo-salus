<?php
declare(strict_types=1);

namespace App\Http;

use App\Http\Controllers\{AssistantController, BillingController, CommsController, PlanningController, AgendaController, CatalogController, EpisodesController, PatientsController, AccountController, AuditController, AuthController, SettingsController, SystemController, UsersController};

/** Tabella unica delle rotte dell'API. */
final class Routes
{
    public static function build(): Router
    {
        $r = new Router();
        $r->add('/assistente/conferma',[AssistantController::class,'conferma'],'ai.assistente');
        $r->add('/assistente/scarta',[AssistantController::class,'scarta'],'ai.assistente');

        // Accesso e primo avvio (pubblici, con limiti di frequenza)
        $r->add('/auth/login', [AuthController::class, 'login'], null, true);
        $r->add('/auth/password-dimenticata', [AuthController::class, 'passwordDimenticata'], null, true);
        $r->add('/auth/nuova-password/verifica', [AuthController::class, 'nuovaPasswordVerifica'], null, true);
        $r->add('/auth/nuova-password', [AuthController::class, 'nuovaPassword'], null, true);
        $r->add('/primo-avvio/stato', [AuthController::class, 'primoAvvioStato'], null, true);
        $r->add('/primo-avvio/verifica', [AuthController::class, 'primoAvvioVerifica'], null, true);
        $r->add('/primo-avvio/crea', [AuthController::class, 'primoAvvioCrea'], null, true);
        $r->add('/auth/sessione', [AuthController::class, 'sessione']);
        $r->add('/auth/logout', [AuthController::class, 'logout']);

        // Account personale
        $r->add('/account/salva', [AccountController::class, 'salva']);
        $r->add('/account/password', [AccountController::class, 'password']);
        $r->add('/account/due-passi/avvia', [AccountController::class, 'duePassiAvvia']);
        $r->add('/account/due-passi/conferma', [AccountController::class, 'duePassiConferma']);
        $r->add('/account/due-passi/disattiva', [AccountController::class, 'duePassiDisattiva']);
        $r->add('/account/elimina', [AccountController::class, 'elimina']);

        // Utenti, impostazioni, registro (solo titolare o chi ha il permesso)
        foreach (['elenco', 'dettaglio', 'salva', 'stato', 'elimina', 'reinvita'] as $m) {
            $r->add("/utenti/$m", [UsersController::class, $m], 'impostazioni.gestisci');
        }
        $r->add('/utenti/azzera-due-passi', [UsersController::class, 'azzeraDuePassi'], 'impostazioni.gestisci');
        $r->add('/impostazioni/profilo-calendar', [SettingsController::class, 'profiloCalendar'], 'impostazioni.gestisci');
        $r->add('/impostazioni/leggi', [SettingsController::class, 'leggi']);
        $r->add('/impostazioni/salva', [SettingsController::class, 'salva'], 'impostazioni.gestisci');
        $r->add('/impostazioni/segreti-stato', [SettingsController::class, 'segretiStato'], 'impostazioni.gestisci');
        $r->add('/impostazioni/segreti-salva', [SettingsController::class, 'segretiSalva'], 'impostazioni.gestisci');
        $r->add('/audit/elenco', [AuditController::class, 'elenco'], 'audit.vedi');
        $r->add('/audit/verifica', [AuditController::class, 'verifica'], 'audit.vedi');

        $r->add("/demo/prepara-presentazione", [\App\Http\Controllers\DemoPresentationController::class,"prepare"], "impostazioni.gestisci");

        // Struttura: professionisti, terapie, risorse, gruppi
        $r->add('/formazione/elenco', [\App\Http\Controllers\TrainingController::class,'list']);
        $r->add('/formazione/salva', [\App\Http\Controllers\TrainingController::class,'save']);
        $r->add('/formazione/elimina', [\App\Http\Controllers\TrainingController::class,'remove']);
        $r->add('/formazione/scarica', [\App\Http\Controllers\TrainingController::class,'download'],null,false,'GET');
        $r->add('/catalogo/elenco', [CatalogController::class, 'elenco']);
        $r->add('/catalogo/professionista/salva', [CatalogController::class, 'professionistaSalva'], 'impostazioni.gestisci');
        $r->add('/catalogo/terapia/salva', [CatalogController::class, 'terapiaSalva'], 'impostazioni.gestisci');
        $r->add('/catalogo/risorsa/salva', [CatalogController::class, 'risorsaSalva'], 'impostazioni.gestisci');
        $r->add('/catalogo/gruppo/salva', [CatalogController::class, 'gruppoSalva'], 'agenda.modifica');

        // Pazienti e percorsi
        $r->add('/pazienti/cerca', [PatientsController::class, 'cerca']);
        $r->add('/pazienti/dettaglio', [PatientsController::class, 'dettaglio']);
        $r->add('/pazienti/appuntamenti', [PatientsController::class,'appuntamenti']);
        $r->add('/pazienti/salva', [PatientsController::class, 'salva']);
        $r->add('/pazienti/elimina', [PatientsController::class, 'elimina']);
        $r->add('/percorsi/dettaglio', [EpisodesController::class, 'dettaglio']);
        $r->add('/percorsi/salva', [EpisodesController::class, 'salva']);
        $r->add('/percorsi/nota-salva', [EpisodesController::class,'notaSalva']);
        $r->add('/percorsi/stato', [EpisodesController::class, 'stato']);
        $r->add('/percorsi/eccedenze', [EpisodesController::class, 'eccedenze']);

        foreach (['elenco','salva','modelli','link','scarica','modelloSalva','bozza'] as $m) {
            $path = strtolower((string) preg_replace('/(?<!^)[A-Z]/', '-$0', $m));
            $r->add("/documenti/$path", [\App\Http\Controllers\DocumentsController::class, $m]);
        }
        foreach (['pubblico','otp','accetta'] as $m) $r->add("/firma/$m", [\App\Http\Controllers\DocumentsController::class,$m], null,true);

        foreach (['catalogo','slot','richiedi','conferma','portaleOtp','portaleLogin','portale','disdetta','portaleDocumento'] as $m) {
            $path=strtolower((string) preg_replace('/(?<!^)[A-Z]/','-$0',$m));
            $r->add("/prenota/$path",[\App\Http\Controllers\BookingController::class,$m],null,true);
        }
        foreach (['finestre','finestraSalva','gestione','gestisci','attesaSalva'] as $m) {
            $path=strtolower((string) preg_replace('/(?<!^)[A-Z]/','-$0',$m));
            $r->add("/prenotazioni/$path",[\App\Http\Controllers\BookingController::class,$m]);
        }

        // Agenda
        foreach (['vista', 'crea', 'sposta', 'sostituisci', 'stato', 'annulla', 'ripristina', 'segnale', 'statistiche'] as $m) {
            $r->add("/agenda/$m", [AgendaController::class, $m]);
        }
        $r->add('/agenda/proposte-spostamento', [AgendaController::class, 'proposteSpostamento']);
        $r->add('/agenda/note', [\App\Http\Controllers\AgendaNotesController::class, 'list']);
        $r->add('/agenda/nota-salva', [\App\Http\Controllers\AgendaNotesController::class, 'save']);
        $r->add('/agenda/avvisi-ciclo', [AgendaController::class, 'avvisiCiclo']);
        $r->add('/agenda/gruppo-aggiungi', [AgendaController::class, 'aggiungiAlGruppo']);
        $r->add('/agenda/copia-anteprima', [AgendaController::class, 'copiaAnteprima']);
        $r->add('/agenda/copia-applica', [AgendaController::class, 'copiaApplica']);

        // Fatturazione
        foreach (['proponi', 'elenco', 'dettaglio'] as $m) {
            $r->add("/fatture/$m", [BillingController::class, $m], 'fatture.gestisci');
        }
        $r->add('/fatture/bozza-salva', [BillingController::class, 'bozzaSalva'], 'fatture.gestisci');
        $r->add('/fatture/bozza-elimina', [BillingController::class, 'bozzaElimina'], 'fatture.gestisci');
        $r->add('/fatture/emetti', [BillingController::class, 'emetti'], 'fatture.gestisci');
        $r->add('/fatture/paga', [BillingController::class, 'paga'], 'fatture.gestisci');
        $r->add('/fatture/nota-credito', [BillingController::class, 'notaCredito'], 'fatture.gestisci');
        $r->add('/fatture/sts-opposizione', [BillingController::class, 'opposizioneSts'], 'fatture.gestisci');

        foreach (['scarica-xml' => 'scaricaXml', 'scarica-pdf' => 'scaricaPdf', 'archivio' => 'archivioPeriodo', 'riepilogo-csv' => 'riepilogoCsv', 'sts-csv' => 'stsCsv'] as $path => $m) {
            $r->add("/fatture/$path", [BillingController::class, $m], 'fatture.gestisci');
        }
        $r->add('/compensi/calcola', [BillingController::class, 'compensoCalcola'], 'compensi.vedi_tutti');
        $r->add('/compensi/stato', [BillingController::class, 'compensoStato'], 'compensi.vedi_tutti');
        $r->add('/compensi/elenco', [BillingController::class, 'compensiElenco'], ['compensi.vedi_tutti', 'compensi.vedi_propri']);
        $r->add('/compensi/dettaglio', [BillingController::class, 'compensoDettaglio'], ['compensi.vedi_tutti', 'compensi.vedi_propri']);
        $r->add('/compensi/prospetto', [BillingController::class, 'compensoProspetto'], ['compensi.vedi_tutti', 'compensi.vedi_propri']);
        $r->add('/statistiche/economiche', [BillingController::class, 'statistiche'], ['statistiche.economiche', 'statistiche.economiche_proprie']);

        $r->add('/assistente/chiedi', [AssistantController::class, 'chiedi']);
        $r->add('/assistente/stato', [AssistantController::class, 'stato']);

        // Pianificazione intelligente
        foreach (['proponi', 'proposta', 'approva', 'scarta', 'fasce'] as $m) {
            $r->add("/pianificazione/$m", [PlanningController::class, $m], 'ai.pianificazione');
        }
        $r->add('/pianificazione/disponibilita-testo', [PlanningController::class, 'disponibilita'], ['ai.pianificazione', 'pazienti.anagrafica']);
        $r->add('/pianificazione/riepilogo', [PlanningController::class, 'riepilogo'], ['agenda.vedi_tutto']);
        $r->add('/pianificazione/stato-ai', [PlanningController::class, 'stato'], ['ai.pianificazione', 'impostazioni.gestisci']);

        // Comunicazioni
        $r->add('/pubblico/settimana', [CommsController::class, 'settimanaPubblica'], null, true);
        foreach (['messaggi', 'elabora', 'approva', 'annulla', 'riprova', 'promemoriaEsegui', 'revocaLink', 'variazioni', 'variazioniApprova', 'variazioneScarta', 'variazioneSpunta', 'variazioneModalita'] as $m) {
            $path = strtolower((string) preg_replace('/(?<!^)[A-Z]/', '-$0', $m));
            $r->add("/comunicazioni/$path", [CommsController::class, $m], 'messaggi.invia');
        }
        $r->add('/comunicazioni/modelli', [CommsController::class, 'modelli'], 'messaggi.invia');
        $r->add('/comunicazioni/modello-salva', [CommsController::class, 'modelloSalva'], 'impostazioni.gestisci');
        $r->add('/comunicazioni/anteprima', [CommsController::class, 'anteprima'], 'messaggi.invia');
        $r->add('/comunicazioni/invio-prova', [CommsController::class, 'invioProva'], 'impostazioni.gestisci');

        foreach (['stock','articolo','fornitore','movimento','personale','presenza','contratto','spese','spesa','personaleCsv','allegato'] as $m) {
            $path=strtolower((string) preg_replace('/(?<!^)[A-Z]/','-$0',$m));
            $r->add("/gestione/$path",[\App\Http\Controllers\ManagementController::class,$m]);
        }

        foreach (['eccezione','ricevuta','scarica','comunicazione'] as $m) $r->add("/compensi/$m",[\App\Http\Controllers\CompensationWorkflowController::class,$m]);

        foreach (['ricontatti','completato','campagna'] as $m) $r->add("/relazioni/$m",[\App\Http\Controllers\CareCommunicationsController::class,$m]);
        $r->add('/pubblico/conferma-visita',[\App\Http\Controllers\CareCommunicationsController::class,'confermaVisita'],null,true);

        foreach (['anteprima','valida','applica','acquistoAnteprima','acquistoApplica'] as $m) {
            $path=strtolower((string) preg_replace('/(?<!^)[A-Z]/','-$0',$m));
            $r->add("/importazione/$path",[\App\Http\Controllers\ImportController::class,$m]);
        }

        foreach (['elenco','prepara','approva','scarica','esitoSts'] as $m) $r->add("/pacchetti/$m",[\App\Http\Controllers\ReviewExportsController::class,$m]);

        foreach (['stato','aruba','verificaAruba'] as $m) {
            $path=strtolower((string) preg_replace('/(?<!^)[A-Z]/','-$0',$m));
            $r->add("/fiscale/$path",[\App\Http\Controllers\FiscalController::class,$m]);
        }

        // Sistema
        $r->add('/backup/elenco', [SystemController::class, 'backupElenco'], 'backup.gestisci');
        $r->add('/backup/salva', [SystemController::class, 'backupSalva'], 'backup.gestisci');
        $r->add('/backup/crea', [SystemController::class, 'backupCrea'], 'backup.gestisci');
        $r->add('/backup/ripristina', [SystemController::class, 'backupRipristina'], 'backup.gestisci');
        $r->add('/backup/scarica', [SystemController::class, 'backupScarica'], 'backup.gestisci', false, 'GET');
        $r->add('/attivita/elenco', [SystemController::class, 'attivitaElenco'], 'impostazioni.gestisci');
        $r->add('/attivita/attiva', [SystemController::class, 'attivitaAttiva'], 'impostazioni.gestisci');
        $r->add('/attivita/esegui', [SystemController::class, 'attivitaEsegui'], 'impostazioni.gestisci');
        $r->add('/cron/tick', [SystemController::class, 'cronTick'], null, true, '*');
        $r->add('/sistema/stato', [SystemController::class, 'stato'], 'impostazioni.gestisci');
        $r->add('/esportazione/crea', [SystemController::class, 'esportaCrea'], 'backup.gestisci');
        $r->add('/file/scarica', [SystemController::class, 'fileScarica'], null, false, 'GET');

        return $r;
    }
}
