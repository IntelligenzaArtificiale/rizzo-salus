# Demo su hosting Apache/PHP

Destinazione richiesta: https://www.stop-paper.it/rizzo-salus/.
Confine FTP confermato dall'utente: `/www.stop-paper.it/rizzo-salus`.
Non elencare o modificare root, directory superiori, altri siti, DNS o impostazioni globali.
Il collegamento FTP sulla porta 21 è quello indicato esplicitamente dall'utente.
Gli accessi sono soltanto in `.deploy/deploy.env`, escluso da Git e con permessi 0600.

## Struttura e preparazione

Il pacchetto contiene l'ingresso `index.php`, `.htaccess`, asset della build e `app-config.js` pubblici.
Codice PHP, dipendenze, modelli e frontend HTML stanno in `private/`; l'archivio, il backup e `.env` in `private/runtime/`.
Due regole Apache negano l'accesso HTTP al privato: nella radice e nella cartella stessa.
Le negazioni devono essere provate sul server **prima** di trasferire configurazioni e dati.
Non caricare l'intero repository, il dossier commerciale, `.deploy`, il runtime locale o i dati della demo in uso.

```bash
npm run build
python3 scripts/prepare-hosting.py --url https://www.stop-paper.it/rizzo-salus --output .deploy/release-nuova --with-local-ai
```

La cartella di output deve essere nuova. Il preparatore genera dati sintetici e nuove chiavi di cifratura.
L'opzione `--with-local-ai` legge soltanto la credenziale AI già configurata, la ricifra nel nuovo archivio e non la stampa.
Non copia pazienti, sessioni, backup o altre credenziali dalla demo locale.
Il modello verificato è gpt-4.1-mini; i tetti applicativi sono 5 euro/giorno e 5 euro/mese, basati sulla stima del gestionale.
SMS ed email restano in prova; Aruba e Sistema TS non vengono attivati.

Configurare `LOCAL_BUILD_PATH` in `.deploy/deploy.env` sul pacchetto preparato.
Sono richiesti PHP 8.2+ ed estensioni calendar, sodium, mbstring, dom, gd, zip; per AI curl/openssl.
Il server è stato rilevato con PHP 8.2.35. Il minimo Composer è stato adeguato dopo collaudo su PHP 8.2.32;
le versioni e i riferimenti delle dipendenze sono rimasti invariati. Nessuna modifica al selettore PHP del dominio.
Il database è un archivio cifrato dedicato su file: nessun database SQL, tabella o tenant condiviso.

## Pubblicazione, backup e ripristino

La prima ispezione della sola directory autorizzata l'ha trovata vuota.
Prima dei file runtime, verificare la corrispondenza FTP/HTTPS con un file casuale innocuo e il rifiuto HTTP di un file in `private/`;
rimuovere poi i file di prova. La verifica locale è registrata in `.deploy/preflight.json`.

```bash
python3 scripts/upload-hosting.py
```

Lo script verifica il percorso effettivo, rifiuta collegamenti simbolici, salva un backup locale dei soli file presenti nella cartella
in `.deploy/backup/<data-ora>/` e non cancella file remoti. Se trova `private/runtime/.env`, conserva integralmente il runtime esistente.
L'ingresso pubblico viene sostituito con rinomina soltanto al termine dei trasferimenti.
Non ripetere il seed sul server, non sovrascrivere la chiave di cifratura di un archivio esistente, non azzerare dati per collaudare.

Ripristino concreto, usando il percorso del backup riportato da `.deploy/pubblicazione.json`:

```bash
python3 scripts/upload-hosting.py --rollback .deploy/backup/DATA-ORA
```

Il comando controlla destinazione e hash, ripristina i file precedenti e conserva il runtime.
Se prima non esisteva alcuna applicazione, espone una pagina di manutenzione 503 senza cancellare dati o file nuovi.
Non ripristinare snapshot di dati sopra scritture effettuate dai tester.

## URL, trasferibilità e controlli

