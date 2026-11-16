# Rizzo Salus - gestionale e demo locale

Frontend React/TypeScript e backend PHP del poliambulatorio. Include l'ultima versione del Calendar: viste giorno/due giorni/settimana, gruppi 5/4/1, disponibilità e risorse, note, proposte con conferma e conteggi delle ore. La nuova installazione applica automaticamente il profilo Calendar del 10 novembre 2026.

## Avvio rapido dopo il clone

Servono **Git, Node.js 22.12+ con npm, PHP 8.3+ e Composer 2**. PHP deve avere le estensioni **sodium, mbstring, dom, gd e zip** abilitate nella versione CLI. Non serve configurare MySQL: l'applicazione usa un archivio cifrato su file.

```bash
git clone https://github.com/IntelligenzaArtificiale/rizzo-salus.git
cd rizzo-salus
./avvia.sh
```

Aprire **[http://localhost:8081/#/accedi](http://localhost:8081/#/accedi)**. Tenere aperto il terminale del server; **Ctrl+C** lo arresta. Il link funziona sul computer dove si avvia il progetto.

Al primo avvio lo script:

1. Controlla PHP, estensioni, npm e porta.
2. Installa le dipendenze PHP con Composer e quelle frontend con `npm ci`, se mancanti.
3. Compila il frontend corrente con `npm run build`.
4. Genera configurazione privata, chiavi casuali, utenti, pazienti e appuntamenti di esempio, applicando il profilo Calendar aggiornato.
5. Avvia il server su `127.0.0.1:8081`. Su Linux/WSL avvia anche l'attivatore periodico locale, che termina insieme al server.

Gli avvii successivi conservano i dati e ricompilano il frontend. **Non cancellano né reinizializzano l'archivio esistente.**

## Account dimostrativi

Password comune: **`DemoPassword2026`**.

| Ruolo | Email |
|---|---|
| Titolare | `titolare@demo.it` |
| Segreteria | `segreteria@demo.it` |
| Fisioterapista | `fisio@demo.it` |
| Medico | `medico@demo.it` |

Sono credenziali pubbliche per la sola demo locale, con dati sintetici creati dal generatore. Titolare e segreteria gestiscono l'agenda; i clinici consultano la propria. Per un uso reale vanno configurati utenti, dati e accessi della struttura.

Chiara non viene pianificata finché non si confermano i giorni; il venerdì di Antonio resta chiuso e la pompa diamagnetica non assistita disattivata. Tutto è inseribile da **Impostazioni → Cataloghi / Calendar**. Il pianificatore a vincoli funziona senza chiavi AI esterne.

## Preparazione manuale e Windows

Per installare separatamente le dipendenze e verificare l'ambiente:

```bash
php demo/verifica-runtime.php
composer install --working-dir=api --no-interaction --prefer-dist
npm ci
npm run build
./avvia.sh
```

Su Windows si può usare **WSL** con gli stessi comandi. Con PHP, Composer, Node e Git installati nativamente e disponibili nel terminale, usare **`avvia.bat`**. Abilitare le estensioni nel `php.ini` della CLI (`php --ini`). Il launcher Windows nativo non avvia automaticamente il processo periodico; lo stesso vale per macOS, dove `/proc` non è disponibile. Per eseguirne manualmente un ciclo, da un secondo terminale con PHP configurato:

```bash
# Linux/macOS/WSL
APP_ENV_FILE="$PWD/demo/.env.demo" php api/bin/tick.php
```

```powershell
# PowerShell nativo
$env:APP_ENV_FILE = (Resolve-Path demo/.env.demo).Path
$env:DATA_DIR = "../demo/dati"
php api/bin/tick.php
```

La guida Windows nativa è fornita per il launcher; la verifica completa da installazione pulita è eseguita su Linux. Nessun servizio esterno è necessario per esplorare la demo: i messaggi restano in modalità prova e i connettori fiscali non sono attivati.

## Porta diversa e sviluppo

```bash
PORT=8083 ./avvia.sh
```

In Windows: `set PORT=8083` prima di `avvia.bat`. Per cambiare il binario PHP su Linux/macOS: `PHP_BIN=/percorso/php ./avvia.sh`.

Il frontend può essere sviluppato con Vite mentre il backend rimane avviato:

```bash
npm run dev
```

Aprire l'indirizzo stampato da Vite. Le richieste `/api` vengono inoltrate al backend su 8081; per una porta diversa usare, per esempio, `LOCAL_API_TARGET=http://127.0.0.1:8083 npm run dev`. La versione servita da PHP si aggiorna al riavvio di `avvia.sh` oppure dopo `npm run build`.

## File e dati locali

- `src/clinic`: interfaccia del gestionale; `src/components`: componenti del boilerplate, con relativa licenza.
- `api/src`: API, permessi, dominio e archivio; `api/resources`: schemi e certificato pubblico dei tracciati.
- `demo/prepara.php`: generatore dei dati sintetici; `demo/.env.demo`: configurazione privata generata sul computer.
- `demo/dati`, `demo/backup`: archivio e backup locali; `.runtime`: log e strumenti privati.
- `dist`: build generata, `api/vendor` e `node_modules`: dipendenze installate.

Configurazioni private, chiavi, dati, backup, runtime, dipendenze e build sono esclusi da Git. Il clone **non** contiene una copia dei dati già presenti sul computer di sviluppo: crea dati nuovi. Non copiare chiavi in variabili `VITE_*` o in `public/app-config.js`. Non lanciare il vecchio `demo/router.php`: l'entry point locale aggiornato è `router.php` nella radice.

L'originale storico `gestionale-demo` e la sua eventuale porta 8080 sono indipendenti. Questa applicazione non richiede quella cartella e non la modifica. Usare `localhost` mantiene anche i cookie separati dall'originale su `127.0.0.1`.

## Problemi comuni

- **La pagina non si apre:** controllare che il terminale mostri `Development Server started`, lasciarlo aperto e usare il link con la porta stampata. Se la porta è occupata, sceglierne un'altra con `PORT`.
- **PHP o estensioni mancanti:** eseguire `php demo/verifica-runtime.php`, controllare `php -m` e `php --ini`, installare/abilitare le estensioni richieste per la CLI.
- **Composer/npm mancanti:** installare Composer 2 e Node.js 22.12+; riaprire il terminale e ripetere l'avvio. Il primo avvio richiede accesso ai registri Composer/npm.
- **La UI sembra precedente:** riavviare con `./avvia.sh` e ricaricare la pagina; lo script ricompila il sorgente corrente.
- **Accesso non riuscito su un archivio già utilizzato:** le credenziali sopra si riferiscono ai dati creati dal generatore; l'avvio conserva gli utenti e le password già modificati.

## Verifiche e documentazione

```bash
npm run build
npm run lint
python3 -I scripts/verify-ui-rules.py
php scripts/test-calendar-domain.php
php scripts/test-call-domain.php
```

Python 3 serve solo per gli strumenti di verifica, non per eseguire l'applicazione. Le due suite PHP creano dataset isolati sotto `.runtime/qa`; i test browser devono usare esclusivamente il server QA 8082 con dati separati, mai la demo in uso. Playwright/Chrome serve soltanto ai collaudi browser.

[Guida Calendar](docs/specifiche-2026-11-11/guida.md), [conferme e attivazioni pendenti](docs/specifiche-2026-11-11/checklist-bloccanti.md), [verifiche Calendar](docs/specifiche-2026-11-11/verifica.md), [guida del titolare](docs/riunione-2026-11-09/guida-titolare.md). I report storici possono riferirsi a schermate, materiali o percorsi privati conservati solo sul computer di sviluppo.

Il server PHP integrato è destinato all'avvio locale. Hosting, dominio, HTTPS, processo periodico e collegamenti SMS/Aruba/TS/AI si configurano separatamente per un rilascio effettivo. Listini, modelli e account dimostrativi non sono dati operativi della struttura.
