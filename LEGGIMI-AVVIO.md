# Avviare l'ultima demo

Dopo il clone di https://github.com/IntelligenzaArtificiale/rizzo-salus:

```bash
cd rizzo-salus
./avvia.sh
```

Richiede Node.js 22.12+, PHP 8.3+ con sodium/mbstring/dom/gd/zip e Composer 2. Lo script installa le dipendenze mancanti, ricompila e crea i dati dimostrativi senza cancellare quelli esistenti.

Aprire **http://localhost:8081/#/accedi** e lasciare aperto il terminale.

- Titolare: `titolare@demo.it`
- Segreteria: `segreteria@demo.it`
- Password demo comune: `DemoPassword2026`

Windows: WSL con gli stessi comandi oppure `avvia.bat` con i prerequisiti installati nativamente. Dettagli, altra porta e risoluzione problemi in [README.md](README.md).
