# Registro attività e statistiche (amministratore)

| Pagina | Rotta | File |
|---|---|---|
| Registro | `#/admin/registro` | `pages/admin/AuditPage.tsx` |
| Evento | `#/admin/registro/:id` | `pages/admin/AuditDetailPage.tsx` |
| Statistiche | `#/admin/statistiche` | `pages/admin/StatsPage.tsx` |

- **Registro**: righe "chi · cosa" con l'oggetto e l'ora, un punto colorato per tipo (creazione, modifica, eliminazione, accesso). Filtro con il **Segmented Control**.
- **Evento**: chi e quando, poi le modifiche con il **Code Block** in vista Diff (prima in rosso, dopo in verde).
- **Statistiche**: periodo (7 giorni, 30 giorni, 12 mesi) su una riga propria; quattro **StatTile** con variazione sul periodo prima; **ColumnChart** delle richieste ricevute; **Insight Cards**; **SegmentedBar** per stato; **BarList** per categoria e per operatore (chiuse sul totale). Ogni grafico ha la vista tabella. Regole: [grafici.md](../grafici.md).

![](img/app-registro.png)
![](img/app-registro-dettaglio.png)
![](img/app-statistiche.png)
![](img/app-statistiche-dark.png)
