# Revisione UI e AI operatore - 17 novembre 2026

Richieste: eliminare i link blu dalle azioni; migliorare agenda e dettagli; raccogliere area, viste, filtri, navigazione, professionisti e appunti in un solo pannello richiudibile; sostituire i disclosure nativi con un componente applicativo migliore. L'assistente deve preparare e applicare operazioni su agenda, pazienti, incassi, uscite, personale e magazzino.

Si lavora soltanto nella copia gestionale-rizzo-boilerplate, conservando l'originale. Backup del codice prima delle modifiche in `.runtime/revisions/prima-operatore-ui-20261117.tar.gz`. Nessun reset di dati locali o remoti.

Criteri di accettazione:

- [x] Azioni con Button/buttonVariants del boilerplate, gerarchia primaria/secondaria/distruttiva, focus e disabilitazione durante invio.
- [x] Un solo pannello Controlli agenda; CollapsiblePanel uniforme, Mostra/Nascondi e più/meno, tastiera, nessun submit implicito, campi conservati da chiuso.
- [x] Colonne leggibili, intestazioni complete, meno colonne vuote con opzione per mostrarle, temi e mobile senza overflow della pagina.
- [x] AI con funzione strutturata strict, selezione da lista chiusa e campi ammessi. Richieste ambigue/incomplete vengono chiarite; nessun endpoint o codice scelto liberamente dal modello.
- [x] Anteprima validata dalle operazioni esistenti in una transazione annullata; piano cifrato, legato all'utente e valido 15 minuti.
- [x] Conferma esplicita applica l'intero piano in transazione con controlli correnti e revisioni; retry senza duplicati, scarto senza effetti e nessuna modifica parziale su errore.
- [x] Permessi identici ai controller reali. Nessun invio di SMS/email/fatture, emissione fiscale, diagnosi, consenso o gestione credenziali/ruoli da operatore.
- [x] Modifiche paziente preservano i campi non richiesti; incasso legato a fattura emessa con saldo intero; carichi/scarichi, presenze/assenze e cataloghi con validazione del gestionale.
- [x] Test su dati QA isolati; una prova AI reale per confermare la catena richiesta → piano → conferma → record.

Direzione grafica: Framed sheet, seed 717705802, conservando palette, Inter e componenti richiesti. Identità data dai nomi reali dei cataloghi, colori delle terapie e calendario come elemento centrale; niente nuova libreria o cambio dei token vendor. Il disclosure nuovo compone Button ed è richiesto espressamente dall'utente.

## Esito

Implementati e verificati i criteri precedenti. L’operatore dispone di 15 azioni: creazione/spostamento/esito/annullamento appuntamenti, aggiunta al gruppo, creazione/modifica pazienti, spese, saldo di fatture emesse, presenze/assenze, monte ore, professionisti, articoli, carichi/scarichi e fornitori. I dati non richiesti vengono conservati. Le sedute vengono collegate al percorso aperto quando univoco e non si possono superare quelle prescritte. Anche le revisioni del percorso invalidano le proposte vecchie.

Due prove reali OpenAI in QA: piano di cinque operazioni (paziente, spesa, articolo, carico, collaboratore), poi prenotazione di un appuntamento. Provati anteprima senza record, click Conferma e applica, lettura dei nuovi record e collegamento al dettaglio. I primi tentativi hanno evidenziato due ambiguità del modello, corrette prima della consegna: data pagamento per una spesa pagata oggi e distinzione fra categoria manuale e tipo appuntamento. Le validazioni avevano rifiutato i piani senza applicare modifiche.

43 controlli operatore, 107 regressioni, 50 Calendar, 10 contatori e 23 URL su PHP 8.2; 148 file PHP senza errori di sintassi. Browser: 57 verifiche UI, 11 piano multioperazione reale, 5 appuntamento reale, 5 protezione endpoint e 5 schermo intero/pannello. Build e regole UI passate. Lint con 59 warning preesistenti, nessun errore; warning Vite bundle >500 kB. [Report tecnico](operatore-verifica-2026-11-17.json).

Scorrimento orizzontale soltanto dentro il calendario, richiesto dalle sue sottocolonne; gli appunti sono distinti dagli appuntamenti anche nel conteggio della lista. Copia, legenda e schermo intero sono nello stesso pannello; il comando per uscire resta disponibile durante lo schermo intero. L'azione principale Nuovo appuntamento resta immediatamente accessibile.

Le prove non sono un'approvazione dell'utente o una certificazione di accessibilità. Nessun servizio fiscale o di messaggistica attivato. La revisione è servita in locale; nessuna modifica alla cartella remota o ai suoi dati.

## Revisione visiva finale

ROUND 2
Seen in one second: agenda clinica leggibile, con un solo pannello dei controlli e un'azione principale evidente.
Idea (one sentence): lasciare il tempo e gli appuntamenti al centro, raccogliendo gli strumenti e rendendo ogni scrittura AI visibile e verificabile.
Live thing: calendario, filtri e piani operativi collegati alle API reali.
Layout words by section: agenda=calendario e pannello unico / dettaglio=informazioni e bottoni di azione / operatore=conversazione, riepilogo, conferma.
Scores: design 7.8 · usability 8.4 · creativity 7.0 · content 8.5 → overall 7.89 (autovalutazione visiva, non revisione indipendente).
Caps applied: nessuno; conservazione esplicita dei componenti, font e palette del boilerplate.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Nelle immagini iniziali fornite dall'utente le azioni del dettaglio sono link blu. Corrette con buttonVariants e icone, con annullamento come bottone secondario a testo rosso.
2. Nella precedente agenda controlli e appunti sottraggono spazio al calendario. Le schermate agenda-*-chiusa mostrano ora un unico pannello; quelle aperte mantengono tutti i controlli e i loro valori.
3. Nella prima revisione le colonne da 40 px troncano i nomi, il disclosure ha un'ombra troppo ampia e gli appunti hanno un titolo duplicato. Minimo 112 px, colonne vuote opzionali, superficie senza ombra e singola intestazione.

L'ispettore finale segnala 0 FAIL con le tre eccezioni di geometria/kit documentate. Resta il warning automatico sul colore dei dati, che sottostima i piccoli indicatori delle categorie; i colori parametrizzati delle terapie restano visibili e conservati. Nessuna immagine di repertorio introdotta.
