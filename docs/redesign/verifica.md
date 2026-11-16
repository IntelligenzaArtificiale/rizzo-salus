# Verifica iniziale della nuova interfaccia · 9 novembre 2026

Questa è la fotografia del primo rilascio, precedente alla seconda revisione UX. Le prove attuali sono in [revisione-ux.md](revisione-ux.md). I conteggi seguenti non attestano le schermate ora modificate.

## Esito funzionale

- npm ci, build TypeScript/Vite, lint e regole UI eseguiti. Build e controlli statici riusciti; lint senza errori. Restano warning React/Fast Refresh, hook e vendor, riportati integralmente in verifica/lint.txt. Vite segnala il bundle principale oltre 500 kB; nessuna misura di performance è dichiarata.
- 178 controlli registrati in [report.json](verifica/report.json), con 152 schermate distinte; nessuna eccezione JavaScript.
- Autenticazione reale e mantenimento sessione dopo ricaricamento per i quattro account demo. CSRF e cookie effettivi del backend.
- Agenda e presenze; anteprima copia con motivi, copia senza righe applicabili disabilitata quando il ciclo è esaurito; nessuna forzatura delle regole del backend.
- Creazione/modifica paziente, avviso di uscita, pianificazione con generazione esplicita e approvazione; profilo e impostazioni, ruoli preservando l'immutabilità del titolare.
- Bozza creata anche dal form con selezione delle prestazioni, emissione, incasso, nota di credito verificata sul server, download PDF e XML con verifica delle intestazioni binarie. I dati fiscali mancanti della demo bloccano l'emissione con un messaggio utile: i test hanno usato solo fixture sulla copia.
- Fisioterapista: ricerca limitata ai propri pazienti, dati clinici nascosti, fatturazione vietata dal server e dall'interfaccia. Segreteria: fatture disponibili senza richiedere le statistiche economiche non consentite.
- Errore di rete riprodotto nel browser, pulsante Riprova e successivo recupero riusciti. Settimana pubblica consultata senza autenticazione; configurazione privata non servita dal router.

I controlli sono stati eseguiti in più passaggi durante le correzioni, non sono una suite unitaria del motore PHP. Le prime prove hanno richiesto correzioni di sincronizzazione del collaudo e dati fiscali completi per le fixture. Report e schermate raccolgono i flussi verificati; non dichiarano copertura di ogni endpoint backend.

## Verifica visiva

Desktop 1440×1000 e telefono 390×844, chiaro e scuro. Controllo automatico dell'overflow della pagina su tutte le schermate del report. Tabelle e calendario mantengono lo scorrimento interno previsto dal catalogo. Esaminati visivamente accesso, agenda, pazienti, pianificazione, impostazioni/ruoli, statistiche, comunicazioni e fatture. Le copie della build finale pulita sono i file `finale-*`.

Superfici: AuthLayout per accesso, AppLayout per area riservata e SiteLayout per pagina pubblica. Campi, bottoni, tabelle, schede, card, feedback e temi provengono dal boilerplate. Il calendario è l'unica composizione di dominio non fornita dal catalogo, documentata in eccezioni.md. Intervalli di 15 minuti resi leggibili, orari di inizio/fine e legenda professionisti conservati.

La griglia di impostazioni, il selettore mobile delle schede e gli stati vuoti/errore rimangono quelli del boilerplate. Nessuna approvazione utente o certificazione di accessibilità è stata simulata; lettori di schermo non provati.

## Integrità e isolamento

[Confronto byte per byte](integrita.json): 96 file backend confrontati, nessuna differenza. Nessuna modifica ai componenti vendor rispetto allo ZIP fornito. File sorgente dell'originale invariati, server 8080 rimasto sullo stesso processo.

La copia usa localhost:8081, dati e backup propri, nessun collegamento scrivente alla demo originale. Al termine ripristinati i dati iniziali della copia: 10 pazienti, nessuna fattura di collaudo, nessuna modifica di permessi o nome lasciata dai test. Il vecchio script scripts/verify-clinic.py conserva i selettori della prima UI ed è bloccato per default. Usare scripts/verify-clinic-ux.py soltanto sul server QA isolato 8082.

TokenSave inizializzato e sincronizzato nella nuova directory, con esclusioni di runtime, credenziali, dati, backup, vendor e build. Stato e ricerca di ClinicProvider verificati tramite MCP. Nessun grafo copiato dal template.

## Limiti concreti

Assistente esterno non interrogato: la chiave non è presente, come nella demo di partenza. Invii reali e servizi esterni non provati; modalità test preservata. Nessun deploy remoto. Prenotazioni, documenti, personale, magazzino, importazione e schermate compensi non diventano disponibili per effetto del redesign: resta lo stato originale dei motori, chiarito nella Mappa.

Le vecchie guide e gli esempi del boilerplate sono conservati come riferimento, ma le rotte attive sono quelle di src/App.tsx e le sole API chiamate sono quelle del gestionale.
