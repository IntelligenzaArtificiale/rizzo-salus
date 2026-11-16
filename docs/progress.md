# Completamento dalla riunione Rizzo Salus - 09 novembre 2026

Sorgente: trascrizione Google Meet 10:24-12:48 fornita dall'utente.
Destinazione: gestionale-rizzo-boilerplate, localhost:8081. Originale 8080 sola lettura.
Richiesta corrente autorizza l'estensione del backend della copia, oltre il redesign.

## Criteri di accettazione
- [x] A. Agenda: fisioterapia/poliambulatorio, viste 1/2 giorni/settimana, filtri terapia/famiglia/professionista, oggi blu, creazione/spostamento/gruppi/drag con conflitti, copia selettiva.
- [x] B. Paziente: disponibilità anagrafica, medico curante e specialista, assicurazione, allergie accessibili secondo ruolo, percorsi e righe terapia modificabili con frequenza/intervallo, conteggi eseguite/assenze/residue.
- [x] C. Pianificatore: suggerimenti bilanciati nei vincoli, spostamenti proposti, approvazione selettiva e manuale, nessuna modifica autonoma, stop al numero di sedute.
- [x] D. Documenti: file cifrati paziente/percorso, referto, modelli precompilati stampabili, upload consensi cartacei, presa visione+OTP e audit, blocco rilascio appuntamenti per consensi mancanti.
- [x] E. Prenotazioni: solo visite mediche e prima visita Antonio, disponibilità medico, OTP, no doppioni, conferma automatica, domande generiche configurabili, attesa per servizio/professionista con avviso segreteria.
- [x] F. Portale paziente: accesso verificato, propri appuntamenti/storico/documenti, richiesta disdetta da gestire dalla segreteria senza cancellazione autonoma.
- [x] G. Comunicazioni: SMS venerdì13 con riassunto+link, silenzio21-08, variazioni dopo telefonata, conferme visite e riepilogo medico, followup15/40gg e recensione separata2-3gg via WhatsApp manuale, campagne solo consenzienti.
- [x] H. Amministrazione: compensi per professionista/prestazione/materiali, calcolato/approvato/liquidato, contabile allegata e messaggio importo, niente bonifici automatici; entrate/uscite/F24/abbonamenti e margini; fatture solo eseguite, bollo al paziente, export e invio dopo revisione.
- [x] I. Personale: contratti, presenze/assenze/giustificativi, ore programmate/effettive senza preparazione, riepilogo mensile per consulente e invio approvato.
- [x] J. Magazzino: articoli/fornitori/soglie, carichi e scarichi manuali/per terapia, import fatture acquisto con riconoscimento e revisione prima di applicare, nessun doppio carico.
- [x] K. Migrazione e configurazione: import CSV/XLSX con anteprima/doppioni/controlli, cataloghi/orari/risorse/listini, decisioni finali server e procedure scritte; integrazioni esterne configurabili senza false conferme.
- [x] L. Collaudo: API e UI, ruoli e privacy, dati di test isolati, desktop/mobile/chiaro-scuro, build/lint, originali/vendor invariati, docs e grafo.

## Decisioni prevalenti della call
- 12:22-23: solo titolare e segreteria creano/spostano (supera ipotesi iniziale di autonomia medici).
- 12:23: pianificazione solo proposta, approvazione umana anche parziale.
- 12:12-16: SMS iniziali, venerdì13, silenzio21-08, variazioni dopo contatto telefonico; le variazioni future prima del promemoria non richiedono avviso immediato.
- 12:17-21: followup15gg, eccezioni40gg da configurare; recensione dopo ulteriori2-3gg; WhatsApp precompilato con invio umano.
- 12:27-30: visite online confermate automaticamente, non terapie; settimanalmente solo sedute eseguite; nessun pacchetto prepagato.
- 12:30-33: consensi con OTP e lettura registrata oppure carta; è una prova di accettazione semplice, non una qualificazione legale automatica.
- 12:33: preparazione esclusa dalle ore lavorate.

## Stato finale
Implementazione locale e collaudo completati nella copia 8081. L'utente ha confermato che materiali e credenziali saranno inseriti successivamente: tutti i pannelli di configurazione sono disponibili al titolare. SMS/email in prova; connettori fiscali disattivati fino a configurazione e verifiche reali.

- 107 controlli di dominio, 180 verifiche UI, 8 prove interattive aggiuntive; 120 schermate desktop/mobile chiaro/scuro. Nessuna eccezione JS o console inattesa.
- Build, regole UI e sintassi di 125 file PHP passate. Lint senza errori, 59 warning documentati; bundle oltre 500 kB segnalato da Vite.
- Originale: 85 sorgenti invariati e processo 8080 preservato. Vendor: 38 file identici allo ZIP.
- Riavviata soltanto la nuova copia con attivatore periodico locale subordinato al server; quattro accessi e permessi ricontrollati.
- Catalogo e grafo rigenerati. Backup iniziale privato in `.runtime/revisions/prima-riunione-20261109-140310.tar.gz`.
- [Verifica criterio per criterio e limiti](riunione-2026-11-09/verifica.md), [guida titolare](riunione-2026-11-09/guida-titolare.md).

