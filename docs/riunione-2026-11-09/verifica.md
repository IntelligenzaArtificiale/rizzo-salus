# Verifica del completamento dalla riunione · 9 novembre 2026

Destinazione: `gestionale-rizzo-boilerplate`, http://localhost:8081. L'originale su 127.0.0.1:8080 non è stato modificato. Le verifiche funzionali scrivono esclusivamente in store nuovi sotto `.runtime/qa`; quelle browser usano il server QA 8082 con dati e backup separati. Nessun invio esterno è stato eseguito.

## Esiti

- **107 controlli di dominio passati**, `scripts/test-call-domain.php` e `scripts/tests-call/`: OTP e tentativi persistenti, consensi documentati, prenotazioni concorrenti anche da due processi con lock reale, portale e disdette, limiti dei cicli, gruppi e cancellazioni individuali, selezione e copia idempotenti, scorte, presenze, spese, compensi e contabile, IVA/XML/XSD/PDF, importazioni e date Excel, protezioni XML, ruoli, segreti cifrati, ricontatti e consensi alla consegna, silenzio, conferme visite, limite AI, diario e referto locale.
- **180 controlli browser passati**, **120 schermate** 1440×1000 e 390×844, chiaro/scuro, in `browser/report.json`. Accessi, pagine operative e impostazioni, visibilità delle azioni, parametri salvati, disponibilità paziente, creazione percorso, generazione e accettazione documento con OTP, divieti per ruoli e utente pubblico. Nessun overflow dell'intera pagina, bottone annidato nelle pagine controllate, eccezione JavaScript o errore console inatteso.
- **8 prove interattive aggiuntive**, `browser/flows-report.json`: prenotazione pubblica e accesso portale con OTP, blocco calendario senza documenti, rilascio dopo documenti cartacei fittizi, richiesta disdetta senza cancellazione, trascinamento come revisione senza scrittura, selettore impostazioni leggibile su desktop.
- Build TypeScript/Vite riuscita. Lint: **0 errori**, 59 warning React/hook/Fast Refresh e vendor, conservati in `lint.txt`; nessuna modifica ai componenti vendor per eliminarli. Vite avvisa del bundle principale circa 687 kB: non si dichiara un risultato di performance.
- Sintassi PHP: **125 file** `api/src` e `api/bin`, zero errori. Regole UI statiche riuscite. Nuovi moduli applicativi TSX sotto 400 righe; file PHP storici già grandi non ristrutturati senza necessità.
- [Integrità](integrita.json): **85 sorgenti originali invariati**, **38 file vendor identici allo ZIP** Beautiful UI. Il backend della nuova copia è invece esteso esplicitamente su richiesta dell'utente: i confronti di backend identico nei vecchi report di redesign sono storici.
- Catalogo rigenerato e grafo TokenSave sincronizzato, escludendo dati, runtime, build, credenziali e vendor. Avvio locale e accessi dei quattro ruoli verificati in `avvio.json`.

## Criteri ed evidenze

