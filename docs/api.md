# API attive del Poliambulatorio Rizzo

Il backend reale è in api/src/Http/Routes.php. Il client attivo è src/clinic/api.ts; tutte le richieste sono POST JSON con credenziali incluse e X-CSRF-Token, salvo download pubblici previsti dal PHP. Risposte {ok,data} oppure {ok:false,error,...}. Nessun fallback mock.

Sessione e catalogo sono gestiti da ClinicContext: login, sessione verificata al ricaricamento, logout, catalogo professionisti/terapie. Il token CSRF è nella sessionStorage dell'host localhost e viene rimosso all'uscita; autorizzazioni sempre verificate dal PHP.

I payload per pazienti, agenda, pianificazione, comunicazioni, fatturazione, impostazioni e account sono nei rispettivi moduli src/clinic. Revision, duplicati, transizioni di stato, importi e consensi rimangono contratti originali.

Per l'elenco estratto dal client: docs/inventario.md. Per i dettagli e gli adattamenti osservati: docs/redesign/contratti.md. Le API non attivate dell'esempio Richieste del boilerplate non vengono chiamate.

Download binari via POST autenticato per fatture PDF/XML, archivio e Sistema TS. La settimana pubblica usa /pubblico/settimana con token; il router locale reindirizza /s/<token> alla relativa pagina React. Il backend costruisce i nuovi link con APP_URL della copia. I testi dei promemoria già presenti sono una fotografia della demo originale.
