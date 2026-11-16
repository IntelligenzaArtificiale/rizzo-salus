/* Sezione Tabelle: FilterTable con barra, export e paginazione; RecordsTable per ordinamento e colonne larghe. */
import type { GuideSection } from "@/pages/dev/components/types";
import { BookingsTable, PeopleRecords, TicketsTable } from "@/pages/dev/components/sections/tableDemos";

export const tables: GuideSection = {
  id: "tabelle",
  title: "Tabelle",
  intro: "Dati da cercare, filtrare, ordinare, esportare e aprire. Una lista ha un solo proprietario dei filtri: la barra sopra la tabella, non un modulo separato.",
  docs: [
    {
      id: "filter-table",
      name: "FilterTable con barra",
      importPath: 'import ExportableTable from "@/components/app/ExportableTable";\nimport { TableToolbar, matches } from "@/components/app/TableToolbar";',
      origin: "Beautiful UI + parametri",
      purpose: "Tabella a quattro colonne di Beautiful UI con filtri per stato e conteggi, paginazione dopo il filtro ed export delle righe filtrate. TableToolbar aggiunge ricerca, un filtro di altro tipo e l'azione principale.",
      demos: [
        { label: "Assistenza clienti", render: () => <TicketsTable /> },
        { label: "Prenotazioni", render: () => <BookingsTable /> },
      ],
      variants: ["Colonne rietichettate per dominio: titolo, data o quando, stato, persona o azienda", "Con o senza export (exportAs)", "Con paginazione locale (pageSize) o del backend (Pagination sotto)"],
      states: ["Filtro di stato attivo con conteggio", "Ricerca senza risultati: la tabella mostra il proprio vuoto", "Caricamento: PageLoading al posto della tabella, la barra resta"],
      props: [
        ["rows", "TableRow[]", "{ id, task, date, status, owner } già tradotti in testo leggibile"],
        ["labels", "FilterTableLabels", "Nomi delle colonne, «Tutte», nomi dei tre stati"],
        ["pageSize", "number", "Righe per pagina dopo il filtro (0 = tutte)"],
        ["onRowClick", "(row) => void", "Apre il dettaglio su pagina dedicata"],
        ["exportAs", "{ filename, headers, row }", "Export Excel delle righe filtrate, intestazioni leggibili"],
        ["TableToolbar", "query, onQuery, placeholder, filters, actions", "Ricerca, filtro aggiuntivo, azione principale"],
      ],
      use: ["Code di lavoro: richieste, ticket, ordini, prenotazioni", "Elenchi con tre stati principali e bisogno di export", "Liste lunghe da cercare per nome o cliente"],
      avoid: ["Più di tre stati da filtrare: raggruppa gli stati o usa un filtro select nella barra", "Elementi da scegliere guardandoli: usa EntityCard", "Dettagli lunghi in una cella: vanno nella pagina di dettaglio"],
      wiring: `const [query, setQuery] = useState("");
const { data } = useLoad(listTickets);
const rows = (data ?? [])
  .filter((t) => matches(query, t.subject, t.customer))
  .map((t) => ({ id: t.code, task: t.subject, date: relative(t.updatedAt),
                 status: TO_TABLE[t.state], owner: t.customer }));

<TableToolbar query={query} onQuery={setQuery} placeholder="Cerca nelle richieste"
  actions={<PrimaryAction label="Nuova" icon={<Plus size={15} />} to="/richieste/nuova" />} />
<ExportableTable fill pageSize={20} rows={rows} labels={LABELS}
  exportAs={TICKET_EXPORT} onRowClick={(r) => navigate(\`/richieste/\${r.id}\`)} />`,
      responsive: "Sotto 640 px la barra va a capo: ricerca a tutta larghezza, filtro e azione sotto. La tabella scorre dentro il proprio contenitore; la colonna titolo resta la prima. Non tagliare colonne senza scorrimento.",
      a11y: "Ricerca con etichetta accessibile e bottone «Svuota». Filtri di stato come bottoni con conteggio letto dai lettori di schermo. Righe cliccabili raggiungibili da tastiera; l'apertura porta a una pagina, non a una modal.",
      customize: ["Etichette di colonne e stati", "Mappa dagli stati del dominio ai tre stati della tabella", "Numero di righe per pagina"],
      mistakes: [
        { wrong: "Campo «Cerca» a tutta larghezza in una card sopra la tabella, più schede e più filtri sullo stesso dato.", right: "Una barra: ricerca, un solo gruppo di filtri, azione. Gli stati li filtra la tabella." },
        { wrong: "Colonna «Quantità e stato» che ripete lo stato già mostrato.", right: "Ogni colonna dice una cosa sola." },
        { wrong: "Bottoni testuali «Precedente / Successiva» scritti nella pagina.", right: "pageSize della tabella o il componente Pagination." },
        { wrong: "Export con chiavi tecniche o ID interni nelle colonne.", right: "exportAs con intestazioni leggibili e i codici che l'operatore conosce." },
      ],
    },
    {
      id: "records-table",
      name: "RecordsTable",
      importPath: 'import RecordsTable from "@/components/primitives/RecordsTable";',
      origin: "Beautiful UI + parametri",
      purpose: "Tabella di Beautiful UI con ordinamento per colonna, colonne ridimensionabili, selezione e riepilogo. In sola lettura (readOnly) è adatta ad anagrafiche: persone, aziende, contatti.",
      demos: [{ label: "Persone", render: () => <PeopleRecords /> }],
      states: ["Ordinamento per nome, ultimo accesso, attività", "Riga aperta con onOpen", "Selezione multipla (fuori da readOnly)"],
      props: [
        ["rows", "RecordRow[]", "{ id, name, tags, last, strength, website }"],
        ["labels", "Partial<RecordsLabels>", "Nomi delle colonne e testi del riepilogo"],
        ["strengthLabels", "Record<Strength, string>", "Nomi dei quattro livelli (es. attività)"],
        ["readOnly", "boolean", "Nasconde colonne automatiche e strumenti di proprietà"],
        ["onOpen", "(row) => void", "Apre la scheda della riga"],
        ["renderExport", "(rows) => ReactNode", "Slot per ExportExcelButton con le righe ordinate"],
      ],
      use: ["Anagrafiche con ordinamento", "Elenchi con etichette multiple (ruoli, categorie)"],
      avoid: ["Code di lavoro con stati: usa FilterTable", "Meno di 5 righe: una RowList basta"],
      wiring: `<RecordsTable fill readOnly rows={users.map(toRecord)} labels={USER_LABELS}
  strengthLabels={ACTIVITY} onOpen={(r) => navigate(\`/utenti/\${r.id}\`)}
  renderExport={(rows) => <ExportExcelButton filename="utenti" headers={H} rows={rows.map(toCells)} />} />`,
      responsive: "Scorrimento orizzontale e verticale nel contenitore; la prima colonna resta leggibile. Su mobile valuta una RowList con le stesse informazioni principali.",
      a11y: "Intestazioni ordinabili come bottoni con stato annunciato; descrivi lo scorrimento nell'etichetta della tabella.",
      customize: ["Etichette, colori dei tag, livelli", "readOnly per nascondere funzioni da foglio di calcolo"],
      mistakes: [
        { wrong: "Lasciare le colonne automatiche e i testi demo in inglese.", right: "readOnly e tutte le etichette in italiano." },
      ],
    },
  ],
};
