/* Sezione Grafici: indicatori, colonne nel tempo, barre per categoria, intero diviso in parti. */
import { ChartCard } from "@/components/charts/ChartCard";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { BarList } from "@/components/charts/BarList";
import { SegmentedBar } from "@/components/charts/SegmentedBar";
import { StatTile } from "@/components/charts/StatTile";
import type { GuideSection } from "@/pages/dev/components/types";

const VISITS = [{ label: "lun", value: 18 }, { label: "mar", value: 24 }, { label: "mer", value: 21 }, { label: "gio", value: 27 }, { label: "ven", value: 31 }, { label: "sab", value: 12 }];
const SALES = [{ label: "gen", value: 4200, display: "€ 4.200" }, { label: "feb", value: 3900, display: "€ 3.900" }, { label: "mar", value: 5100, display: "€ 5.100" }, { label: "apr", value: 6300, display: "€ 6.300" }];
const COURSES = [{ label: "Pilates", value: 42, part: 38 }, { label: "Sala pesi", value: 35, part: 22 }, { label: "Yoga", value: 28, part: 27 }, { label: "Spinning", value: 19, part: 11 }];
const TICKETS = [{ label: "Aperti", value: 14 }, { label: "In lavorazione", value: 9 }, { label: "Risolti", value: 41 }];

