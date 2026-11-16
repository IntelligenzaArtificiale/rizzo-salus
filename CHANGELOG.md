# Novità

## 3 novembre 2026

**Superfici separate**
- Rotte divise in `src/routes/site.tsx`, `auth.tsx`, `app.tsx`, `dev.tsx`; `SiteLayout` (ex PublicLayout) con header orizzontale, Accedi e Registrati.
- `HomeRedirect` porta `/` alla dashboard del ruolo; pagina Privacy e termini vera al posto del segnaposto.
- Router hash «data» per poter bloccare l'uscita con modifiche non salvate.

**Componenti**
- Nuovi: `EntityCard` e `CardGrid`, `Timeline`, `ActionMenu` (menu ⋯), `InlineRename`, `TableToolbar`, `ExportableTable` (generica, ex RequestTable).
- `RowList` con `status`, `paginate`, `wrap`; `Pagination` con totali del backend (`serverPage`); `TextField` con `suffix`; `SelectField` con `compact`; `FormActions` con Annulla facoltativo e indicatore d'invio; `PageError` con messaggio; `EmptyState` con descrizione; `PageTabs` passa al selettore quando le etichette non ci stanno.
- `lib/status.ts`: stati del dominio → etichetta e tono di StatusPill.
- `useSubmit` (invio unico) e `useUnsavedChanges` (avviso di uscita), applicati alla pagina di richiesta.
- Corretto `FileUpload`: notificava il genitore durante l'aggiornamento dello stato.
- Corretto `ProfilePage`: la build falliva per una variabile mancante.

**Assistente**
- Cronologia con menu ⋯ Rinomina / Elimina, tastiera e touch, conversazione attiva gestita, errori con ripristino, persistenza (API `src/api/assistant.ts`). Patch minima a SidebarNav documentata.

**Marchio**
- Simbolo e logotipo distinti, con varianti scure; mai logotipo nello slot quadrato, mai riquadro bianco. Favicon dal simbolo. Guida `docs/marchio.md`.

**Movimento**
- `src/styles/motion.css` con classi e token; animazioni in linea rimosse; riduci movimento rispettato.

**Email**
- `src/email`: layout responsive, quattro template HTML con versione testo, anteprima `#/anteprima/email` senza invio.

**Guida «Componenti e mapping»**
- `#/anteprima/componenti`: percorso decisionale, esempi dal vivo in più domini, props, dati e azioni, responsive e accessibilità, errori comuni.

**Controlli e provenienza**
- `scripts/verify-ui-rules.py` (testi tecnici, superfici, doppioni), `scripts/verify-vendor.py` (confronto con il repository Beautiful UI, `docs/provenienza.json`), `catalogue.py` aggiornato alle rotte per superficie.
- Differenze del vendor già descritte in PATCH.md ora marcate `[boilerplate]` in ogni file.

**Documentazione e skill**
- Nuove guide: superfici, mapping, testi, marchio, movimento, email, cronologia dell'assistente, verifica UI.
- Skill: procedura di redesign in 9 passi, esempi corretti e scorretti, `scripts/reconcile_mapping.py`.

**Pacchetto**
- Il grafo TokenSave non è incluso (era riferito al codice precedente): rigenerarlo con `tokensave init <cartella> --no-git-hook` dopo l'estrazione.

## 3 novembre 2026, aggiornamento serale

**Correzioni**
- Cronologia della sidebar senza scorrimento orizzontale con barre di scorrimento classiche (Windows, Linux): righe che si restringono e scorritore bloccato in orizzontale (patch in PATCH.md).
- Schede (PageTabs) sempre a tutta larghezza: impostazioni, profilo, blog, notifiche, registro.
- Impostazioni allineate: ogni scheda usa la stessa griglia con titolo a sinistra e controlli a destra.
- Il cambio di scheda con modifiche non salvate chiede conferma; finestre di conferma fuori dai form.

**Impostazioni**
- Nuove schede **Sicurezza** (password, verifica in due passaggi, blocco, uscita automatica, «Ricordami», avvisi, restrizioni per amministratori, sessioni aperte) e **Backup** (pianificazione, copie, scarica, ripristina con conferma scritta, backup manuale).
- **Automazioni** con le attività pianificate del server: frequenza, ultimo esito, prossima esecuzione, accesa/sospesa, esegui ora, storico.
- **Aspetto** con effetto reale: tema iniziale, angoli, densità, movimento, carattere, anteprima dal vivo.
- **Moduli** in gruppi con conferma; **Ruoli** con persone e permessi per ruolo e selezione per gruppo.
- `SaveBar` e `useSettingsForm` per tutte le schede con salvataggio.

**Statistiche e grafici**
- Indicatori (`StatTile`), colonne nel tempo, barra per stato, barre per categoria e operatore, tutti con vista tabella; palette validata con lo script dataviz; guida `docs/grafici.md`.

**Guida**
- Nuove sezioni «Grafici» e «Impostazioni» in `#/anteprima/componenti`; FineTuneCard spostata nella guida.
