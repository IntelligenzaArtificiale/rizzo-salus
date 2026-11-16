# Inventario prima della migrazione
Sorgente: gestionale-demo, copia (6). Sorgente e server 8080 in sola lettura.
Frontend osservato: console.js, 387 righe; pagine statiche Mappa, Decisioni e settimana pubblica.
Backend: API PHP, store cifrato su file; nessun database SQL da migrare.

| Area | Funzioni osservate | Ruoli / vincoli |
|---|---|---|
| Accesso | Login, sessione, uscita | Quattro account demo, permessi dal server |
| Agenda | Settimana, professionista, dettaglio, eseguita/assente/annulla, copia con anteprima | agenda.vedi_propria/tutto, modifica, segna_eseguita |
| Pazienti | Ricerca, scheda, anagrafica/contatti/consensi/clinica, creazione/modifica, duplicati | pazienti.anagrafica/essenziali/tutti/clinica |
| Percorsi | Diagnosi e avanzamento, proposta di pianificazione, approva/scarta | ai.pianificazione; controllo server su proprietà |
| Comunicazioni | Registro, variazioni, approva invio/chiamata, promemoria e coda | messaggi.invia |
| Statistiche | Settimana, totali, terapie e professionisti | agenda.vedi_tutto |
| Fatture | Elenco, proposta sedute, creazione/emissione, incasso, nota credito, PDF/XML, archivio e Sistema TS | fatture.gestisci; somme in centesimi, regole server |
| Profilo | Nome, password, avvio secondo fattore, permessi | Account corrente |
| Impostazioni | Struttura, ruoli, utenti, orari, messaggi, fatturazione, AI | impostazioni.gestisci |
| Assistente | Stato, suggerimenti per ruolo, domanda con ultimi 6 messaggi | Solo dati consentiti dal server |
| Mappa/Decisioni | Informazioni sullo stato dei moduli e scelte aperte | Materiali demo originali |
| Pubblico | Settimana personale con token | Nessuna sessione richiesta |

Per ogni pagina: caricamento, errore recuperabile, vuoto, successo; form con validazione, invio singolo e avviso modifiche. Funzioni non implementate nell'originale (documenti, magazzino, prenotazioni, importazione) restano indicate nella mappa, non simulate.
Notifiche esterne: modalità test nella copia, nessuna chiave AI copiata. Job e webhook restano implementazioni originali, nessun cron locale aggiunto.
