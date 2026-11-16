# Verifica dell'interfaccia

Una build riuscita, l'assenza di overflow e uno screenshot acquisito **non** sono una revisione superata.
La verifica ha due parti separate, ciascuna con il proprio esito.

## 1. Verifica funzionale

- `npm run build` e `npm run lint` senza errori.
- `python3 -I scripts/verify-ui-rules.py`: testi tecnici, superfici, doppioni.
- `python3 -I scripts/verify-vendor.py <clone>`: provenienza dei componenti Beautiful UI.
- Flussi principali da browser: creazione, modifica (con avviso di uscita), eliminazione con conferma, permessi negati, errori di rete simulati, doppio clic sull'invio.
- Tastiera: Tab in ordine, menu con frecce ed Esc, focus visibile, modali che restituiscono il focus.
- Riduci movimento attivo: nessuna animazione continua, attese comprensibili dal testo.

## 2. Revisione visiva (pagina per pagina)

Per ogni pagina, in desktop e mobile, chiaro e scuro, rispondere per iscritto:

1. La superficie è giusta (sito, accesso, app)? C'è una sidebar dove non deve?
2. Ogni blocco usa il componente indicato in `docs/mapping.md`? Gli stati sono StatusPill?
3. Ci sono testi tecnici, codici, date ISO, testi di prova o d'ambiente?
4. I campi visibili nell'originale ci sono ancora (redesign)?
5. Logo e marchio sono corretti in entrambi i temi?
6. Vuoto, errore e caricamento hanno testi utili?
7. C'è una sola azione principale, con lo stesso stile delle altre pagine?

Una pagina passa solo con tutte le risposte positive. Le eccezioni si scrivono con motivo ed evidenza.
