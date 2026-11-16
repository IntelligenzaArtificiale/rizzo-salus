# Configurazione e trasferimento

## Due configurazioni, nessun segreto nel frontend

`public/app-config.js` viene copiato in `dist/app-config.js` senza essere inglobato
nel bundle. Viene caricato prima dell'app. Le sue chiavi `name`, `apiBaseUrl` e
`supportEmail` prevalgono sulle rispettive variabili VITE della build. Non ci sono
espansioni automatiche di variabili. Esempio:

```js
window.__APP_CONFIG__ = {
  name: "Nome cliente",
  apiBaseUrl: "./api",
  supportEmail: "assistenza@dominio.it"
};
```

La base API relativa `./api` segue la cartella di index.html anche con HashRouter;
una base assoluta è ammessa ma deve essere aggiornata quando cambia il dominio.
La stringa vuota abilita la demo, non un backend di produzione. Impostazioni
VITE_ROUTER e VITE_REGISTRATION_MODE restano opzioni di build; cambiarle richiede
ricompilazione. Le impostazioni brand runtime vengono dal backend/mock e sono
separate dal titolo fallback di config/app.ts: configurare il marchio in defaults
o nel backend, non soltanto app-config.js.

Tutto ciò che ha prefisso VITE e tutto app-config.js è pubblico. Password, chiavi
AI, SMTP e database appartengono al backend/secret store. Non caricare .deploy
nella document root. Usare accessi e template della skill deploy ove disponibili.

## Da una cartella a un'altra

1. Eseguire `npm ci` e `npm run build` con Node >= 22.12.0 (testato su 22.23.1).
2. Caricare solo il contenuto di dist nella destinazione autorizzata.
3. Con router hash e asset relativi, la stessa build passa da `/app/` a `/altra/`
   o alla root. Modificare app-config.js se cambiano base API o contatti; invalidare
   la cache di quel file. Il server deve servire .js col tipo corretto e non
   applicare una cache immutable a index.html o app-config.js.
4. Verificare accesso, asset e chiamate API dopo il trasferimento. Database,
   upload, cookie Path/Domain, sessioni, CORS, CSRF e callback sono risorse del
   backend e vanno riconfigurate/migrate separatamente nel perimetro autorizzato.
5. Nei messaggi email il backend costruisce i link dalla propria APP_URL con la
   nuova base (`https://dominio.it/altra/#/...`); mittente e MAIL_DOMAIN dipendono
   dal dominio verificato. Non ricavare il mittente da un Host non attendibile.

Per il trasferimento non serve Node sul server che ospita il frontend statico.
Il backend PHP non è incluso: il dist originale resta una demo senza API reale.
La pagina privacy è un segnaposto da sostituire con i contenuti del progetto.
Il blog a hash non offre SEO server completa: vedi api.md e funzioni.md.
