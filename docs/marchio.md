# Marchio: logo, simbolo, favicon, immagine social

Il marchio arriva dalle impostazioni (`settings.brand`) e si cambia da Impostazioni › Marchio.
Due forme distinte, ciascuna con la variante per il tema scuro:

| Campo | Forma | Dove si vede | Formato consigliato |
|---|---|---|---|
| `simbolo` | quadrato 1:1 | sidebar (20 px), favicon, spazi stretti, email senza logotipo | SVG; in alternativa PNG ≥ 512×512 con trasparenza |
| `logotipo` | orizzontale (simbolo + nome), proporzione tra 2:1 e 6:1 | header del sito e dell'accesso (alto 28 px), email | SVG; in alternativa PNG alto ≥ 120 px con trasparenza |
| `simboloScuro`, `logotipoScuro` | come sopra, colori chiari | tema scuro | stessi formati |

## Regole

1. **Mai un logotipo nello slot del simbolo.** Un logo orizzontale schiacciato in un quadrato diventa illeggibile. Senza simbolo si usa l'iniziale su fondo inchiostro (`BrandLogo`).
2. **Sfondo trasparente.** Nessun riquadro bianco: in tema scuro diventa una macchia.
3. **Il nome non si ripete** accanto a un logotipo che lo contiene già. Nella sidebar: simbolo + nome della piattaforma.
4. **Un solo nome.** Se il cliente ha un marchio di prodotto e uno aziendale, si decide quale guida (es. «Prodotto · di Azienda») e si usa sempre quello.
5. **Contrasto** del logotipo ≥ 3:1 sul fondo della superficie, in chiaro e in scuro.

## Favicon e immagine social

| File | Misure | Note |
|---|---|---|
| `public/favicon.svg` | vettoriale quadrato | ricavato dal simbolo; a runtime il simbolo caricato lo sostituisce |
| `favicon-32.png`, `apple-touch-icon.png` | 32×32, 180×180 | fondo pieno per iOS (niente trasparenza), margine interno 10% |
| Immagine Open Graph (`seo.immagine`) | 1200×630, JPG o PNG < 1 MB | logotipo e un messaggio breve; testo importante dentro l'area centrale 1080×566 |

## Preservare un marchio esistente (redesign)

1. Cercare prima gli **originali vettoriali** (SVG, PDF, AI, EPS) nel progetto, nel sito pubblico, nei materiali del cliente. Un PNG grande senza trasparenza non è un originale.
2. Da un vettoriale si ricavano simbolo, logotipo e varianti scure **senza ridisegnare**: si cambiano solo colori di riempimento e area di rispetto.
3. Se manca un file (favicon, immagine social, variante scura) si può generarlo con strumenti di generazione o editing d'immagini **partendo dal marchio esistente**: scontorno, ricolorazione, composizione. Non si reinterpreta il logo e non si inventano simboli nuovi.
4. Se esiste solo un raster senza trasparenza: si scontorna (rimozione dello sfondo) e si verifica a 20, 28 e 64 px su fondo chiaro e scuro. Se il risultato non è pulito, si usa l'iniziale come **ripiego** e si chiede l'originale al cliente.
5. Ogni file prodotto si elenca in `docs/redesign/brand.md` con fonte, trasformazione e verifica.
