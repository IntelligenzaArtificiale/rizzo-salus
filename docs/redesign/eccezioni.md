# Eccezioni di dominio
Calendario settimanale: il catalogo non contiene un calendario. FilterTable/RecordsTable rappresentano righe, non intervalli sovrapposti. Componente CalendarWeek per griglia temporale, composto con Button e token del boilerplate; dettaglio su pagina dedicata. Nessuna nuova libreria UI, vendor invariato. Verificare sovrapposizioni, navigazione settimana, tastiera e mobile.
Il backend non contiene cronologia persistente conversazioni: si mantiene lo storico in memoria per la sessione come nell'originale, senza collegare gli endpoint mock del boilerplate.

Pazienti: RowList e TableToolbar per la directory, PageTabs e ProgressRing per scheda e percorsi. Non inventare canali ed email mancanti nella ricerca. La RecordsTable originale resta usata per gli utenti.
Form paziente: PageTabs segmenta Anagrafica/Contatti/Consensi/Note; i campi secondari si aprono con details/summary nativi, perché il catalogo non offre disclosure. Tutti i campi usano i wrapper del kit. FormActions accetta azione e contenuto iniziale opzionali per Continua/Indietro, annullando il submit implicito al cambio passo. RowList accetta azioni di riga esterne al link: evita bottoni dentro un anchor e mantiene lo stile del kit.
SaveBar: prop facoltativa `disabled` nel wrapper applicativo (non vendor), per impedire salvataggi di campi non validi mantenendo stile e comportamento originali.
Cornici AppLayout/SiteLayout: stessa struttura del boilerplate, collegata alla sessione reale e al menu per permessi; rimossi i richiami a notifiche/ricerca Richieste del template, che il backend non offre.

## Estensione dalla call del 9 novembre
FileUpload del kit è legato al servizio dimostrativo: ClinicFileField usa un input file nativo con i suoi token per inviare file alle API cifrate del gestionale. Nessuna modifica vendor.
RowList applicativo ammette righe senza navigazione e colloca le azioni fuori dal link; su schermi stretti le azioni vanno a capo.
PageTabs applicativo usa SelectField anche su desktop quando ci sono più di otto sezioni, evitando sovrapposizioni delle etichette; i gruppi brevi mantengono SegmentedControl.
Il trascinamento del calendario è un miglioramento del puntatore; la stessa modifica è disponibile dal dettaglio con controlli ordinari. Il drop apre una revisione, senza salvare.
Le nuove pagine compongono SettingsSection, Section, RowList, campi, dialoghi e feedback esistenti. Modifiche backend della sola copia autorizzate dalla richiesta successiva alla prima migrazione. Le vecchie attestazioni di backend identico al template sono storiche e non si applicano a questa estensione.

## Calendar del 10 novembre, integrato l’11 novembre
CalendarWeek è scomposto in geometria, canali e CalendarEvent. Sottocolonne e intervalli richiedono geometria calcolata (stili dinamici già ammessi dall’eccezione del calendario); superfici, campi e azioni continuano a usare il kit. Dettagli nativi per appunti e parametri, senza nuova libreria. Fullscreen nativo con ritorno alla settimana corrente e uscita; su mobile scorrimento interno, viste uno/due giorni. Le impostazioni Calendar espongono solo parametri effettivamente utilizzati (gruppi, palette, professionisti). Backend e schema della sola copia estesi come autorizzato. Il vecchio messaggio sugli incassi è fuori perimetro.

## Assistente reale, 16 novembre 2026
StreamingText resta il componente del kit per il testo animato. Il wrapper applicativo nasconde i suoi blocchi dimostrativi di azioni, fonti e follow-up: il componente non espone opzioni per rimuoverli e i pulsanti non sono collegati ad azioni reali. Nessun conteggio di fonti inventato e nessuna modifica al vendor.

## UI e operatore richiesti il 17 novembre 2026
L'utente richiede espressamente di sostituire i disclosure nativi: CollapsiblePanel compone Button del kit, mostra più/meno e Mostra/Nascondi, mantiene i campi al cambio stato e supporta tastiera/aria-expanded. Sostituisce i details dell'app clinica, senza cambiare il vendor. Tutti i controlli e gli appunti dell'agenda sono nello stesso pannello. Le azioni di navigazione riusano buttonVariants: nessuna seconda libreria di bottoni.
Le colonne temporali mantengono la geometria specifica del calendario, con minimo 112 px nella settimana e categorie vuote opzionali. Le righe orarie via repeating-linear-gradient sono geometria, non sfumature decorative; i bordi del kit realizzati come shadow-hairline rimangono. Il taglio dei contenuti all'estremità del calendario riguarda il suo scorrimento interno; la pagina non deve avere overflow orizzontale. Queste tre eccezioni sono dichiarate all'ispettore grafico, non nascoste.
La stessa richiesta autorizza l'operatore con scritture: API nuove per piani cifrati e conferma, riuso dei controller e delle regole effettive. Non abilita invii a servizi esterni o modifiche ai permessi.

## 17 novembre: agenda e documenti di formazione

L’utente richiede esplicitamente controlli sovrapposti all’agenda. AgendaControls compone Button, PageTabs, SelectField e Checkbox in un pannello non modale, con Escape, chiusura esterna e stato conservato; non introduce una libreria o modifica vendor. PatientDirectory compone token, StatusPill, Pagination e link di scheda, con riepiloghi reali. ClinicFileField usa gli stessi controlli del kit per un upload accessibile con trascinamento. Le librerie CDN per l’estrazione sono limitate alla pagina Formazione e non sostituiscono i componenti dell’interfaccia.
