# Testi e riferimenti

Chi usa la piattaforma legge frasi, non dati interni. La regola vale per etichette, notifiche, toast, email, export, stati vuoti ed errori.

## Mai nell'interfaccia

- identificativi interni: UUID, hash, chiavi come `practice_d799a0a3ad6d`, id di tabella;
- nomi di endpoint, tabelle, campi del database, formati (JSON), meccanismi (webhook, cron);
- chiavi di stato del backend (`picked_up`, `assigned`) o parole inglesi mescolate;
- date ISO (`2026-11-06`): si scrive «6 novembre» o «gio 6 nov, 9:30»;
- testi d'ambiente o di prova: «collaudo», «V2», «email disattivate», «Lorem ipsum», nomi di account fittizi;
- testi generici: «Nessun elemento in questa vista», «Errore», «Operazione completata».

## Riferimenti operativi: sì, leggibili

Un codice che l'utente usa davvero (numero d'ordine, codice pratica, codice prodotto) si mostra
**con un'etichetta** e possibilmente come link: «Richiesta R-1041», «Codice articolo 4521».
Un identificativo che serve solo al sistema resta nel link o nei dati, mai nel testo.

| Sbagliato | Corretto |
|---|---|
| Riferimento: practice_d799a0a3ad6d. Data: 2026-11-06. Residuo assigned: 2. | Residuo di 2 sacchi assegnato · Pratica del 6 novembre · **Apri** |
| Offerta UI V2 1793670971 | Sconto 10% su adesivo per piastrelle |
| Errore 503 — servizio non disponibile | Non riusciamo a caricare gli ordini · **Riprova** |
| Nessun elemento in questa vista | Ancora nessun ordine · **Nuovo ordine** |
| Ambiente V2 di collaudo · email disattivate | (nulla: l'ambiente si segnala fuori dall'interfaccia) |

## Testi composti dal backend

Se il backend invia frasi già pronte con identificativi o parole inglesi, il frontend **compone
il testo dai campi strutturati** (prodotto, quantità, data, collegamento) invece di mostrarle.
Cambiare il testo nel backend è possibile solo se non tocca logica e dati, e va concordato.

## Dati di prova e screenshot

Le revisioni si fanno con dati plausibili del dominio. Uno screenshot con «Domanda fittizia di
collaudo case6ae940b7» non è una prova di come apparirà la pagina.

Il controllo `python3 -I scripts/verify-ui-rules.py` trova i casi più comuni; la lettura delle schermate resta obbligatoria.
