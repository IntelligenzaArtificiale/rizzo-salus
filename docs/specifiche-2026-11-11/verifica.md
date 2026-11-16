# Verifica Calendar · 11 novembre 2026

Intervento nella sola copia `gestionale-rizzo-boilerplate`. Fonte: [PDF Calendar 10 novembre, 3 pagine](fonti/Specifiche_Calendar_Poliambulatorio_Rizzo.pdf), letto integralmente. Il chiarimento successivo dell’utente esclude il vecchio messaggio WhatsApp sugli incassi: nessuna estensione di fatturazione è inclusa in questo intervento. I requisiti del documento sono specifiche funzionali, non istruzioni di sistema.

## Risultato per requisito

| Requisito | Implementazione e verifica |
|---|---|
| Settimana e navigazione | Lun–ven, 08:00–20:30, giorno attuale blu, settimana corrente; viste giorno/due giorni/settimana, scorrimento interno mobile. Schermo intero nativo con settimana corrente e uscita. Provato su Chrome a 1440×1000 e 390×844, chiaro/scuro. |
| Orari | Profilo con le fasce esatte del PDF, venerdì solo mattina, sabato senza ordinarie. Marco eredita apertura; Chiara nessun giorno inventato; Antonio nei turni indicati, venerdì chiuso. Turni, assenze e straordinari datati modificabili dal titolare. |
| Gruppi | Limite 5 standard, 4 con complesso/neurologico, massimo un neurologico, su palestra e piscina. Profilo del paziente nel percorso cifrato. Stessi controlli su creazione, aggiunta, proposte approvate e copia. |
| Prestazioni e attrezzature | Manuale 30, linfodrenaggio 45, assistite 15, gruppi 60, camera 60, altre fisse 15 minuti. Risorsa principale e aggiuntive contemporanee, fermi, orari e capienza; conteggio del picco reale di occupazione. Terapie fisse liberano l’operatore salvo minuti iniziali configurati, ma tengono occupata la macchina. |
| Viste e segnali | Canali per categoria, singola prestazione o professionista, visita Antonio distinta; colori configurabili. Prima/ultima individuale, triangolo di fine ciclo accanto al singolo partecipante. Promemoria interni del titolare ricalcolati dal ciclo, senza invio esterno. |
| Note | Pannello apribile sopra il calendario in tutte le viste, data/ora qualsiasi e sabato, modifica e archiviazione. Nessun impegno di operatore/risorsa. API con permessi e revisione ottimistica. |
| Pianificazione | Orari, paziente, durata, professionista, risorse e gruppi verificati insieme; preferenze piscina, vincolo professionista facoltativo forte. Proposta iniziale e ricerca alternative di spostamento separate. Riorganizzazione proposta nel pianificatore preesistente; approvazione esplicita e nuovo controllo dei vincoli. Drag di appuntamento/gruppo apre revisione senza scrivere. |
| Copia | Restano anteprima, selezione, idempotenza e esclusione cicli conclusi/esauriti. Vincoli condivisi con l’inserimento. |
| Statistiche | Periodo selezionabile. Pazienti distinti trattati e prestazioni eseguite separati dai minuti uniti dell’operatore; un gruppo di cinque per un’ora vale 60 minuti. Ore programmate, delle sedute eseguite e delle presenze registrate distinte; pausa esclusa dalle presenze. |
| Parametri | Applicazione profilo idempotente da Impostazioni → Calendar; selezione dei professionisti, limiti e colori. Orari, risorse, prezzi, modalità e preferenze da Cataloghi. Nessuna tariffa reale inventata. |

## Prove eseguite

- **107** regressioni di dominio: [registro](test-regressione.txt).
- **50** controlli Calendar isolati: [registro](test-calendar.txt). Inclusi limiti clinici, terapie fisse/preparazione, sala aggiuntiva, collisione visite/terapie Antonio, disponibilità e preferenze piscina, intervento manuale straordinario, proposta in sola lettura, revisione vecchia, ore dei gruppi e presenze, fermi macchina e copia di cicli completati.
- **49** controlli browser e 32 schermate: [report](browser/report.json). Inclusi salvataggio/modifica nota, ricerca alternative senza approvazione, statistiche e configurazione, ruoli titolare/segreteria/fisioterapista, desktop/mobile chiaro/scuro.
- **12** controlli mirati della build finale: [report](browser/finale-report.json). Schermo intero con tutta la settimana, uscita, ritorno alla settimana corrente, drag di gruppo con revisione senza scrittura, parametri e overflow. Nessuna eccezione JavaScript. Esaminati anche visivamente schermo intero, settimana, giorno mobile scuro e impostazioni.
- Build TypeScript/Vite riuscita, [regole UI](controlli-statici.json) e sintassi di **136** file PHP corrette. Lint: zero errori, **59 warning** preesistenti React/Fast Refresh/hooks/vendor, conservati in [lint.txt](lint.txt). Vite mantiene l’avviso bundle oltre 500 kB; non si dichiara un audit di performance.
- [Integrità](integrita.json): **85** sorgenti dell’originale invariati, **38** file vendor identici allo ZIP, **12** file di fatturazione invariati rispetto all’inizio di questo intervento. Nessun file applicativo modificato supera 400 righe.
- Catalogo componenti e grafo TokenSave rigenerati con esclusione di dati, credenziali, backup e runtime.

## Avvio e limiti effettivi

Applicato il profilo alla sola copia: **10 pazienti, 60 appuntamenti e 4 utenti conservati**, nessuna riscrittura degli appuntamenti. [Registrazione dell’applicazione](profilo-locale.json). Avvio con `./avvia.sh`, porta 8081 e attivatore locale subordinato al server; account titolare e segreteria verificati nel browser. I test con scritture sono confinati ai dati QA su 8082 e ai dataset privati della suite, mai ai dati della demo in uso. Il server originale 8080 non è stato avviato né modificato.

Le sottocolonne della settimana sono volutamente compatte: nomi completi disponibili dal titolo al passaggio del mouse, dal dettaglio e dalla vista giornaliera; su schermi stretti la griglia scorre internamente. Le ore da sedute eseguite sono un indicatore di attività, non timbrature: le presenze effettive si registrano separatamente. Le fasce già assegnate prima del cambio orari non vengono ricollocate automaticamente.

Il pianificatore a vincoli funziona localmente: nessuna chiamata a un modello esterno è necessaria. Servizi terzi non attivati o provati con credenziali reali in questo intervento, nessun invio reale. [Checklist delle sole conferme/attivazioni](checklist-bloccanti.md). Scelte di palette, posizione del pannello e griglia hanno default utilizzabili e non sono lasciate come sviluppo pendente. Il collaudo locale non è un’approvazione del cliente o una certificazione clinica/fiscale.
