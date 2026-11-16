# File di Beautiful UI: differenze dall'originale

Fonte: registro ufficiale `https://www.beautifului.dev/r/*.json`, scaricato il 2 novembre 2026, e repository GitHub `slev12397/beautiful-ui` per ciò che il registro non ha. Licenza MIT (`src/components/LICENSE-beautiful-ui.txt`).

Ogni modifica è segnata nel codice con `[boilerplate]` e lascia invariato il comportamento predefinito. Per vedere tutte le differenze:

```bash
diff -ru <cartella-originali> src/components
```

## Correzioni

1. **CSS delle Records Table.** Il blocco `@media (max-width: 640px)` era diviso fra `records-table.css` e `foundation.css`, e Tailwind 4.3 non compilava. È stato riunito in fondo a `records-table.css`, come nel sorgente GitHub.
2. **Icone di SidebarNav.** `@central-icons-react` è a pagamento: gli import puntano a `src/components/icons/central.tsx`, che dà gli stessi nomi alle icone Lucide.
3. **AgentScreen** non è nel registro: copiato dal repository GitHub.
4. **Atomi Switch, StatusPill, SegmentedControl, Chip, TextRow, ProgressRing e ThemeToggle** non sono nel registro: copiati dal repository GitHub.

## Parametri aggiunti (dati e testi dall'esterno)

| File | Aggiunte |
|---|---|
| SidebarNav | Voci con gruppi collassabili, workspace, menu account ed Esci, cronologia chat attivabile, etichette, footer personalizzabile |
| FilterTable | Conteggi calcolati dalle righe, etichette di filtri e stati, `fill`, `onRowClick` |
| SearchList | `onPick`, `autoFocus`, etichetta per svuotare |
| InsightCards | Card Compare, Anomaly e Allocation esportate e configurabili (titoli, formati, soglie); `fill`, `onPill` |
| RecordsTable | Etichette, livelli di attività, `readOnly` (nasconde colonne automatiche, proprietà e calcoli), `onOpen`, colori dei tag, email come link |
| DiffTable | Riga aggiunta, colonne, colori, testi, `fill`, `onApply` |
| PromptBar | Fonti e comandi, `showModel` (nasconde la scelta del modello), etichette |
| Flowchart | Condizione configurabile (fonte, proprietà, valori, parole), icona, collegamenti |
| RecommendationCard | `fill`, `onAccept` |
| SelectionActions | Azione predefinita presa dalle azioni passate |
| ContextCards, TaskRows, ToolChips | Larghezza decisa dal contenitore quando si passa `className` |
| ChatComposer | Larghezza fino a 560 px |
| FilterTable | `pageSize`: paginazione dopo il filtro |
| PromptBar | `dictate`: dettatura vera (e `null` nasconde il microfono) |
| Switch | Levetta scura quando è acceso, leggibile nel tema scuro |

## Testi tradotti in italiano

Etichette per lettori di schermo e testi fissi d'interfaccia di ApprovalCard, ChatComposer ("in 2s"), StreamingText, ToolChips, CodeBlock, SelectionActions, AgentScreen (Apri, Mostra come si fa, Fine, Riduci, Schermo: …), RecordsTable (ordina, ridimensiona), ThemeToggle.

Ogni aggiornamento dal registro va confrontato con questa pagina prima di sovrascrivere i file.

## Slot export — 2026-11-03

FilterTable e RecordsTable espongono il prop facoltativo renderExport(rows),
per comporre il comando applicativo senza duplicare i controlli o leggerli dal
DOM. FilterTable passa le righe dopo il filtro, prima della paginazione;
RecordsTable le righe ordinate. Nessun import del generatore Excel nel vendor,
nessuna variazione di logica quando lo slot non è fornito.

## Slot della cronologia in SidebarNav — 2026-11-03

Problema concreto: il menu «⋯» per conversazione (Rinomina, Elimina) richiedeva un bottone
dentro la riga, ma la riga era un `<button>` (bottoni annidati non validi). Patch minima:
la riga diventa un contenitore `data-row` con il bottone di apertura e uno slot facoltativo.
Nuove props: `recentAction(item, active)`, `editingRecentId`, `renderRecentEditor(item)`;
attributo `data-recent-id`. Senza le nuove props l'aspetto e il comportamento non cambiano.

## Verifica della provenienza

`python3 -I scripts/verify-vendor.py <clone di beautiful-ui> --scrivi` confronta ogni file con
il repository e scrive `docs/provenienza.json` (commit, versione, stato e hash di ogni file).
Una differenza senza marcatura `[boilerplate]` fa fallire il controllo. Ultimo controllo:
commit `44a274e5` del 22 settembre 2026, package 0.1.0. Tutti i componenti del repository
(11 atomi, 22 primitive) sono presenti; 12 file identici, 21 con differenze marcate.

## Cronologia senza scorrimento orizzontale — 2026-11-03

Con barre di scorrimento classiche (Windows, molti Linux) lo scorritore delle chat perdeva
~14 px e le righe larghe 208 px uscivano in orizzontale. Patch: `overflow-x-hidden` sullo
scorritore. In `src/styles/app-controls.css` le righe hanno `max-width: calc(100% - 1rem)`.
