# Ricerca e header

La barra non simula più un campo di testo. Un comando compatto «Cerca», con
icona e scorciatoia, apre il componente SearchList già incluso in Beautiful UI.
Compare soltanto nelle dashboard `/admin` e `/area`, se il modulo ricerca è acceso.
La scelta è centralizzata in `src/config/search.ts`: aggiungere una rotta solo
quando c'è un uso trasversale motivato, non come default per tutte le pagine.

Nelle liste usare i filtri locali; nei form, nel profilo, nelle impostazioni,
nei dettagli e nell'assistente non compare la ricerca globale. La ricerca della
cronologia dell'assistente resta nella sidebar. Nessuna scorciatoia globale è
registrata quando GlobalSearch non è montato.

Il comando cerca nelle pagine consentite dalla navigazione e nelle richieste
restituite dall'API. Il server deve limitare sempre i risultati a ruolo e utente:
la ricerca client non conferisce nuovi permessi. Non è una ricerca full-text
server su tutti i dati. Le richieste vengono caricate all'apertura, non al login.
Ogni apertura aggiorna i risultati; i fallimenti mostrano Riprova e lasciano
ricercabili le pagine. Le risposte tardive dopo la chiusura vengono ignorate.

Tastiera: Ctrl+K o ⌘+K sulle dashboard (fuori da un campo di editing), autofocus
nel campo, frecce su/giù fra campo e risultati, Invio sceglie, Esc chiude e riporta
il focus al comando. Tab resta nella normale sequenza; uscendo dal contenitore
il pannello si chiude. Click esterno e pulsante Chiudi chiudono il pannello.
Il pannello è un dialogo non modale, ancorato a destra, largo al massimo 360px
e limitato alla larghezza del telefono. I componenti vendor non sono modificati.

Screenshot aggiornati in `docs/verifica/`; le schede originali con immagini in
`docs/pagine/img/` sono riferimenti storici delle altre schermate, non prove
aggiornate del nuovo header.
