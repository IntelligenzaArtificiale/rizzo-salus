# Richieste (entità d'esempio)

Modello per qualunque entità del progetto: elenco → scheda → pagina di modifica, creazione su pagina dedicata, eliminazione con conferma.

| Pagina | Rotta | File |
|---|---|---|
| Elenco | `#/richieste` | `pages/requests/RequestsPage.tsx` |
| Scheda | `#/richieste/:id` | `pages/requests/RequestDetailPage.tsx` |
| Nuova | `#/richieste/nuova` | `pages/requests/RequestFormPage.tsx` |
| Modifica | `#/richieste/:id/modifica` | stessa pagina di Nuova |

- **Elenco**: **Filter Table** a tutta larghezza, filtri per stato con i conteggi, clic sulla riga apre la scheda. Azione "Nuova" in alto.
- **Scheda**: dati in elenco, poi la descrizione con **Selection Actions** (seleziona il testo per migliorarlo, accorciarlo o correggerlo), i documenti con **Context Cards** e domande sulla richiesta con **Chat**. Modifica ed Elimina sono icone in alto. Elimina apre l'unica modal ammessa.
- **Nuova/Modifica**: titolo, cliente, categoria (scelta), priorità (**Segmented Control**), descrizione con conteggio. "Crea"/"Salva" attivo solo con i campi obbligatori; dopo il salvataggio si apre la scheda con un toast.

API: `src/api/requests.ts` (elenco, dettaglio, salva, elimina).

![](img/app-richieste.png)
![](img/app-richiesta.png)
![](img/app-richiesta-nuova.png)
