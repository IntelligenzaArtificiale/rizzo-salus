# Rizzo Salus · configurazione e uso della nuova copia

Versione aggiornata dalla riunione del 9 novembre 2026 e dalla successiva indicazione: materiali e accessi saranno inseriti dal titolare, quando disponibili.

Aprire http://localhost:8081. Account demo `titolare@demo.it`, password `DemoPassword2026`. Gli altri account sono `segreteria@demo.it`, `fisio@demo.it`, `medico@demo.it`, stessa password. Sono dati dimostrativi: l'anagrafica fiscale della struttura e le prestazioni reali devono essere verificate prima dell'uso operativo.

## Inserimento dei materiali dal pannello

In **Impostazioni**, scegliere la sezione dal selettore.

| Sezione | Dati da inserire |
|---|---|
| Struttura | Ragione sociale, P.IVA/CF, indirizzo, contatti e link recensioni. Non utilizzare i dati dimostrativi per documenti reali. |
| Cataloghi | Prestazioni, famiglie, durata, tariffa, trattamento IVA, codice spesa TS, abilitazione alle prenotazioni mediche. Professionisti, contatti, colori, percentuali generali e per prestazione; risorse, capienza e periodi di fermo. Consumi di materiali per terapia. |
| Orari / Cataloghi | Orario della struttura; nel professionista, turni ed eccezioni. Chiusure nell'apposita sezione. Nessuna finestra pubblica viene dedotta automaticamente dai turni. |
| Consensi | Modelli effettivamente approvati dalla struttura: tipo, testo, versione, attivazione. Segnaposto disponibili nel form. Le nuove versioni non riscrivono i documenti già archiviati. |
| Documenti | Consensi obbligatori, durata dei link e scadenza OTP. Privacy e trattamento sono necessari al rilascio del calendario. |
| Prenotazioni | Attivazione, informativa, domande generiche, anticipo, orizzonte, passo e visibilità di prezzi e medico. Pubblicare poi le fasce dalla pagina Prenotazioni e attesa. Le terapie riabilitative restano escluse. |
| Messaggi | Modalità prova/interna/reale, SMS preferenziale, orari di silenzio, promemoria del venerdì, testi e parametri del fornitore, limiti di spesa, orari delle conferme visite. |
| Integrazioni | SMS, profili Aruba e TS, credenziali riservate. Le password e le chiavi sono cifrate; il pannello mostra soltanto se sono presenti. Inserire nuovamente un valore per sostituirlo. |
| Fatturazione | Dati fiscali, sezionale, esenzioni e bollo da concordare con il consulente; email e preparazione settimanale dei documenti. |
| Personale / Compensi | Email consulente, preparazione mensile dei riepiloghi e dei compensi, orari delle attività. Le percentuali stanno anche nel singolo professionista. |
| Assistente | Chiave riservata, modello e limiti di costo. Il tetto mensile iniziale è 5 euro stimati; non è un plafond garantito dal fornitore. |
| Automazioni | Stato, ultima esecuzione, attivazione ed esecuzione manuale delle attività. In locale l'attivatore viene avviato insieme al server e termina quando questo si chiude. |

I testi dei messaggi possono essere modificati in Comunicazioni. Gli argomenti fissi e le mappature dei campi devono corrispondere allo strumento effettivamente collegato: per email con allegati serve anche la configurazione degli allegati. Nessun collegamento viene dichiarato riuscito dalla sola presenza di una password.

## Flussi operativi

1. Inserire o importare i pazienti; aggiungere disponibilità generali, riferimenti e percorsi. Un percorso può avere proprie fasce, frequenze e intervalli. Le avvertenze essenziali sono visibili al curante secondo il suo ruolo.
2. Archiviare i consensi: generare dal modello e far leggere/accettare con OTP oppure caricare il documento cartaceo firmato. Le semplici spunte in anagrafica non sbloccano il calendario.
3. Pianificare: generare la proposta, rivedere orari, professionisti e spostamenti, selezionare le sedute da approvare. Il trascinamento in agenda apre un form di revisione e non salva da solo. Titolare e segreteria gestiscono l'agenda; i clinici hanno consultazione della propria e, se autorizzati, diario dei percorsi.
4. Nei gruppi segnare l'esito del singolo partecipante. Solo le eseguite consumano il ciclo e alimentano fatture/compensi; assenze e annullamenti non sono addebitati. Le eseguite e gli importi approvati restano protetti da modifiche incompatibili.
5. Pubblicare le sole finestre mediche. Il paziente seleziona lo slot e verifica il telefono con OTP; il server ricontrolla la disponibilità alla conferma. Una richiesta di disdetta lascia attivo l'appuntamento: la segreteria richiama e aggiorna l'agenda. I posti liberati producono avvisi interni con eventuali persone in attesa.
6. Il portale personale richiede telefono, data di nascita e OTP. In caso di recapito condiviso, serve il CF per distinguere l'anagrafica. Espone solo il proprio storico e i documenti condivisi; nasconde gli appuntamenti futuri finché mancano i consensi.
7. Variazioni: registrare prima il contatto telefonico, poi il riepilogo SMS. I ricontatti dopo le cure e le recensioni sono attività manuali; il link WhatsApp apre un testo da inviare personalmente. Registrare il contatto solo dopo averlo effettuato. Le campagne richiedono anteprima, approvazione e consenso marketing, ricontrollato anche all'invio.
8. Fatturare settimanalmente le prestazioni eseguite, registrare gli incassi. Calcolare i compensi, rivedere materiali e percentuali, approvare; dopo il bonifico manuale caricare la contabile e segnare liquidato. Questo registra l'uscita, senza eseguire pagamenti bancari.
9. Registrare spese, presenze e movimenti di magazzino. Le ricorrenze producono previsioni, senza simulare pagamenti. Le ore effettive escludono pause e preparazione; le assenze future sono pianificabili. I riepiloghi per consulenti vengono preparati per revisione e invio approvato.
10. Importazioni: CSV o primo foglio XLSX, mappatura, anteprima, selezione e applicazione. Le fatture storiche sono archiviate e non ritrasmesse. Per le fatture d'acquisto verificare associazioni articolo/quantità prima del carico; il PDF non produce quantità OCR inventate.

