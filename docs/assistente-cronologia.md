# Cronologia dell'assistente: contratto

Ogni conversazione nella sidebar ha il menu **⋯** con **Rinomina** ed **Elimina**.

## API (src/api/assistant.ts)

| Chiamata | Corpo | Risposta | Errori |
|---|---|---|---|
| `POST /assistente/conversazioni` | `{}` | `ChatThread[]`, più recenti prima | — |
| `POST /assistente/crea` | `{ prompt }` | `ChatThread` | — |
| `POST /assistente/rinomina` | `{ id, titolo }` (1-60 caratteri) | `ChatThread` | `non_trovato`, `titolo_non_valido` |
| `POST /assistente/elimina` | `{ id }` | `{}` | `non_trovato` |

Il backend controlla che la conversazione appartenga all'utente collegato e registra rinomina ed eliminazione nel registro attività.

## Comportamento

| Situazione | Cosa succede |
|---|---|
| Apertura del menu | clic o tocco su ⋯; da tastiera Invio, Spazio o Freccia giù; il focus va su «Rinomina» |
| Visibilità di ⋯ | sempre sulla riga attiva e sui dispositivi touch; sulle altre righe con hover o focus. Il bottone è sempre raggiungibile con Tab |
| Rinomina | il titolo diventa un campo selezionato; Invio o clic fuori salvano, Esc annulla; vuoto o invariato non chiama il server |
| Rinomina rifiutata | torna il nome precedente e un avviso spiega cosa fare |
| Elimina | conferma «Eliminare la conversazione?»; si elimina solo a risposta positiva del server |
| Elimina la conversazione aperta | si apre la successiva nell'elenco, oppure una nuova chat |
| Errore di rete | avviso, l'elenco resta com'era |
| Operazioni ripetute | una sola operazione per volta sulla stessa conversazione |
| Persistenza | sul server; nell'anteprima nel browser (localStorage), quindi sopravvive al ricaricamento |

## Componenti riutilizzabili

- `ActionMenu`: menu ⋯ per qualunque riga (file, filtri salvati, elementi di un elenco).
- `InlineRename`: rinomina sul posto.
- `useConversations`: stato e chiamate; `useChatHistory`: collegamento alla SidebarNav e conferma.
- Slot di `SidebarNav` (patch documentata): `recentAction`, `editingRecentId`, `renderRecentEditor`.
