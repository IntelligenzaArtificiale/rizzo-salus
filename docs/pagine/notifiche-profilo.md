# Notifiche e profilo

| Pagina | Rotta | File |
|---|---|---|
| Notifiche | `#/notifiche` | `pages/notifications/NotificationsPage.tsx` |
| Profilo | `#/profilo?scheda=Dati\|Sicurezza\|Preferenze\|Account` | `pages/profile/*` |

- **Notifiche**: "Da leggere" e "Tutte". Un punto indica quelle non lette. Aprirne una la segna come letta e porta alla pagina collegata. "Segna tutte come lette" è un'icona. Il contatore della sidebar si aggiorna subito.
- **Profilo**, in schede:
  - **Dati**: nome, email, telefono; "Salva" attivo solo se c'è una modifica.
  - **Sicurezza**: password attuale, nuova con requisiti, conferma. Se la password attuale è sbagliata il campo si svuota e compare il messaggio.
  - **Preferenze**: interruttori (**Switch**) che si salvano da soli, tema (**Theme Toggle**).
  - **Account**: eliminazione con conferma scritta (ELIMINA).

Password attuale di prova: `Password123`.

![](img/app-notifiche.png)
![](img/app-profilo.png)
![](img/app-profilo-sicurezza.png)
![](img/app-profilo-preferenze.png)

Profilo: rimossa l’email dal sottotitolo perché già presente nel form; spaziatura sotto gli aiuti dei campi uniformata.
