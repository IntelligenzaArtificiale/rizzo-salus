# Superfici: sito, accesso, app

Ogni rotta appartiene a una sola superficie. La cornice si sceglie dalla superficie, non dalla comodità.

| Superficie | File delle rotte | Cornice | Contenuto |
|---|---|---|---|
| **Sito** (pubblico) | `src/routes/site.tsx` | `SiteLayout` | blog, note legali, cataloghi o offerte consultabili senza account |
| **Accesso** | `src/routes/auth.tsx` | `AuthLayout` | accedi, registrazione, verifica email, password, errori di accesso |
| **App** (riservata) | `src/routes/app.tsx` | `RequireAuth` + `AppLayout` | dashboard, elenchi, dettagli, moduli, assistente |
| Anteprima | `src/routes/dev.tsx` | `DevLayout` | guide e prove, solo con API simulate |

## La landing non è nel boilerplate

La home pubblica di un progetto (hero, prova, offerta, CTA) si progetta a parte con la skill
**Hallmark** o **Design Taste** e con il marchio del cliente. Può essere una pagina React in
`src/routes/site.tsx` (dentro `SiteLayout` o con una cornice propria senza sidebar) oppure un
HTML statico servito dal backend. Il boilerplate entra in gioco **dalla CTA** «Registrati» o
«Accedi»: i link puntano a `#/registrazione` e `#/accedi`.

## Regole bloccanti

1. `SidebarNav` e `AppLayout` compaiono solo nelle rotte di `routes/app.tsx`.
2. Nel sito nessun elemento dell'area riservata: niente «Crea il tuo account» nel piede di una sidebar, niente pulsante per comprimere menu, niente header con il nome dell'account.
3. Le pagine pubbliche con dati (catalogo, offerte) usano comunque i componenti del catalogo (EntityCard, tabelle, Pagination) dentro `SiteLayout wide`.
4. L'accesso ha una sola azione principale e nessun «Annulla».
5. `/` porta alla dashboard del ruolo con sessione, altrimenti alla pagina iniziale scelta (`HomeRedirect`).

Il controllo `python3 -I scripts/verify-ui-rules.py` segnala le cornici dell'app nelle superfici sbagliate.

## Errori tipici

| Sbagliato | Corretto |
|---|---|
| Landing dentro l'app con sidebar «Catalogo · Offerte · Accedi» | Landing progettata a parte, sito con header orizzontale |
| Card con elenco numerato al posto della landing | Sezioni editoriali (Hallmark / Design Taste) con la CTA verso la registrazione |
| Header dell'app con testo d'ambiente o nome dell'account di prova | Header con soli comandi: menu, ricerca dove serve, tema |
