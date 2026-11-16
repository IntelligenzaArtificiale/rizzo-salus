# Password dimenticata, nuova password, nuovo link di conferma

| | |
|---|---|
| Rotte | `#/password-dimenticata`, `#/nuova-password/:token`, `#/conferma-email` |
| File | `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `ConfirmEmailRequestPage.tsx` in `src/pages/auth/` |
| Componenti | `EmailLinkRequest` (comune a password dimenticata e nuovo link di conferma), `EmailSentPanel`, `FieldsStep` con `password-new`, `StatusPanel`, `LoadingPanel` |
| API | password-dimenticata, nuova-password/verifica, nuova-password, reinvia-link ([api.md](../api.md)) |

## Percorso

1. **Password dimenticata.** L'email è già scritta se nota. "Invia il link" è attivo solo con un'email valida.
2. **Link inviato.** Il testo è neutro: "Se l'email è registrata riceverai un link…". Si può reinviare dopo 60 s o correggere l'email.
3. **Nuova password.** Il link viene controllato all'apertura. Il titolo indica l'account, la password ha i requisiti spuntati e la conferma.
4. **Salvataggio.** Si torna al login con l'email già scritta e il toast "Password aggiornata".
5. **Link scaduto o già usato.** Messaggio chiaro e "Richiedi un nuovo link".

**Nuovo link di conferma** (`#/conferma-email`) segue lo stesso schema per chi non ha confermato l'email. Ci si arriva dal toast del login "Conferma la tua email" o da un link di verifica scaduto.

## Come provarli (dati finti)

| Stato | Rotta |
|---|---|
| Richiesta | `#/password-dimenticata` |
| Link valido | `#/nuova-password/valido` |
| Link scaduto | `#/nuova-password/scaduto` |
| Link già usato | `#/nuova-password/usato` |

## Schermate (chiaro | scuro)

| | |
|---|---|
| Link inviato | ![](img/reg-P2-inviata.png) |
| Nuova password con conferma diversa | ![](img/reg-P3-nuova.png) |
