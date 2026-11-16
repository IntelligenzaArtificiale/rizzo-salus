# Funzioni pronte: caricamenti, risorse incorporate, voce, paginazione, SEO

## Caricamento file a blocchi

- **Componente:** `components/form/FileUpload.tsx`. **Logica:** `api/uploads.ts`.
- **Uso:** si trascina o si sceglie il file; tipo e dimensione si controllano prima dell'invio; avanzamento per file; si può annullare, riprovare o rimuovere; anteprima delle immagini.
- **Invio:** blocchi da 1 MB, 3 tentativi per blocco con attesa crescente, ripresa dai blocchi già ricevuti (`ricevute` restituito da `/upload/inizia`).
- **Backend PHP:** riceve `inizia`, `parte` (multipart) e `completa`. Deve rifare i controlli di tipo e dimensione e salvare fuori dalla document root o con nomi casuali.

```tsx
<FileUpload label="Allegati" accept=".pdf,.jpg,.png" maxMb={20} multiple onChange={(files) => …} />
```

## Risorse incorporate

- **Servizi ammessi** (`lib/embed.ts`): YouTube (dominio senza cookie), Vimeo, Google Maps, Spotify, PDF e immagini, solo https. Per aggiungerne uno basta una riga in `PROVIDERS`.
- **Componenti:**
  - `EmbedField`: incolli un link, vedi l'anteprima, premi "Inserisci".
  - `EmbedView`: iframe isolato (`sandbox`), caricamento differito, proporzioni corrette.
- **Negli articoli** la risorsa si scrive `@embed https://…` su una riga.

## Dettatura e lettura ad alta voce

- **Dettatura** (`lib/speech/dictation.ts`), collegata alla Prompt Bar con `dictate`. Correzioni per le parole duplicate sui telefoni Android:
  1. il testo si ricostruisce dai risultati, mai accodando;
  2. su Android si usa solo l'ultimo risultato;
  3. su mobile riconoscimento non continuo con riavvio automatico;
  4. `mergeWithoutRepeat` toglie le parole sovrapposte.

  Prova: `npx tsx scripts/test-dettatura.ts`. Gli errori (microfono negato, assente, rete) diventano messaggi chiari.
- **Lettura ad alta voce** (`lib/speech/speak.ts`, bottone "Ascolta"): ferma la lettura precedente, divide in frasi brevi (Chrome tronca gli enunciati lunghi), usa una voce italiana se c'è e si ferma all'uscita dalla pagina.

## Paginazione

- **Regola:** oltre 20 elementi si va a pagine, con "1–20 di 46" e le frecce.
- **Filter Table:** `pageSize={20}`, paginazione dopo il filtro, così i conteggi restano giusti.
- **Elenchi:** `RowList` pagina da solo. Per altri elenchi: `usePagination(items)`, che restituisce `pageItems` e `pager`.
- **Torna alla prima pagina** quando cambia un filtro (`resetKey`).

## SEO

- **`useSeo(titolo, descrizione, immagine, noindex)`** imposta title, description, Open Graph e robots secondo le impostazioni (Impostazioni › SEO, con anteprima su Google).
- **Area riservata:** sempre `noindex`, gestito da `PageHeader`.
- **Blog:** ogni articolo ha titolo e descrizione per Google (60 e 160 caratteri, con contatore).
- **Limite di una SPA con rotte a hash:** i motori leggono bene solo l'HTML iniziale. Per indicizzare blog e pagine pubbliche il PHP deve servire `/blog/<slug>` con i meta già nell'HTML (stessi campi dell'API) e generare `sitemap.xml` e `robots.txt` dagli articoli pubblicati.

## Export Excel

`ExportExcelButton` produce un vero file XLSX nel browser, con write-excel-file
caricato solo al clic. Non invia dati a servizi esterni. Sono esportate le righe
caricate dalla vista, filtrate prima della paginazione; non righe non scaricate
dal backend. Il tooltip indica il numero di righe. Le celle testuali restano
stringhe (anche se iniziano con =), mai formule eseguibili. Nessuna password,
chiave o colonna tecnica non prevista nello schema export.

Disponibile nelle tabelle Richieste, incluse le anteprime dashboard, e Utenti,
negli elenchi Blog/Registro e nella proposta di archiviazione dell'assistente.
Quest'ultima esporta la proposta iniziale completa, non applica le operazioni
né rappresenta una conferma di archiviazione. L'export disabilita il pulsante
durante la generazione e con zero righe; gli errori permettono di riprovare.

`ExportableTable` aggiunge l'export alla FilterTable; `renderExport` riceve le righe
filtrate, mentre in RecordsTable riceve le righe ordinate. Lo slot è facoltativo
e non cambia dati, filtri o logiche del vendor. Blog e Registro esportano il
filtro attuale. Per un nuovo progetto definire lo schema di colonne consentite
e mantenere gli stessi controlli lato server sulla lettura dei dati.