Le spunte attestano implementazione e prove locali, non l'attivazione dei fornitori o una certificazione fiscale/legale. Le fatture sanitarie a persone fisiche sono bloccate verso SdI; il flusso TS è separato, con revisione, protocollo ed esiti. Storni/rimborsi TS richiedono gestione fiscale specifica e sono segnalati dal pacchetto. Mancano accessi reali, modelli approvati, listino, turni e dati fiscali verificati: nessun invio reale effettuato.

## Aggiornamento Calendar · 11 novembre 2026

Integrato il PDF Calendar del 10 novembre nella sola copia; il nuovo limite 5/4/1 prevale sul precedente massimo 6 della call. Chiarimento utente: ignorare il vecchio messaggio lungo sugli incassi. I 12 file di fatturazione sono rimasti invariati.

- [x] Orari e profili confermati, durate, gruppi clinici, risorse multiple, terapie fisse e minuti iniziali di operatore; nessun turno inventato per Chiara o venerdì Antonio.
- [x] Viste e sottocolonne, schermo intero e settimana corrente, note non occupanti anche sabato, colori/segnali individuali e promemoria interni.
- [x] Proposte e spostamenti con preferenze/vincoli, controlli server condivisi, revisione umana e copia senza cicli esauriti.
- [x] Statistiche per periodo: persone, prestazioni, minuti operatore e presenze distinte.
- [x] Configurazione parametrica, profilo idempotente applicato alla copia conservando 10 pazienti/60 appuntamenti/4 utenti; avvio 8081. Originale e vendor invariati.
- [x] 107 regressioni, 50 controlli Calendar e 61 controlli browser, build/lint/regole UI e 136 sintassi PHP. Zero errori statici; 59 warning lint e bundle >500 kB documentati. Catalogo/grafo aggiornati.

Dettagli e limiti in [verifica Calendar](specifiche-2026-11-11/verifica.md), [guida](specifiche-2026-11-11/guida.md), [checklist sintetica](specifiche-2026-11-11/checklist-bloccanti.md). Nessun servizio esterno attivato; nessun invio reale. Backup iniziale privato: `.runtime/revisions/prima-specifiche-20261111.tar.gz`.

## Pubblicazione sorgenti e avvio da clone - 16 novembre 2026

Repository richiesto: https://github.com/IntelligenzaArtificiale/rizzo-salus. Il README è la guida principale: prerequisiti, clone, avvio, credenziali dimostrative, porte, sviluppo e risoluzione problemi. `avvia.sh` controlla il runtime, installa dipendenze mancanti, rigenera la build e conserva l'archivio; `avvia.bat` prepara la stessa demo. Il generatore applica il profilo Calendar aggiornato alle sole nuove installazioni. Nessun reset dell'originale o dei dati locali esistenti.

Verificata installazione separata dai soli file destinati a GitHub: Composer, npm, build e seed; accessi di tutti i quattro ruoli e calendario, conservazione delle chiavi e dei pazienti al riavvio; 50 controlli Calendar e 107 regressioni superati. Il controllo dei file destinati al repository non ha rilevato configurazioni private o segreti. Dati, backup, runtime, dipendenze, build e documenti commerciali riservati esclusi. [Report di avvio](avvio-locale-verificato.json).

## Assistente operativo - 16 novembre 2026

Attivato nella sola demo locale su richiesta dell'utente con chiamate reali a OpenAI e modello gpt-4.1-mini. La credenziale è conservata nell'archivio cifrato locale escluso da Git; nessuna chiave nei sorgenti o nel browser. Configurazione e sostituzione restano disponibili al titolare. I limiti di consumo esistenti sono conservati e si basano su stime applicative, non sul saldo effettivo del fornitore.

Corretto il riepilogo dell'agenda: note, annullati e assenti sono distinti dagli appuntamenti attivi. Il modello riceve contatori deterministici per oggi, domani e settimana, calcolati sui dati consentiti al ruolo. Il prompt dichiara i dati mancanti e il carattere consultivo; la UI chiarisce il trattamento dei codici paziente e del testo libero. Nascosti i controlli dimostrativi senza funzione del componente StreamingText; vendor invariato.

Verificati risposta reale per titolare e segreteria, conteggio di 8 appuntamenti senza i due appunti, conversazione su orari/apertura e rifiuto al ruolo non autorizzato. Superati 10 controlli dedicati, 107 regressioni, build e regole UI. Lint senza errori, 59 warning preesistenti. [Report della verifica](assistente-verifica-2026-11-16.json). Nessuna attivazione dei servizi SMS o fiscali.
