# Mapping dei componenti

La guida interattiva è nell'anteprima: **/anteprima/componenti** (percorso decisionale, esempi dal
vivo in domini diversi, props, collegamento a dati e azioni, responsive, accessibilità, errori comuni).
Questa pagina riassume le regole da applicare a ogni blocco di ogni pagina.

## Dal bisogno al componente

| Il blocco mostra… | Componente | Da evitare |
|---|---|---|
| Elementi da scegliere fra tanti (prodotti, offerte, servizi, persone, account) | `EntityCard` in `CardGrid` | elenco di titoli con una data accanto |
| Dati da cercare, filtrare, esportare | `TableToolbar` + `ExportableTable` (FilterTable) + `Pagination` | campi di ricerca in un modulo sopra la tabella; filtri duplicati |
| Anagrafiche da ordinare | `RecordsTable` readOnly | colonne demo e testi inglesi |
| Righe che aprono un dettaglio (notifiche, attività, conversazioni) | `RowList` (con `status`, `mark`, `aside`) | card alte una per riga |
| Storia di un elemento | `Timeline` | storico in una scheda separata |
| Numeri chiave e attività | `InsightCards`, `TaskRows` | etichetta e numero in elenco, molti zeri |
| Stato | `StatusPill` da `statusOf()` | stato come testo grigio |
| Numeri chiave e andamenti | `StatTile`, `ChartCard` + `ColumnChart` / `BarList` / `SegmentedBar` ([grafici.md](grafici.md)) | due scale sullo stesso grafico; elenchi di zeri |
| Configurazione da salvare | `SettingsSection` + `SaveBar` + `useSettingsForm` | form stretti allineati a sinistra; Salva sempre visibile |
| Esito di un'azione | toast; `StatusPanel` se l'esito è la pagina | codici d'errore |
| Conferma di un'azione irreversibile | `ConfirmDialog` | modali per creare o modificare |
| Inserimento dati | campi del boilerplate + `FormActions` + `useSubmit` + `useUnsavedChanges` | moduli generati da uno schema unico |
| Azioni secondarie di una riga | `ActionMenu` (⋯) | azioni visibili solo su hover |
| Conversazione AI | pagina assistente, `useChatHistory` | cronologia come scheda |

## Quando il catalogo non basta, in quest'ordine

1. **Varianti e props**: etichette, slot, token. Esempio: FilterTable con colonne rietichettate.
2. **Composizione**: più componenti insieme. Esempio: TableToolbar + FilterTable + Pagination.
3. **Estensione**: un wrapper del boilerplate. Una patch al vendor è ammessa solo per un problema concreto, va marcata `[boilerplate]` e descritta in `PATCH.md`.
4. **Nuovo componente**: si scrive in `docs/redesign/eccezioni.md` con il bisogno, i componenti valutati, il limite e la verifica.

Mai una seconda paginazione, un secondo bottone, un secondo campo o un adattatore che trasforma ogni elenco nello stesso formato.

## Matrice di mapping (redesign)

Una riga per **blocco UI**, non per stato generico. Colonne obbligatorie:

`pagina, superficie, blocco, campi_prima, campi_dopo, componente, motivo, file, verificato`

- `campi_prima` e `campi_dopo` elencano i dati visibili: un campo tolto ha un motivo scritto.
- `componente` usa i nomi reali degli export (`EntityCard`, `ExportableTable`…).
- `file` è il file che implementa il blocco: la riconciliazione controlla che il componente vi sia importato.
- Una matrice in cui tutte le pagine hanno lo stesso componente non è una matrice.

Lo script `scripts/reconcile_mapping.py` della skill confronta matrice e codice.
