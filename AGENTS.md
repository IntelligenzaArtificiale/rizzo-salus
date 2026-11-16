# Gestionale Rizzo · nuova interfaccia dal boilerplate

Questa è la copia indipendente in `gestionale-rizzo-boilerplate`. L'originale in
`../gestionale-demo` e il suo server su 127.0.0.1:8080 sono in sola lettura.
La copia si avvia con ./avvia.sh su **http://localhost:8081**. Il diverso hostname
isola anche i cookie. Dati, backup e configurazione privata appartengono alla copia.

Leggere README.md e docs/redesign/inventario.md, contratti.md, mappa-componenti.csv,
eccezioni.md e verifica.md, revisione-ux.md prima delle modifiche. Le guide tecniche del boilerplate
restano riferimenti del catalogo, ma le vecchie rotte Richieste/Blog e i mock non
sono registrati. Entry point attivo: src/App.tsx. Dominio UI: src/clinic.

Backend PHP in api/ copiato senza modifiche. Non cambiare regole, permessi, schema,
calcoli o transizioni per adattarli all'interfaccia. I contratti effettivi sono in
api/src/Http/Routes.php e nei controller, non negli esempi del boilerplate.
Client reale: src/clinic/api.ts, con cookie e CSRF; nessun fallback mock.

Usare 1:1 i componenti di src/components/{atoms,primitives,site} e i wrapper
app/form/feedback. Vendor e CSS di src/app/beautifui invariati rispetto allo ZIP.
Nuove necessità si compongono dai componenti esistenti e si documentano; niente
seconda libreria UI. Calendario: eccezione già motivata in docs/redesign/eccezioni.md.
File applicativi sotto 400 righe; PHP originale e vendor non si ristrutturano per
una modifica di UI. Conservare marchio, font Inter e token chiaro/scuro.

Verifiche: npm ci, npm run build, npm run lint,
python3 -I scripts/verify-ui-rules.py. Il collaudo attuale scripts/verify-clinic-ux.py scrive soltanto sul server QA
8082 con DATA_DIR/BACKUP_DIR separati in .runtime/qa. Non eseguirlo su dati in uso.
Lo script verify-clinic.py è storico e bloccato per default.
Il report corrente riguarda le prove eseguite, non un'approvazione utente o una
certificazione di accessibilità. Documentare warning e limiti senza occultarli.

Non pubblicare .env, dati, backup, .runtime o chiavi. Nessuna chiave in VITE_* o
app-config.js. Nessun deploy remoto implicito. Rigenerare scripts/catalogue.py e
scripts/refresh-graph.py dopo le modifiche. Escludere sempre dati privati e vendor
dal grafo; non copiare quello del template.

## Estensione autorizzata dalla call del 09/11/2026
La richiesta utente successiva autorizza a completare anche il backend di questa
copia per le funzionalità concordate nella trascrizione, oltre il solo redesign.
Le regole preesistenti si preservano salvo decisioni finali esplicite della call.
Originale 8080 sempre in sola lettura; vendor del boilerplate invariato.
Perimetro e verifiche correnti in docs/progress.md e docs/riunione-2026-11-09/.
