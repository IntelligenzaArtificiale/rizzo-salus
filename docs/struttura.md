# Struttura

```
src/
├── main.tsx                 avvio: font, stili, tema, App
├── App.tsx                  router hash "data" (Aruba), memory per anteprime
├── routes/                  site.tsx · auth.tsx · app.tsx · dev.tsx (superfici)
├── email/                   layout, template HTML e testo, anteprima
├── config/                  app.ts (nome, URL API, router, modo registrazione), navigation.ts (menu per ruolo), registration-steps.ts
├── api/
│   ├── client.ts            unico punto di uscita verso il backend (o il mock)
│   ├── auth.ts              chiamate di autenticazione
│   └── mock/                backend finto, attivo solo senza VITE_API_BASE_URL
├── app/beautifui/           CSS di Beautiful UI (vendor, non modificare; vedi PATCH.md)
├── components/
│   ├── atoms/               atomi Beautiful UI (Button, Switch, StatusPill…) — vendor
│   ├── primitives/          i 21 componenti Beautiful UI — vendor
│   ├── site/                ThemeToggle di Beautiful UI — vendor
│   ├── icons/central.tsx    adattatore icone Lucide per SidebarNav
│   ├── form/                campi derivati: TextField, PasswordField, Checkbox
│   ├── feedback/            toast
│   ├── navigation/          SmartLink
│   ├── app/                 pezzi dell'area riservata: intestazione, conferma, stati, ricerca
│   └── brand/               marchio della piattaforma
├── layouts/                 AuthLayout (accesso), AppLayout (area riservata)
├── pages/
│   ├── auth/                accesso, registrazione, password
│   ├── dashboard/           dashboard amministratore e utente, dati delle card
│   ├── requests/            entità d'esempio: elenco, scheda, nuova/modifica
│   ├── users/ admin/        utenti, registro, statistiche, impostazioni
│   ├── notifications/ profile/ assistant/ errors/ dev/
│   └── …                    pagine: solo orchestrazione, niente stili propri
├── lib/                     validazione, sessione, tema, testi dei messaggi
└── styles/                  globals.css (ordine import), tema.css, fonts.ts
```

## Regole

- **Vendor intoccabile.** `components/atoms`, `components/primitives`, `components/site` e `app/beautifui` sono di Beautiful UI. Si personalizza da `styles/tema.css` o con un wrapper in `components/`. Le uniche modifiche sono in `app/beautifui/PATCH.md`.
- **Riusare prima di sviluppare.** Prima un componente Beautiful UI, poi una sua classe o un suo token, solo alla fine un componente derivato in `components/<area>/`.
- **Una pagina orchestra, non implementa.** Stato e chiamate sì, markup ripetuto no: se un blocco serve due volte diventa componente.
- **File sotto le 400 righe.** I file vendor sono esclusi.
- **Niente URL o percorsi nel codice.** Tutto passa da `config/app.ts`, `app-config.js` e dalle variabili `VITE_*` di build.

## Aggiungere una pagina

1. Creare `src/pages/<area>/<Nome>Page.tsx` e registrare la rotta nel file della sua superficie in `src/routes/` (sito, accesso o app).
2. Per i dati, aggiungere la chiamata in `src/api/<area>.ts` e la risposta finta in `src/api/mock/`.
3. Scrivere la scheda `docs/pagine/<nome>.md` con gli screenshot chiaro e scuro.
4. Aggiornare `docs/componenti.md` con i componenti usati.
