# Area riservata: cornice comune

| | |
|---|---|
| File | `src/layouts/AppLayout.tsx`, `src/config/navigation.ts`, `src/components/app/*` |
| Protezione | `RequireAuth`: senza sessione `#/sessione-scaduta`, ruolo sbagliato `#/accesso-negato` |

- **Sidebar Nav** (Beautiful UI): marchio e menu account (Profilo, Esci) in alto, voci per ruolo con contatore sulle notifiche, gruppo collassabile "Amministrazione", Esci in fondo. Si riduce a icone con il pulsante in alto. La cronologia chat compare solo nell'Assistente.
- **Foglio di contenuto**: bianco con bordo sottile sul fondo grigio, come l'esempio chat di Beautiful UI.
- **Barra**: etichetta discreta Area di lavoro, cambio tema e solo sulle dashboard un comando compatto Cerca (Ctrl/⌘+K). Dettagli in [ricerca.md](../ricerca.md).
- **Mobile**: la sidebar diventa un pannello dal pulsante menu; nessuno scorrimento orizzontale.
- **Contenuto**: `Page` (880 px, 1180 per le tabelle larghe), `PageHeader` (indietro, titolo, una riga, azioni), un blocco per riga.

Voci del menu: amministratore → Dashboard, Richieste, Assistente, Notifiche, Amministrazione (Utenti, Statistiche, Registro attività), Impostazioni. Utente → Dashboard, Le mie richieste, Assistente, Notifiche.

![](img/app-mobile-chiaro.png)
![](img/app-mobile-scuro.png)

Le immagini sotto risalgono alla versione precedente: per il nuovo header consultare [le verifiche](../verifica/README.md).
