# Seconda revisione UX

Richiesta: migliorare sensibilmente la nuova copia, mantenendo UI/UX e componenti del boilerplate. L'originale e il server 8080 rimangono in sola lettura. Copia ripristinabile di src/public/dist e documenti salvata in .runtime/revisions.

Problemi osservati: nessuna panoramica operativa, menu piatto con materiali di presentazione fra le azioni quotidiane; calendario troppo alto e scomodo su telefono; directory pazienti a card dispersive; percorsi senza avanzamento visivo; form troppo lunghi e poco segmentati; impostazioni della struttura tutte nella stessa sezione.

Interventi: panoramica operativa per ruolo con numeri/azioni derivati da API reali; menu operativo e amministrazione raggruppata, profilo/materiali nel menu account; agenda giorno/settimana con default giornaliero su schermi stretti; directory pazienti su RowList, percorsi con avanzamento, appuntamenti del paziente; form paziente articolato in sezioni navigabili conservando campi e stato; impostazioni con identità/sede/contatti distinti.

Componenti: SidebarNav, PageHeader, StatTile, RecommendationCard dove il suo segnale corrisponde a un rapporto reale, RowList, PageTabs, SettingsSection, SaveBar, FormActions, TextField/SelectField/Checkbox, ChartCard/BarList. Nessuna attività o risposta AI simulata. Vendor invariato. Calendario rimane l'eccezione di dominio già documentata.

Verifica: confrontare viste prima/dopo; desktop, tablet e telefono; chiaro/scuro, tastiera; filtri e navigazione, permessi e contratti. Le prove scriventi saranno isolate su una fotografia dei dati in .runtime/qa e su una porta distinta. Non ripristinare o modificare i dati in uso su 8081 né quelli dell'originale.

## Esito verificato

111 controlli riusciti e 78 schermate finali in [report.json](revisione-ux/report.json). [Galleria](revisione-ux/index.html). Risoluzioni 1440, 768 e 390 pixel, chiaro e scuro. Nessun overflow della pagina, eccezione JavaScript o errore di annidamento interattivo rilevato. Revisione visiva di panoramica, agenda giorno mobile/settimana desktop, scheda percorsi, lista pazienti e creazione paziente nei due temi.

Provati: sessione, filtri/cambio data, esito rapido con risposta server e KPI aggiornato, ricerca, percorsi/appuntamenti/anagrafica, ritorno tra passi senza perdere dati, nessun salvataggio durante Continua, avviso di uscita, unica scrittura alla conferma, consensi/note salvati; impostazioni con revision; navigazione contabile/comunicazioni; menu telefono e Escape; panoramica e permessi dei quattro account. I consensi omessi dal server per il fisioterapista rimangono nascosti. La segreteria conserva accesso alle fatture senza KPI economici riservati.

Build TypeScript/Vite riuscita; lint senza errori, warning conservati in revisione-ux/lint.txt. Regole UI statiche riuscite. Il bundle principale resta oltre 500 kB: nessuna prestazione misurata o certificazione di accessibilità dichiarata. La fatturazione completa e la pianificazione sono coperte dalle prove storiche della prima versione e non sono state ricollaudate integralmente in questa revisione. Servizi esterni/assistente senza chiave restano non provati.

Le scritture del collaudo sono state eseguite soltanto su dati copiati in .runtime/qa e server 8082, poi arrestato. Nessun reset dei dati in uso sulla copia 8081. Per ripetere: preparare una fotografia QA separata, impostare DATA_DIR e BACKUP_DIR su di essa e APP_URL=http://127.0.0.1:8082, avviare PHP direttamente con router.php (avvia.sh imposta invece i percorsi della copia live), poi python3 scripts/verify-clinic-ux.py. Il test richiede Playwright/Chrome e fixture iniziali della demo; è scrivente e non va indirizzato ai dati operativi. Lo script storico è bloccato per default.

[Integrità](revisione-ux/integrita.json): 96 file backend identici all'originale, vendor/CSS originali identici allo ZIP, 109 sorgenti dell'originale senza differenze. Il runtime dati/sessioni dell'app già in uso è escluso dal confronto; nessuna scrittura verso l'originale eseguita. Grafo TokenSave sincronizzato e simbolo OverviewPage recuperato tramite MCP.