export const charts: GuideSection = {
  id: "grafici",
  title: "Grafici",
  intro: "Numeri e andamenti. Prima si sceglie la forma dal compito del dato, poi il colore. Ogni grafico ha la vista tabella e i testi in inchiostro, mai nel colore della serie.",
  docs: [
    {
      id: "stat-tile",
      name: "StatTile",
      importPath: 'import { StatTile } from "@/components/charts/StatTile";',
      origin: "Composizione del boilerplate",
      purpose: "Un numero con etichetta e variazione rispetto a un periodo nominato. Il colore della variazione dice se è un bene: con goodWhen=\"down\" un tempo che scende è verde.",
      demos: [
        { label: "Assistenza", render: () => <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatTile label="Richieste aperte" value="14" delta={-18} goodWhen="down" /><StatTile label="Prima risposta" value="2,4 h" delta={-12} goodWhen="down" /><StatTile label="Risolte" value="41" delta={9} /><StatTile label="Soddisfazione" value="94%" delta={0} format={(n) => `${n} punti`} /></div> },
        { label: "Negozio", render: () => <div className="grid grid-cols-2 gap-3"><StatTile label="Incasso del mese" value="€ 6.300" delta={24} /><StatTile label="Resi" value="7" delta={40} goodWhen="down" /></div> },
      ],
      props: [["label / value", "string", "Etichetta senza due punti; valore già formattato"], ["delta", "number", "Variazione (per cento o punti)"], ["goodWhen", '"up" | "down"', "Quando salire è positivo"], ["format / deltaLabel", "fn / string", "Formato della variazione e periodo di confronto"]],
      use: ["Riga di indicatori in cima a dashboard e statistiche (2 colonne su mobile, 4 su desktop)"],
      avoid: ["Più di 4 indicatori per riga", "Indicatori a zero senza significato", "Colore della variazione che segue solo il segno"],
      wiring: `const s = useLoad(() => getStats(period));
<StatTile label="Prima risposta" value={hours(s.data.response)} delta={pct(s.data.response, s.data.prevResponse)} goodWhen="down" />`,
      responsive: "Griglia 2 colonne sotto 1024 px, 4 sopra.",
      a11y: "La direzione è detta con freccia e segno oltre che col colore.",
      customize: ["Etichette, formati, periodo di confronto"],
      mistakes: [{ wrong: "«Pratiche aperte … 0» in un elenco di etichette e numeri.", right: "StatTile con variazione e periodo; gli indicatori senza dati non si mostrano." }],
    },
    {
      id: "column-chart",
      name: "ColumnChart e BarList",
      importPath: 'import { ChartCard } from "@/components/charts/ChartCard";\nimport { ColumnChart } from "@/components/charts/ColumnChart";\nimport { BarList } from "@/components/charts/BarList";',
      origin: "Composizione del boilerplate",
      purpose: "Colonne per una serie nel tempo, barre orizzontali per confrontare categorie (con quota evidenziata opzionale). Colore del marchio, griglia sottile, valore stampato solo dove serve, tooltip su hover e focus.",
      demos: [
        { label: "Visite dello studio", render: () => <ChartCard title="Visite" subtitle="Questa settimana" unit="Visite" rows={VISITS}><ColumnChart rows={VISITS} unit="visite" /></ChartCard> },
        { label: "Incassi", render: () => <ChartCard title="Incasso" subtitle="Per mese" unit="Euro" rows={SALES}><ColumnChart rows={SALES} unit="" /></ChartCard> },
        { label: "Corsi in palestra", render: () => <ChartCard title="Iscritti per corso" subtitle="Presenti sugli iscritti" unit="Presenti / iscritti" rows={COURSES.map((c) => ({ label: c.label, value: c.value, display: `${c.part} di ${c.value}` }))}><BarList rows={COURSES} unit="iscritti" partLabel="presenti" /></ChartCard> },
      ],
      props: [["ChartCard title / subtitle / rows / unit", "string / ChartRow[]", "Riquadro con vista tabella degli stessi valori"], ["ColumnChart rows / unit / height", "ChartRow[] / string / number", "{ label, value, display? }"], ["BarList rows / partLabel", "{ label, value, part? }[] / string", "Barre ordinate, quota dentro la barra"]],
      use: ["Una misura nel tempo (colonne)", "Confronto tra categorie (barre orizzontali, dalla più grande)"],
      avoid: ["Due misure con scale diverse sullo stesso grafico: due grafici", "Torte e 3D", "Un numero su ogni colonna"],
      wiring: `<ChartCard title="Richieste ricevute" subtitle="Per settimana" unit="Richieste" rows={weeks}>
  <ColumnChart rows={weeks} unit="richieste" />
</ChartCard>`,
      responsive: "Larghezza del contenitore; con più di 8 colonne su mobile si mostra un'etichetta sì e una no.",
      a11y: "Ogni colonna è un bottone con nome «etichetta: valore»; tooltip anche da tastiera; vista tabella sempre disponibile.",
      customize: ["Altezza, unità, formato dei valori (display)", "Colore: quello del marchio, dai token"],
      mistakes: [{ wrong: "Barra di avanzamento disegnata a mano con style e colori diversi per pagina.", right: "BarList con part: stessa scala, stesso colore, valore alla punta." }],
    },
    {
      id: "segmented-bar",
      name: "SegmentedBar",
      importPath: 'import { SegmentedBar } from "@/components/charts/SegmentedBar";',
      origin: "Composizione del boilerplate",
      purpose: "Un intero diviso in fino a tre parti (es. per stato). Colori categoriali validati per daltonismo in chiaro e scuro, quota stampata dentro i blocchi abbastanza larghi, legenda nello stesso ordine.",
      demos: [{ label: "Ticket", render: () => <ChartCard title="Ticket per stato" subtitle="64 in tutto" unit="Ticket" rows={TICKETS}><SegmentedBar parts={TICKETS} unit="ticket" /></ChartCard> }],
      props: [["parts", "{ label, value }[]", "Massimo 3 parti, ordine fisso (i colori seguono l'ordine, non il valore)"], ["unit", "string", "Unità per il nome accessibile"]],
      use: ["Composizione di un totale: stati, canali, tipi"],
      avoid: ["Più di 3 parti: raggruppa in «Altro» o usa BarList", "Colori di stato (verde/rosso) per parti che non sono esiti"],
      wiring: `<SegmentedBar parts={[{ label: "Aperti", value: open }, { label: "In lavorazione", value: wip }, { label: "Risolti", value: done }]} unit="ticket" />`,
      responsive: "Altezza fissa 28 px; le quote sotto il 12% non si stampano (restano in tabella e tooltip).",
      a11y: "Nome accessibile con tutte le parti e le quote; legenda testuale.",
      customize: ["Etichette e ordine delle parti"],
      mistakes: [{ wrong: "Colori scelti a occhio e riassegnati quando cambia il filtro.", right: "Palette di charts.css nello stesso ordine; validata con lo script dataviz." }],
    },
  ],
};