## Attivazione dei servizi esterni

**SMS/email:** impostare la chiave del servizio, account collegati, nomi degli strumenti e mappature. Provare prima sui recapiti interni. Modalità prova: nessuna consegna reale, codici OTP consultabili dalla segreteria nel registro dei messaggi. Questo comportamento è esplicitamente indicato sulle pagine pubbliche della demo. Passare a modalità reale soltanto dopo le verifiche del fornitore.

**Aruba:** username e password nell'area riservata, ambiente demo o produzione, attivazione. Verifica accesso separata dall'invio. Per documenti ammessi: controllo senza trasmissione e, dopo revisione, approvazione dell'invio. La presa in carico Aruba non è la consegna finale SdI. Le fatture sanitarie verso persone fisiche sono bloccate su questo canale; l'obbligo fiscale effettivo va verificato con il consulente.

**Sistema TS:** configurare i codici della lettera di assegnazione, CF proprietario, username, password e PIN; scegliere ambiente e certificato di cifratura. Il certificato pubblico incluso nel kit ufficiale scade il **23 gennaio 2027**: il pannello consente di sostituirlo. Preparare il pacchetto delle spese pagate, controllare opposizioni e codici, scaricare e rivedere prima dell'approvazione. XML e codici fiscali cifrati sono validati localmente; MTOM, protocollo ed esito sono trattati separatamente. Prima della produzione servono le prove richieste dal servizio e la conferma di collaudo dal titolare. Storni/rimborsi non vengono trasmessi automaticamente: il pacchetto li segnala per gestione fiscale specifica. Un invio con risultato incerto non viene ripetuto in automatico.

**Referti e AI:** le bozze cliniche sono compilate localmente dai dati del percorso e devono essere riviste dal professionista. L'assistente gestionale invia un contesto operativo con pazienti pseudonimizzati e filtra gli identificativi riconoscibili nella domanda; non inserire nella chat referti, diagnosi o altri dati sanitari in testo libero. Il filtro non è una garanzia di anonimizzazione di qualunque testo arbitrario. La stima di costo non sostituisce i limiti dell'account del fornitore.

## Avvio e manutenzione

Nella cartella `gestionale-rizzo-boilerplate`: `./avvia.sh`. Non lanciare il router della vecchia demo. Il launcher usa dati e backup della copia e avvia un attivatore locale subordinato al processo del server. Log privato `.runtime/attivita-locali.log`. Per hosting reale serve un processo periodico/cron secondo `api/bin` o l'endpoint protetto, oltre a TLS, dominio e verifica delle integrazioni; il server PHP integrato è per uso locale.

La demo precedente su 127.0.0.1:8080 è separata e non viene aggiornata. Test e screenshot usano esclusivamente dati QA su 8082; non lanciarli su dati operativi.

## Riferimenti dei connettori

- [Aruba · documentazione API v2](https://fatturazioneelettronica.aruba.it/apidoc/v2/docs.html).
- [Sistema TS · strumenti per lo sviluppo](https://sistemats1.sanita.finanze.it/portale/spese-sanitarie/documenti-e-specifiche-tecniche-strumenti-per-lo-sviluppo); kit 20240214, XSD e certificato con fonte in `api/resources/sts/FONTE.txt`.
- [Garante · FAQ fatturazione elettronica](https://www.gpdp.it/temi/fisco/faq-fatturazione-elettronica); art.10-bis DL119/2018, come modificato dall'art.2 DLgs81/2025, per il divieto di fatturazione sanitaria verso persone fisiche tramite SdI.
