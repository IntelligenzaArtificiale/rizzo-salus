# Regole di interfaccia

Valgono per ogni piattaforma costruita da questo boilerplate. Una pagina che le viola non è finita.

## Superfici e mapping

- **Sito, accesso e app sono superfici diverse** ([superfici.md](superfici.md)). La sidebar esiste solo nell'app; la landing si progetta a parte.
- **Ogni blocco ha il componente giusto** ([mapping.md](mapping.md)): card per scegliere, tabelle per confrontare, righe per aprire, Timeline per la storia, StatusPill per gli stati.
- **Testi senza dati interni** ([testi.md](testi.md)).

## Azioni e pagine

1. **Ogni azione ha la sua pagina.** Creare un elemento apre `/<entità>/nuova`, modificarlo apre `/<entità>/:id/modifica`. Mai form di creazione dentro una lista, mai lo stesso form che diventa "modifica" nella stessa pagina.
2. **Le modal servono solo a confermare o avvisare.** Ammesse per l'eliminazione e per gli avvisi che bloccano. Non per creare, modificare o mostrare dettagli.
3. **Un componente per riga.** Niente sezioni con più blocchi affiancati. Se i blocchi sono tanti si dividono in tab o in più pagine.

## Contenuti

4. **Niente testi tecnici.** Non si nominano fornitori, modelli, formati o meccanismi interni ("elaborato da OpenAI", "JSON", "webhook"). Si scrive cosa succede per l'utente.
5. **Niente informazioni ripetute.** Una card con un titolo non lo ripete in piccolo. Quello che non serve a colpo d'occhio va nella scheda di dettaglio.
6. **Card minimali.** Un numero e la sua etichetta. Niente icone in cerchi colorati, niente decorazioni.
7. **Errori vicino al problema.** Cosa è successo e cosa fare, senza scuse e senza codici.

## Controlli

8. **Ogni campo password ha il bottone per mostrarla.** Usare sempre `PasswordField`.
9. **Bottoni con icone chiare e testi brevi.** Se l'icona basta, bottone solo icona con `aria-label` e tooltip.
10. **Validazione lato client su ogni campo** con `lib/validation.ts`, seguendo la logica qui sotto.

## Logica dei form

Si applica sempre con `useFormFields` (`src/lib/forms/useFormFields.ts`): le pagine non decidono da sole quando mostrare un errore.

1. **Un campo vuoto non è un errore.** Non diventa mai rosso. Il bottone d'invio resta disattivo finché i campi obbligatori non sono compilati e validi.
2. **Un valore sbagliato si segnala quando l'utente lascia il campo,** non mentre scrive la prima volta.
3. **Una volta segnalato, l'errore segue la digitazione** e sparisce appena il valore è corretto.
4. **Il cursore parte dal primo campo da compilare.** Se l'email è già nota, parte dalla password.
5. **Dopo un errore del server il cursore va dove si corregge.** Esempio: credenziali errate, la password si svuota e il cursore ci torna sopra.
6. **Un esito si comunica una volta sola.** Se riguarda un campo, sta sotto il campo e non serve anche un toast. Il toast è per gli esiti che non appartengono a un campo, per esempio un account sospeso.
7. **Ricordare ciò che l'utente ha già scritto.** Con "Ricordami", l'email dell'ultimo accesso si precompila la volta dopo.
8. **Avvisare dei problemi comuni prima che diventino errori.** Esempio: "Blocco maiuscole attivo" sul campo password.
9. **Niente doppio invio.** Durante l'invio il bottone mostra cosa sta succedendo e non si può ripremere.
10. **Invio con il tasto Invio** da qualunque campo, come in ogni form vero.

## Percorsi a passaggi (registrazione, procedure guidate)

Si applicano con `RegisterWizard` e i passaggi in configurazione (`src/config/registration-steps.ts`).

1. **Un argomento per passaggio,** con una domanda come titolo. Pochi campi per volta.
2. **Sempre visibile dove si è:** barra di avanzamento in cima alla card e "Passo X di Y".
3. **Indietro non perde nulla.** Le risposte restano anche ricaricando la pagina (`sessionStorage`), tranne le password.
4. **Scelta singola = avanzamento automatico.** Un clic seleziona, si vede la selezione per un attimo e si passa al passaggio dopo. Niente bottone Continua.
5. **Scelta multipla = Continua.** Il bottone si attiva dalla prima voce scelta.
6. **Tastiera:** i numeri 1-9 scelgono l'opzione corrispondente, Invio conferma.
7. **Passaggi condizionali.** Si chiede solo ciò che serve: chi sceglie "Per me" non vede i dati dell'attività. Il totale dei passaggi si aggiorna di conseguenza.
8. **Facoltativo detto chiaramente** nel testo d'aiuto del campo, non con un asterisco sugli obbligatori.
9. **L'ultimo bottone dice cosa succede:** "Crea account", non "Continua".

## Email, link e password

1. **Email nuova:** si controlla al blur che non sia già registrata e si offre "Accedi". Si suggeriscono i domini scritti male ("Intendevi nome@gmail.com?").
2. **Password nuova:** requisiti spuntati mentre si scrive, sempre con il campo di conferma. La conferma diversa si segnala all'uscita dal campo.
3. **Dopo un invio di link:** schermata "Controlla la tua email" con l'indirizzo in evidenza, il promemoria della posta indesiderata, il reinvio dopo 60 secondi e "Email sbagliata? Modificala".
4. **Recupero password neutro:** "Se l'email è registrata riceverai un link". Non si rivela mai se un'email esiste.
5. **Link scaduto o già usato:** si dice cosa è successo e si offre l'azione giusta, cioè un nuovo link o l'accesso. Mai una pagina d'errore muta.
6. **Dopo un cambio password** si va al login con l'email già scritta e un toast di conferma.

