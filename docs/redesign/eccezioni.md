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