| Criterio | Implementazione verificata |
|---|---|
| A. Agenda | Separazione aree e filtri; viste giorno/due giorni/settimana/elenco; form creazione/spostamento; drag apre revisione; copia selettiva, gruppi ed esiti individuali. Screenshot agenda e prove dominio/concorrenza/storico. |
| B. Paziente | Disponibilità, riferimenti e assicurazione; avvertenze essenziali e diario secondo ruolo; prescrizioni con vincoli e protezione dello storico; eseguite/assenze/da eseguire/da pianificare distinte. UI creazione percorso e prove dominio. |
| C. Pianificazione | Proposte individuali e gruppi bilanciati, disponibilità e intervalli, selezione e modifica prima dell'approvazione, consenso esplicito agli spostamenti. Nessuna mutazione alla sola proposta e limite ciclo anche per modifiche manuali. |
| D. Documenti | Modelli/versioni, PDF cifrati, allegati, accettazione OTP con evidenze e replay bloccato, cartaceo; calendario non rilasciato con sole spunte. Flusso browser firma completo e prove dominio. |
| E. Prenotazioni | Solo visite e finestre pubblicate, attese per prestazione/professionista, avvisi interni con candidati. Conferma OTP e controllo posto atomico. Prova UI e due processi simultanei sullo stesso slot. |
| F. Portale | Telefono/nascita/OTP, CF per ambiguità, solo dati personali e documenti condivisi; disdetta come richiesta idempotente senza cancellazione. Prova browser completa. |
| G. Comunicazioni | Parametri venerdì13 e silenzio, variazioni dopo telefonata, conferme visite e riepilogo medico, ricontatto 15/40 e recensione dopo contatto, WhatsApp manuale e campagne con consenso. Prove temporali locali; provider reali non interrogati. |
| H. Amministrazione | Prestazioni eseguite, IVA e bollo, compensi dopo deduzione materiali, stati e contabile, una sola uscita; spese/ricorrenze/margini; documenti per consulenti revisionati; Aruba e TS configurabili. XML e trasporti con risposte controllate, nessun invio reale. |
| I. Personale | Presenze, pause, assenze future, giustificativi e contratti; programmate/effettive/contrattuali, preparazione esclusa, esportazioni. Prove dominio e pagine desktop/mobile. |
| J. Magazzino | Articoli/fornitori/soglie, ledger, consumo per eseguita e riaccredito, import acquisti con revisione e idempotenza. Prove stock/XML e UI con righe/azioni reali. |
| K. Import e parametri | CSV/XLSX, anteprima, mapping, selezione, doppioni e date Excel; cataloghi, modelli, turni e accessi inseribili dal titolare. Guida operativa con attivazione e avvio. |
| L. Collaudo | Store e server QA separati, ruoli, build/lint, sintassi, UI, revisione visiva, integrità, catalogo/grafo e avvio della sola copia 8081. |

## Revisione visiva

Esaminati direttamente magazzino mobile chiaro, prenotazioni mobile scuro, documenti paziente desktop e integrazioni desktop. Corretto l'affollamento delle 18 schede delle impostazioni: oltre otto sezioni PageTabs usa SelectField anche su desktop. Le prove finali sono successive alla correzione; screenshot dedicato `browser/impostazioni-integrazioni-finale.png`. Le azioni di riga restano fuori dai link e vanno a capo su telefono. Nessun test con screen reader o certificazione di accessibilità è dichiarato.

## Limiti e attivazione reale

L'utente ha confermato che listino, orari, modelli e credenziali non sono disponibili. I relativi pannelli e connettori sono implementati, ma i dati dimostrativi non rappresentano la struttura reale. SMS/email richiedono account, mappature e prove effettive; Aruba e TS richiedono accessi e collaudo del fornitore. Le risposte remote sono state sostituite da trasporti controllati nei test. Non è provata la consegna reale di messaggi né una trasmissione fiscale reale.

Per TS si validano schema ufficiale, cifratura, MTOM, opposizioni e separazione protocollo/esito; il certificato del kit scade il 23/01/2027 e va sostituito dal pannello prima della scadenza. Storni/rimborsi sono esclusi dall'automatismo e segnalati per revisione fiscale specifica. I risultati incerti non determinano reinvii automatici. Le fatture sanitarie a persone fisiche sono escluse da SdI, correggendo l'ipotesi generica della call. Fonti primarie e istruzioni in [guida-titolare.md](guida-titolare.md).

La firma OTP registra un'accettazione semplice con evidenze, senza qualificazione automatica come firma digitale qualificata. Il report clinico viene preparato localmente e richiede revisione professionale. L'assistente gestionale ha contesto pseudonimizzato e limiti stimati; il filtro non anonimizza qualunque testo libero: non inserirvi dati clinici. Nessuna chiamata AI a pagamento nei test.

L'attivatore locale dipende dal server e non installa cron di sistema. Il server PHP integrato è per uso locale; hosting, TLS, dominio e processi periodici devono essere predisposti al rilascio effettivo. Nessun deploy remoto eseguito e nessun dato di collaudo aggiunto alla demo in uso.
