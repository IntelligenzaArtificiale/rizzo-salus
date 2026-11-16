# Email

File in `src/email`: `layout.html` (cornice comune), `templates/<nome>.html` e `templates/<nome>.txt`
(versione solo testo), `catalog.ts` (oggetto, testo d'anteprima, azione, dati d'esempio), `render.ts`
(composizione per l'anteprima). Anteprima: **/anteprima/email**, con desktop/mobile, chiaro/scuro, HTML/testo.

## L'anteprima non invia

La pagina compone l'email nel browser e la mostra in un iframe isolato (`sandbox` senza script).
Non c'è un comando d'invio e non viene chiamata alcuna API. L'invio reale è compito del backend,
che usa gli stessi file e segnaposto `{{...}}`. Nessun test d'invio verso indirizzi reali senza autorizzazione.

## Regole dei template

1. Layout a tabelle, larghezza 560 px, una colonna; sotto 620 px il padding si riduce.
2. Stili in linea e un blocco `<style>` in testa: è l'unica eccezione alla regola «niente CSS in linea», perché i client email ignorano i fogli esterni.
3. Marchio: logotipo (o simbolo, o nome in testo) con `alt` = nome del marchio; variante scura con `prefers-color-scheme`.
4. Un solo bottone d'azione con il colore del marchio e testo che dice cosa succede («Conferma email»); il link completo è nella versione testo.
5. Testo d'anteprima (preheader) diverso dall'oggetto.
6. Piede con nome, indirizzo, motivo dell'email e contatto.
7. Ogni template ha la sua versione `.txt` con lo stesso contenuto.
8. Valori dinamici sempre escapati; nessun identificativo interno (vedi [testi.md](testi.md)).

## Aggiungere un template

1. Creare `templates/<nome>.html` e `templates/<nome>.txt`.
2. Aggiungere la voce in `catalog.ts` con dati d'esempio plausibili.
3. Controllarlo nell'anteprima in quattro combinazioni (desktop/mobile × chiaro/scuro) e nella versione testo.
4. Nel backend: stesso file, stessi segnaposto, invio solo da server.
