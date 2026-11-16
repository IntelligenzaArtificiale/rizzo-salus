# Assistente AI

| | |
|---|---|
| Rotte | `#/assistente` (nuova chat), `#/assistente/:id` (conversazione), `#/assistente?domanda=…` (avvia con una domanda) |
| File | `pages/assistant/AssistantPage.tsx`, `AssistantReply.tsx`, `ReplyExtra.tsx`, `scenarios.tsx`, `composer.ts` |

**Vuoto**: "Ciao Nome / Come posso aiutarti?", **Prompt Bar** grande (con @ si collegano Richieste, Clienti e Documenti, con / i comandi; senza scelta del modello) e domande suggerite.

**Conversazione**: la cronologia sta nella **Sidebar Nav** (Nuova chat, ricerca nelle chat). Ogni risposta segue la sequenza dell'esempio di Beautiful UI:

1. **Loading State**: "Sto leggendo la domanda".
2. **Thinking**: i passaggi del ragionamento, poi chiusi.
3. **Approval Card**: domande prima di rispondere, se servono; la scelta singola avanza da sola.
4. **Tool Chips**: cosa ha letto o analizzato.
5. **Streaming Text**: la risposta con le fonti e le domande successive.
6. Blocco d'azione: **Recommendation Card** (assegnare), **Diff Table** (archiviare le richieste scelte), **Context Cards** (documenti usati) oppure **Agent Screen** (lavoro in corso).

Le quattro conversazioni d'esempio mostrano tutte le combinazioni. In produzione il backend restituisce gli stessi pezzi (`Scenario` in `scenarios.tsx`): le pagine non cambiano.

![](img/app-assistente.png)
![](img/app-assistente-c1.png)
![](img/app-assistente-c2.png)
![](img/app-assistente-c3.png)
![](img/app-assistente-c4.png)

## Follow-up

Un suggerimento accoda una nuova domanda nella conversazione corrente senza
cambiare chat o perdere i messaggi precedenti. L'adattatore in AssistantReply
passa solo il testo: StreamingText emette anche l'indice, che non è uno Scenario.
La regressione controlla entrambi gli indici e due follow-up consecutivi.
