# Sviluppo e redesign

La skill `piattaforma-boilerplate` inclusa in `.agents/skills/` è utilizzabile
localmente dal coding agent e trasportabile come cartella autonoma. Contiene
una copia ZIP dei sorgenti del template (senza ricorsione della skill stessa,
build, dipendenze o grafo), così funziona anche se installata globalmente.

## Nuovo progetto

Invocare «sviluppo da zero» indicando la directory vuota. La skill consulta
le guide e prepara la base col suo script, poi sviluppa le funzioni richieste
sui componenti inclusi. La preparazione iniziale non crea un backend reale né
trasforma Richieste e account demo nel dominio del cliente.

## Redesign

La skill chiede prima **originale con backup** oppure **nuova directory vuota**.
Ricostruisce interfaccia e UX, mantenendo regole, endpoint, schema/tabelle,
permessi, effetti delle azioni e dati. La cartella vuota serve al nuovo frontend;
le logiche provengono dal progetto esistente, non vengono inventate di nuovo.

Prima dello sviluppo compila inventario completo, mappa componenti per ogni
pagina/ruolo/stato, contratti del backend, brand originale e piano di migrazione.
Il riferimento nella skill definisce colonne e verifiche. Le alternative ai
componenti sono prima wrapper e composizioni del catalogo; un custom richiede
una lacuna concreta e documentata. Non si cambia marchio al cliente per
farlo assomigliare alla demo.

## Grafo

Il DB incluso in `.tokensave` fotografa il boilerplate finito. Non copiarlo come
indice di una nuova codebase: inizializzare il nuovo progetto e sincronizzarlo
alla fine. Le esclusioni devono restare attive anche nelle sincronizzazioni
successive, soprattutto per archivi, template, credenziali e dipendenze.

## Ricreare i pacchetti

Dopo build, documentazione, verifiche e refresh del grafo: `python3 scripts/package.py`.
Aggiorna il template sorgente autonomo nella skill e crea lo ZIP finale nella
cartella dist del contenitore superiore, con file SHA256 separato.
Per il solo template usare `--template-only`; per scegliere l'output `--out <zip>`.
L'archivio finale contiene src, documenti, skill, dist pronto e DB TokenSave,
senza node_modules, accessi, cache, backup e file di lavoro della macchina.