`APP_ORIGIN` contiene schema/host/porta, `APP_BASE_PATH` il percorso senza slash finale, `APP_URL` la loro concatenazione coerente.
`PublicUrl` centralizza URL di messaggi, primo accesso e recupero password, prefisso API e Path del cookie.
I percorsi relativi `DATA_DIR=../runtime/data` e `BACKUP_DIR=../runtime/backup` sono risolti rispetto all'API.
La chiave e il token periodico sono nel file runtime privato, mai in `app-config.js` o in variabili VITE.

La build usa asset relativi, router hash e API `./api`: può essere trasferita senza ricompilazione per il solo cambio di dominio/base.
Aggiornare la configurazione runtime e verificare HTTPS e isolamento. Dominio, eventuali account esterni e processo periodico non si trasferiscono copiando file.
Nessun mittente email è stato attivato e nessuna email reale è stata inviata.
Per l'uso operativo vanno configurati separatamente account della struttura e attivatore periodico; la demo consente prove manuali dal pannello.

Verificare `/health`, asset JS/CSS, login e ricaricamento, calendario, quattro ruoli, cookie Secure/HttpOnly/SameSite e logout,
rifiuto HTTP di `.env`, codice e dati, download autorizzati e assistente con una domanda reale.
Non dichiarare pubblicato il sito prima del collaudo HTTPS.

Prima della pubblicazione sono passati 107 controlli di dominio, 50 Calendar, 10 assistente e 23 URL su PHP 8.2; sintassi di 141 file PHP senza errori. Verificati su Apache/PHP 8.2 login, ricaricamento, agenda, cookie e logout, negazione del privato e redirect del link pubblico in root, `/app`, `/altra` e `/app` su un secondo host, con dati QA separati.

## Esito del 16 novembre 2026

Pubblicata e verificata in HTTPS la revisione `7d49179`, esclusivamente nella cartella autorizzata. Superate 39 verifiche online: quattro accessi/ricaricamenti/logout, cookie sicuri con Path dedicato, API agenda, rifiuto del privato, CSRF, permessi, download CSV, risposta reale OpenAI coerente con i conteggi, agenda mobile senza overflow. Nessuna eccezione JavaScript rilevata. Ispezionate le schermate agenda desktop/mobile e assistente. [Report](deploy-verificato-2026-11-16.json).

Il dataset è sintetico e indipendente da quello locale. La credenziale AI è ricifrata nel runtime remoto; la configurazione privata e i dati non sono nel repository. SMS/email e servizi fiscali non sono stati attivati. Il backup locale prima del caricamento è `.deploy/backup/20261116-191238`; il manifesto iniziale della cartella vuota resta nel dossier privato.

## Rilascio del 17 novembre 2026

Pacchetto `.deploy/release-formazione-20261117-finale`, 873 file, pubblicato con la procedura esistente nella sola cartella autorizzata. Backup recuperabile `.deploy/backup/20261117-132802`; runtime remoto, chiave e dati conservati. Prima del rilascio creato anche backup applicativo remoto. Ripristino del solo codice: `python3 scripts/upload-hosting.py --rollback .deploy/backup/20261117-132802`.

25 verifiche HTTPS: 10 pazienti e 59 appuntamenti precedenti conservati, orari/stati invariati, nuovi gruppi aggiuntivi e procedura di esempio, viewport, menu, protezione del privato e cookie, estrazione PDF via CDN, formazione interrogata con AI reale e modifica del solo paziente dimostrativo confermata nell’interfaccia. Il recapito di prova è stato poi ripristinato. Provato upload effettivo di 50 MiB; rimossi soltanto il documento temporaneo e i suoi due file privati identificati. JS/CSS remoti corrispondono via SHA-256 alla build. [Report](verifica-formazione-2026-11-17.json).

La configurazione `.user.ini` è limitata al progetto, con richieste fino a 80M, upload 50M e memoria 512M. Nessuna configurazione globale del server o altro sito modificata. Le librerie CDN di Formazione sono esterne e versionate; al trasferimento serve accesso HTTPS a cdnjs.cloudflare.com e cdn.jsdelivr.net. Rotte, download e asset mantengono la base centralizzata dell’applicazione.
