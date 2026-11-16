# Accedi

| | |
|---|---|
| Rotta | `#/accedi` (anche `#/`) |
| File | `src/pages/auth/LoginPage.tsx` |
| Cornice | `AuthLayout`: barra con marchio, card centrata con fascia, footer con legali e tema |
| API | `POST /auth/login` → [api.md](../api.md) |
| Testi degli esiti | `src/lib/messages/login-errors.ts` |

**Scopo:** entrare nell'area riservata. Dopo l'accesso l'amministratore va su `#/admin`, l'utente su `#/area`.

## Componenti

| Elemento | Componente | Origine |
|---|---|---|
| Bottone Accedi | `Button` variante `accent`, raggio 8 | Beautiful UI |
| Ricordami | `Checkbox` (classi `records-checkbox`) | Beautiful UI, Records Table |
| Cambio tema | `ThemeToggle` | Beautiful UI |
| Email | `TextField` | Derivato |
| Password con occhio | `PasswordField` | Derivato |
| Esiti negativi | Toast | Derivato |

## Stati

| Stato | Come si presenta | Come provarlo (dati finti) |
|---|---|---|
| Vuoto | Cursore sull'email, bottone Accedi disattivo | Aprire la pagina |
| Email ricordata | Email già scritta, cursore sulla password | Accedere una volta con Ricordami attivo |
| Compilazione parziale | Nessun campo rosso, bottone disattivo | Scrivere solo l'email |
| Email incompleta | Messaggio sotto l'email quando si esce dal campo, sparisce appena è corretta | Scrivere `nome@dominio` ed uscire |
| Blocco maiuscole | "Blocco maiuscole attivo." sotto la password | Attivare Caps Lock nel campo |
| Invio | Rotellina e "Accesso in corso", bottone non ripremibile | Qualsiasi invio |
| Credenziali errate | Bordi rossi, messaggio sotto la password, password svuotata, cursore lì, nessun toast | Password diversa da `Password123` |
| Email non confermata | Toast con "Invia di nuovo il link" | `nonverificato@demo.it` |
| Account disabilitato | Toast con "Contatta l'assistenza" | `disabilitato@demo.it` |
| Account bloccato | Toast con "Reimposta la password" | `bloccato@demo.it` |
| Account sospeso | Toast con "Contatta l'assistenza" | `sospeso@demo.it` |
| Account eliminato | Toast con "Registrati" | `eliminato@demo.it` |
| Connessione assente | Toast "Connessione non riuscita" | Backend reale spento |
| Accesso riuscito | Va alla dashboard del ruolo | `admin@demo.it` o `utente@demo.it` |

Password dei dati finti: `Password123`.

## Comportamento

Segue la "Logica dei form" di [regole-ux.md](../regole-ux.md). In particolare:

- L'errore "credenziali" segna entrambi i campi e sparisce appena l'utente modifica uno dei due.
- Gli stati dell'account non segnano i campi, perché email e password erano giuste. Vanno in un toast con l'azione da fare.
- Con Ricordami attivo la sessione dell'interfaccia sta in `localStorage` e l'email viene ricordata. Senza, la sessione sta in `sessionStorage`. L'autenticazione vera resta nel cookie del backend.

## Schermate

| Chiaro | Scuro |
|---|---|
| ![](img/accedi-chiaro.png) | ![](img/accedi-scuro.png) |
| ![](img/accedi-parziale-chiaro.png) | ![](img/accedi-credenziali-scuro.png) |
| ![](img/accedi-errore-chiaro.png) | ![](img/accedi-errore-scuro.png) |
| ![](img/accedi-mobile-chiaro.png) | ![](img/accedi-mobile-scuro.png) |
