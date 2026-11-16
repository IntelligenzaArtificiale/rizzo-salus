# Grafici

Componenti in `src/components/charts/`, colori in `src/styles/charts.css`. Esempi dal vivo: `#/anteprima/componenti/grafici`.
Metodo: skill **dataviz** (prima la forma, poi il colore; palette validata con lo script, non a occhio).

| Il dato dice… | Forma | Componente |
|---|---|---|
| un numero e come cambia | indicatore | `StatTile` (con `goodWhen`) |
| una misura nel tempo | colonne | `ChartCard` + `ColumnChart` |
| confronto fra categorie | barre orizzontali ordinate | `ChartCard` + `BarList` (con `part` per una quota) |
| un totale diviso in parti (≤ 3) | barra segmentata | `ChartCard` + `SegmentedBar` |
| perché è cambiato | testo con dati | `InsightCards` di Beautiful UI |

## Regole

1. Una serie usa il colore del marchio (`accent`). Più serie: palette di `charts.css` nell'ordine dato, mai ciclata, mai riassegnata quando cambia un filtro.
2. Palette validata (`validate_palette.js`) su superficie chiara `#ffffff` e scura `#26272b`: separazione per daltonismo ≥ 8. In chiaro il terzo colore ha contrasto 2,8:1, quindi le parti portano quota stampata, legenda e vista tabella.
3. Mai due scale sullo stesso grafico: due grafici.
4. Colonne fino a 24 px con estremità di 4 px, griglia sottile, tacche arrotondate, valore stampato solo sull'ultimo punto.
5. Testi in inchiostro (`ink`, `ink-2`, `ink-3`), mai nel colore della serie.
6. Hover e focus mostrano il valore; ogni `ChartCard` ha la vista tabella con gli stessi dati.
7. Un grafico per riga (regola UX «un componente per riga»); gli indicatori stanno insieme in una riga.
8. I totali storici li calcola il backend (`POST /statistiche/periodo`, forma in `pages/admin/statsData.ts`).
