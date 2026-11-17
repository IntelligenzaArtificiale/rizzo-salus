# Navigazione agenda e schermate amministrative

Selettore della vista tra le due frecce; rimosso il ritorno alla settimana corrente e la ripetizione delle date sotto Agenda. Magazzino ora distingue articoli, fornitori e movimenti; inserimento/modifica articolo e fornitore, registrazione movimento e import acquisto hanno URL dedicati. Personale separa registrazioni e contratto; spese separa lista/risultati dal form. Separati anche preparazione documenti consulenti, procedure di formazione e disponibilità/attese. La fatturazione disponeva già di pagine dedicate; compensi conservati come richiesto.

I moduli usano le API e i permessi esistenti. I link di modifica mantengono riferimenti e revisioni dopo ricaricamento. Il documento scorre soltanto nell’area principale dell’app: contenimento applicato alla superficie privata, senza impedire lo scorrimento delle pagine pubbliche. Gli elementi della pagina non si comprimono lasciando fuoriuscire il contenuto.

## Moduli del preventivo v3

Nessun modulo interamente assente. Base, M4 personale/compensi e M5 magazzino/controllo economico sono disponibili nei flussi locali. M6 AI è attivo con chiamate reali e operazioni da confermare; Formazione e alcune operazioni sono successive al testo della v3 e vanno esplicitate nell’offerta finale.

M1: connettori Aruba/TS implementati ma non collaudati sugli account della struttura; credenziali, abilitazioni e configurazione fiscale necessari. Storni/rimborsi TS non sono automatizzati. M2: flussi di messaggistica e ricontatti disponibili, trasporto reale SMS/email da attivare e provare. WhatsApp precompilato con invio umano corrisponde alla v3. M3: prenotazioni, attese, portale e flusso OTP implementati; necessarie attivazione SMS, finestre reali e documenti approvati. Non presentare un test locale del flusso come collaudo dei servizi esterni.

Listino, orari, percentuali, scorte e documenti reali sono configurazioni iniziali, non nuovi moduli da sviluppare. L’importazione anagrafica strutturata iniziale è inclusa; una migrazione completa dello storico richiede campioni degli export ed è fuori dal totale della v3.

## Verifiche e rilascio

Build TypeScript/Vite e regole UI riuscite. Test browser su archivio QA separato, con creazione articolo/fornitore, caricamento della modifica da URL e ricaricamento; prove di sola lettura online, responsive e scorrimenti. Nessuna modifica ai dati operativi tramite i test online. Rilascio dei soli asset e HTML, con backup del precedente ingresso e frontend; nessun codice PHP o dato remoto sovrascritto. [Report](verifica-gestione-2026-11-17.json).
