# Registrazione

| | |
|---|---|
| Rotte | `#/registrazione` (con `?modo=verifica-prima` o `?modo=verifica-dopo` per forzare il modo), `#/verifica-email/:token` |
| File | `src/pages/auth/RegisterPage.tsx`, `src/pages/auth/VerifyEmailPage.tsx` |
| Passaggi | `src/config/registration-steps.ts`: si adattano al cliente cambiando i dati |
| Modo predefinito | `VITE_REGISTRATION_MODE` (`verifica-prima` se assente) |
| API | [api.md](../api.md): email-disponibile, registrazione/inizia, verifica-email, registrazione, reinvia-link |

## I due modi

**Verifica all'inizio** (`verifica-prima`):
1. Nome ed email, poi "Continua".
2. "Controlla la tua email", con reinvio dopo 60 s e correzione dell'email.
3. Il link apre `#/verifica-email/<token>`: l'email risulta confermata e si prosegue dal passo 2 con gli altri passaggi.
4. "Crea account" porta a "Il tuo account è pronto", poi alla dashboard.

**Verifica alla fine** (`verifica-dopo`):
1. Tutti i passaggi, dal nome ai consensi, poi "Crea account".
2. "Controlla la tua email".
3. Il link apre "Email confermata", poi l'accesso con l'email già scritta.

## Passaggi predefiniti

| # | Passaggio | Tipo | Quando |
|---|---|---|---|
| 1 | Crea il tuo account: nome, email | campi | sempre |
| 2 | Scegli una password: password, conferma | campi | sempre |
| 3 | Per chi userai la piattaforma? | scelta singola, avanza da sola | sempre |
| 4 | Dati dell'attività: ragione sociale, partita IVA facoltativa | campi | se professionista o azienda |
| 5 | Quante persone la useranno? | scelta singola | se azienda |
| 6 | Cosa ti interessa di più? | scelta multipla + Continua | sempre |
| 7 | Come possiamo contattarti? Telefono facoltativo con prefisso | campi | sempre |
| 8 | Ultimo passaggio: termini obbligatori, novità facoltative | consensi | sempre |

Per aggiungere un passaggio si aggiunge un oggetto all'elenco. I tipi disponibili sono `fields` (campi `text`, `email-new`, `password-new`, `phone`), `choice` (singola o `multiple`) e `consents`. La condizione si scrive con `showIf`.

## Componenti

`RegisterWizard`, `FieldsStep`, `ChoiceStep` (GlideMenu e indicatore dell'Approval Card di Beautiful UI), `ConsentStep` (checkbox delle Records Table), `PasswordChecklist`, `PhoneField`, `EmailSentPanel`, `StatusPanel`, `LoadingPanel`, `PrimaryButton`/`PrimaryLink` (`Button` di Beautiful UI). Dettagli in [componenti.md](../componenti.md).

## Logica

Valgono le regole "Logica dei form", "Percorsi a passaggi" ed "Email, link e password" di [regole-ux.md](../regole-ux.md). Nel dettaglio:

- Continua resta disattivo finché il passaggio non è completo e valido. I campi vuoti non diventano mai rossi.
- L'email già registrata si scopre al blur: messaggio con "Accedi" e Continua bloccato.
- I domini scritti male vengono suggeriti con un clic per correggere.
- I requisiti della password si spuntano mentre si scrive. La conferma diversa si segnala all'uscita dal campo.
- Una scelta singola avanza dopo 260 ms; i tasti 1-9 scelgono l'opzione.
- Indietro conserva tutto, e anche ricaricando la pagina non si perde nulla, tranne le password.
- La partita IVA facoltativa, se scritta, viene controllata con la cifra di controllo.
- Il telefono facoltativo, se scritto, deve avere la lunghezza giusta per il prefisso.

## Stati e come provarli (dati finti)

| Stato | Come provarlo |
|---|---|
| Email già registrata | `esistente@demo.it` |
| Suggerimento del dominio | `nome@gmial.com` |
| Link valido (verifica all'inizio) | "Apri il link ricevuto" nel pannello, oppure `#/verifica-email/valido` |
| Link valido (verifica alla fine) | `#/verifica-email/valido-dopo` |
| Link scaduto | `#/verifica-email/scaduto` → "Richiedi un nuovo link" |
| Link già usato | `#/verifica-email/usato` → "Accedi" |

L'indice di tutti i percorsi è in `#/anteprima`.

## Schermate (chiaro | scuro)

| | |
|---|---|
| Email con suggerimento | ![](img/reg-A1-suggerimento.png) |
| Link inviato | ![](img/reg-A2-email-inviata.png) |
| Password con requisiti, email confermata | ![](img/reg-A3-password-requisiti.png) |
| Scelta singola | ![](img/reg-A4-profilo.png) |
| Scelta multipla | ![](img/reg-A6-interessi.png) |
| Telefono con prefisso | ![](img/reg-A7-telefono.png) |
| Consensi | ![](img/reg-A8-consensi.png) |
| Account pronto | ![](img/reg-A9-pronto.png) |
| Email confermata (verifica alla fine) | ![](img/reg-B-confermata.png) |
| Link scaduto | ![](img/reg-L-scaduto.png) |
