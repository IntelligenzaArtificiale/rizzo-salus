# Agenda, directory e Formazione — 17 novembre 2026

Revisione richiesta per la presentazione: agenda a tutta altezza, strumenti sovrapposti, settimana compatta, schede paziente operative, ricerche estese, select leggibili, allegati curati e Formazione nel menu Amministrazione. L’originale gestionale-demo non è modificato.

## Uso

- Agenda: la settimana compatta mostra i cinque giorni insieme. In Controlli agenda restano viste per categoria, prestazione o professionista, filtri, copia e appunti. Il pannello è sovrapposto, con schede Vista e filtri / Appunti, chiusura esterna ed Escape. Una sola area scorrevole per il calendario; l’orario è fisso a sinistra. A tutto schermo include anche i controlli.
- Pazienti: identità, percorsi attivi e prossimo appuntamento reale nei successivi 90 giorni; riepiloghi filtrati attraverso l’elenco pazienti consentito al ruolo. Nessuna diagnosi nella directory.
- Formazione: il titolare assegna titolo, testo, ruoli e stato pubblicato/bozza; può caricare PDF con testo, Word .docx e TXT, rivedere l’estrazione, modificare e rimuovere. Gli operatori leggono soltanto le procedure pubblicate per il loro ruolo. Scarico autorizzato del documento originale; testo e file cifrati su disco. Le scansioni senza testo richiedono trascrizione; nessun OCR simulato.
- Estrazione eseguita nel browser con PDF.js 5.4.149 e Mammoth 1.11.0 caricati da CDN versionati. I documenti non sono inviati a un servizio di conversione. Il caricamento delle librerie richiede rete: in caso di errore la pagina lo segnala e si può incollare il testo.
- Assistente: selezione di estratti pertinenti delle procedure visibili, massimo otto blocchi di testo, con titolo fonte. La risposta deve citare il documento e dichiarare informazioni mancanti. I documenti sono dati, non istruzioni di sistema: non autorizzano scritture o superamento dei permessi.
- Operatore: aggiunte prenotazione interna di visita e lista d’attesa, oltre alle azioni preesistenti. Ogni piano conserva anteprima, conferma, transazione, scadenza e permessi. Letture autorizzate anche di compensi registrati, presenze, spese e attese. La prenotazione interna non è il flusso pubblico con verifica OTP.
- Allegati: limite unico 50 MiB; importazioni e ricevute aggiornate. Rimangono controlli su formato/contenuto, righe e dimensione decompressa. Gli aiuti tecnici superflui sui form sono rimossi; gli errori necessari restano visibili. Su hosting, configurazione PHP limitata alla cartella del progetto con memoria 512M e richieste fino a 80M.

Gli esempi di palestra e piscina sono aggiuntivi e idempotenti. L’endpoint autenticato di preparazione è utilizzabile soltanto dal titolare in APP_ENV=demo: non resetta o sposta appuntamenti esistenti. L’opzione esplicita abilita l’assistente a medico e fisioterapista conservando le altre autorizzazioni; il titolare può gestire i permessi nelle impostazioni.

## Collaudo

Build, controlli statici e regressioni di dominio sono eseguiti prima del rilascio. Test UI su dati copiati in .runtime/qa/formazione-ui e server 8082: tre larghezze, due temi, un solo scorrimento, pannello e tastiera, upload TXT/PDF/DOCX con estrazione CDN, salvataggio e scarico, schede pazienti, ricerche e impostazioni. Prove reali API AI per paziente, modifica, agenda/spostamento, prenotazione, attesa e interrogazioni sui moduli e sulla formazione. [Report finale](verifica-formazione-2026-11-17.json): 58 controlli UI, 22 controlli AI con chiamate reali, 16 verifiche sui ruoli, 6 verifiche aggiuntive e 25 controlli online. Limite da 50 MiB provato sia in locale via HTTP sia sul server; il file temporaneo remoto è stato rimosso.

Le verifiche non sono certificazione di accessibilità o conformità. Servizi fiscali e SMS/email restano in prova. Nessuna email o fattura reale inviata dal collaudo.

## Riferimenti delle librerie

- [PDF.js, documentazione ufficiale](https://github.com/mozilla/pdf.js).
- [Mammoth, API browser ed estrazione del testo](https://github.com/mwilliamson/mammoth.js#extracting-raw-text).
