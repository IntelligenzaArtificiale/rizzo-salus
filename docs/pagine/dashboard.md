# Dashboard

| | Amministratore | Utente |
|---|---|---|
| Rotta | `#/admin` | `#/area` |
| File | `pages/dashboard/AdminDashboardPage.tsx` | `pages/dashboard/UserDashboardPage.tsx` |
| Domanda della pagina | Cosa devo prendere in carico oggi? | A che punto sono le mie richieste? |

**Amministratore**, un blocco per riga:
1. **Recommendation Card**: suggerimento d'assegnazione con alternative; "Assegna" conferma con un toast.
2. **Insight Cards**: tempo di risposta (Compare), richieste ricevute (Anomaly), richieste per categoria (Allocation). La domanda sotto ogni card apre l'Assistente già avviato.
3. **Task Rows**: lavori in corso (backup, importazione, promemoria).
4. **Filter Table**: ultime 5 richieste, clic per aprirle, "Vedi tutte".

**Utente**: Task Rows con l'avanzamento delle richieste aperte, Filter Table con le sue richieste, azione "Nuova richiesta" nell'intestazione. Senza richieste: stato vuoto con l'azione per cominciare.

Dati di Insight Cards: `pages/dashboard/insights.tsx` (calcolati dalle richieste). Lavori in corso: `pages/dashboard/tasks.ts`.

![](img/app-admin-dashboard.png)
![](img/app-utente-dashboard.png)
