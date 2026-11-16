# Moduli, marchio, SEO, ruoli e registro

Tutto passa da `src/lib/platform/`: `defaults.ts` contiene i valori del boilerplate, `PlatformContext.tsx` li carica dall'API all'avvio e li rende disponibili all'app.

```tsx
const { settings, on, can, update } = usePlatform();
on("blog")               // il modulo è acceso?
can("richieste.elimina") // l'utente collegato ha il permesso?
update({ brand: {...} }) // salva e applica subito
```

## Moduli

| Modulo | Cosa sparisce se spento |
|---|---|
| registrazione | Link "Crea un account", pagina di registrazione |
| assistente | Voce di menu e pagina |
| dettatura | Microfono nella Prompt Bar |
| letturaVoce | "Ascolta" sotto le risposte |
| blog | Pagine pubbliche, gestione e link nel footer |
| notifiche | Voce, contatore e pagina |
| upload | Tutti i campi di caricamento |
| ricerca | Comando Cerca nelle sole dashboard; filtri locali altrove |
| temaScuro | Cambio tema, sempre chiaro |

- **Default per progetto:** si cambiano in `defaults.ts`.
- **Durante l'uso:** l'admin li cambia da Impostazioni › Moduli.
- **Nel codice:** un modulo nuovo si aggiunge a `FEATURES` e si usa con `<Feature name="…">` (parti di pagina), `RequireAuth feature=…` (rotte) e `feature` in `config/navigation.ts` (menu).

## Marchio (white label)

Impostazioni › Marchio: nome, logo (caricamento), colore principale, email, telefono e indirizzo.

- **Colore:** diventa i token di Beautiful UI `--accent`, `--accent-ink` e `--accent-tint` (`brandColors.ts`). La pagina mostra il contrasto del testo bianco sul colore scelto e avvisa sotto 4.5:1.
- **Logo:** lo usano `BrandMark` e `BrandLogo` (sidebar, accesso, pagine pubbliche).
- **Contatti:** compaiono nei footer.

## Ruoli e permessi (RBAC)

- **Elenco dei permessi:** `PERMISSIONS` in `defaults.ts`, raggruppati.
- **Ruoli predefiniti:** Amministratore (tutto), Operatore e Cliente.
- **Matrice:** si modifica da Impostazioni › Ruoli. L'amministratore ha sempre tutti i permessi, così nessuno può chiudersi fuori.

Dove si applicano i permessi:
- **Menu:** `perm` sulle voci di `config/navigation.ts`.
- **Rotte:** `area(<Pagina />, "permesso")` in `src/routes/app.tsx`. Senza permesso si vede la pagina 403.
- **Bottoni:** `can("…")` nelle pagine, per esempio Modifica ed Elimina nella scheda della richiesta.

**Il backend deve rifare gli stessi controlli:** l'interfaccia nasconde, il server vieta.

## Registro attività

Ogni chiamata di scrittura riuscita (accesso, creazioni, modifiche, eliminazioni, impostazioni, caricamenti, password) produce una riga nel registro.

- **Regole d'esempio:** stanno in `src/api/mock/audit.mock.ts`.
- **Nel PHP:** la scrittura del registro va fatta lato server, nella stessa transazione del salvataggio, con chi, cosa, quando e i valori prima e dopo.

![](pagine/img/app-moduli.png)
![](pagine/img/app-marchio.png)
![](pagine/img/app-seo.png)
![](pagine/img/app-ruoli.png)