## Area riservata

1. **Il titolo della pagina è un nome** ("Richieste", "Utenti"), mai un saluto. Sotto, al massimo una riga sul dato più importante ("2 richieste da prendere in carico").
2. **La domanda della pagina decide il primo blocco.** In dashboard il suggerimento d'azione viene prima dei grafici.
3. **Nessun titolo doppio.** Se il componente ha già un'intestazione (Insight Cards, Context Cards), la sezione non ne aggiunge un'altra.
4. **Azioni nell'intestazione:** al massimo una principale con verbo breve ("Nuova"), le altre come icone (Modifica, Elimina) con tooltip.
5. **Azioni reversibili senza conferma** (cambiare stato, segnare come letto): si fanno subito con un toast. **Irreversibili con conferma** (eliminare): modal, e per gli account si riscrive il nome.
6. **Schede per dividere,** non pagine lunghe: profilo e impostazioni usano il Segmented Control, e la scheda aperta sta nell'indirizzo.
7. **Stati di ogni pagina con dati:** caricamento (Loading State), errore con "Riprova", vuoto con l'azione per cominciare.
8. **Cliccare una riga apre la scheda;** la scheda ha "indietro" verso l'elenco.
9. **Testi tecnici solo dove servono all'amministratore** (Impostazioni › Integrazioni). Mai nomi di modelli AI, formati o meccanismi agli utenti.

## Funzioni comuni

1. **Elenchi oltre 20 elementi a pagine,** con "1–20 di N"; si torna alla prima pagina quando cambia un filtro.
2. **Caricamenti:** tipo e dimensione si dicono prima ("PDF o foto, fino a 20 MB") e si controllano prima dell'invio; avanzamento visibile; annulla e riprova sempre possibili.
3. **Risorse esterne** solo dai servizi ammessi, con anteprima prima di inserirle.
4. **Voce:** il microfono compare solo se il browser lo supporta e il modulo è acceso; ogni errore spiega cosa fare. La lettura ad alta voce si ferma con un secondo clic o uscendo dalla pagina.
5. **Ogni funzione è un modulo:** se è spento sparisce del tutto (menu, rotte, bottoni), senza bottoni disattivati senza spiegazione.
6. **Permessi:** ciò che l'utente non può fare non si mostra. Se arriva comunque a una pagina vietata, vede "Non hai accesso a questa pagina".
7. **Impostazioni:** gli interruttori si salvano da soli, i moduli si salvano con un bottone attivo solo se c'è una modifica. Mai i due modi nella stessa scheda.

## Aspetto

11. **Versione chiara e scura per ogni pagina,** verificate entrambe prima dell'approvazione.
12. **Contrasto minimo 4.5:1** per i testi e 3:1 per bordi e icone. I token di `tema.css` sono già tarati.
13. **Spaziature dai token e dalle classi di Beautiful UI.** Niente valori a caso pagina per pagina.

## Decisioni di progetto

- **Badge e stati come in Beautiful UI.** Le tabelle usano i componenti 1:1, compresi i chip di stato della Filter Table. Questa scelta prevale sulla regola generale contro i badge con testo.

- **Ricerca contestuale:** comando globale solo nelle dashboard, filtri locali nelle liste. Form, impostazioni e dettagli non ereditano una ricerca inutile. Vedi [ricerca.md](ricerca.md).

- **Schede responsive:** usare PageTabs. Fino a quattro opzioni, segmenti a tutta
  larghezza su mobile; oltre quattro, selettore nativo sul telefono e segmenti
  su desktop. Nessuna barra orizzontale che copre le etichette.
- **Aiuti dei campi:** distacco costante prima del campo successivo, anche quando
  il testo di aiuto o il contatore sono visibili. Niente email duplicata nel titolo profilo.
- **Tabelle ed export:** un'azione Excel esporta le colonne consentite delle righe
  caricate/filtrate; specificare esplicitamente se la vista è un sottoinsieme.

## Comportamenti trasversali (dal 3 novembre 2026)

- **Azione principale:** nell'app lo stile `primary` (inchiostro) per salvare e creare; `accent` per le CTA dell'accesso e del sito. Mai due stili diversi per la stessa azione.
- **Modifiche non salvate:** ogni pagina di modifica usa `useUnsavedChanges(form.dirty)`; uscendo compare «Uscire senza salvare?». Dopo il salvataggio `allowNext()`.
- **Doppio invio:** `useSubmit().run(...)` su ogni invio; il bottone mostra il verbo in corso.
- **Annulla** solo nelle pagine di creazione e modifica, mai nel login o nelle impostazioni.
- **Interruttori:** `SwitchRow` per acceso/spento; `Checkbox` per consensi e selezioni multiple.
- **Unità e valute** dentro il campo con `suffix`.
- **Azioni di riga** con `ActionMenu` (⋯): raggiungibile da tastiera e touch, mai solo su hover.
- **Conferme proporzionate:** reversibile → subito con toast; irreversibile → ConfirmDialog; molto grave (account, dati di molti) → riscrivere il nome.
- **Movimento** dalle classi di `motion.css` ([movimento.md](movimento.md)), rispettando riduci movimento.
- **Schede a tutta larghezza:** PageTabs occupa sempre la larghezza del contenuto, voci di pari larghezza; su spazi stretti diventa un selettore. Vale per impostazioni, profilo, blog, notifiche, registro.
- **Impostazioni:** stessa griglia in ogni scheda (`SettingsSection`), salvataggio con `SaveBar` che compare solo con modifiche; cambiare scheda con modifiche chiede conferma.
- **Grafici:** regole in [grafici.md](grafici.md); vista tabella sempre presente.
