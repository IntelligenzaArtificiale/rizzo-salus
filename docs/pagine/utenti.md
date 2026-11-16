# Utenti (amministratore)

| Pagina | Rotta | File |
|---|---|---|
| Elenco | `#/admin/utenti` | `pages/users/UsersPage.tsx` |
| Scheda | `#/admin/utenti/:id` | `pages/users/UserDetailPage.tsx` |
| Nuovo / Modifica | `#/admin/utenti/nuovo`, `#/admin/utenti/:id/modifica` | `pages/users/UserFormPage.tsx` |

- **Elenco**: **Records Table** in modalità semplice (`readOnly`): nome (apre la scheda), ruolo e stato come tag colorati, ultimo accesso, attività, email. Selezione, ordinamento e colonne ridimensionabili restano quelli originali. Le parti con compilazione automatica e proprietà tecniche sono nascoste.
- **Scheda**: dati, poi **Accesso** con il **Segmented Control** (Attivo, Sospeso, Bloccato, Disabilitato) e una riga che spiega cosa vede l'utente. Il cambio si salva subito, perché è reversibile. Eliminare chiede di scrivere il nome.
- **Nuovo/Modifica**: nome, email (controllo duplicati), ruolo, azienda e telefono facoltativi. Il nuovo utente riceve l'email per scegliere la password.

![](img/app-utenti.png)
![](img/app-utente.png)
![](img/app-utente-nuovo.png)
