# Impostazioni piattaforma (amministratore)

Rotta `#/admin/impostazioni?scheda=…`, file `pages/admin/SettingsPage.tsx`, schede in `pages/admin/settings/`.

Tutte le schede usano la stessa griglia (`SettingsSection`): titolo e descrizione a sinistra, controlli a destra,
a tutta larghezza della pagina. Le schede con salvataggio esplicito mostrano `SaveBar` solo quando c'è una
modifica; uscendo o cambiando scheda con modifiche non salvate compare «Uscire senza salvare?».

| Scheda | Contenuto | Salvataggio | Componenti |
|---|---|---|---|
| Moduli | Funzioni accese/spente, in gruppi (Accesso, Contenuti, Assistente, Interfaccia) | da solo, con toast | SwitchRow |
| Marchio | Nome, colore con controllo del contrasto, simbolo e logotipo con varianti scure, contatti | SaveBar | TextField, FileUpload |
| Aspetto | Tema iniziale, angoli, densità, movimento, carattere, con anteprima dal vivo | SaveBar | SegmentedControl, EntityCard (anteprima) |
| SEO | Titolo e descrizione predefiniti, immagine social, indicizzazione, anteprima su Google | SaveBar | TextField, TextAreaField |
| Ruoli | Ruoli con persone e permessi; matrice per gruppo con «tutti/nessuno» | SaveBar | checkbox delle Records Table |
| Sicurezza | Password, verifica in due passaggi, blocco, uscita automatica, «Ricordami», avvisi, restrizioni amministratori, sessioni aperte | SaveBar; sessioni subito | SelectField, SegmentedControl, ConfirmDialog |
| Backup | Pianificazione, documenti inclusi, copie con scarica e ripristina, backup manuale | SaveBar; azioni subito | ActionMenu, ConfirmDialog con testo da riscrivere |
| Automazioni | Attività pianificate del server (cron): frequenza, ultimo esito, prossima, accesa/sospesa, esegui ora, storico; regola di assegnazione | interruttori subito | Switch, StatusPill, Timeline, Flowchart |
| Integrazioni | Esempio di chiamata per collegare un altro sistema | — | Code Block |

Contratti di Sicurezza, Backup e Automazioni: `src/api/admin.ts` e [api.md](../api.md). Le regole le applica
il backend: il frontend le sceglie e le mostra. Nell'anteprima i dati sono simulati e nessun backup è un file vero.

Su schermi stretti le schede si scelgono dal selettore (PageTabs); la scheda aperta resta nell'indirizzo.

![](img/app-impostazioni-moduli.png)
![](img/app-impostazioni-marchio.png)
![](img/app-impostazioni-aspetto.png)
![](img/app-impostazioni-seo.png)
![](img/app-impostazioni-ruoli.png)
![](img/app-impostazioni-sicurezza.png)
![](img/app-impostazioni-backup.png)
![](img/app-impostazioni-automazioni.png)
![](img/app-impostazioni-integrazioni.png)
