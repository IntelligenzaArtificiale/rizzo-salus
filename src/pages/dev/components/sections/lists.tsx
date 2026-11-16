/* Sezione Elenchi e cronologie: RowList, Timeline, TaskRows per attività e registro. */
import { RowList } from "@/components/app/RowList";
import { Timeline } from "@/components/app/Timeline";
import TaskRows from "@/components/primitives/TaskRows";
import { statusOf } from "@/lib/status";
import { ADMIN_TASKS, TASK_LABELS } from "@/pages/dashboard/tasks";
import type { GuideSection } from "@/pages/dev/components/types";

const dot = <span className="size-2 rounded-full bg-accent" aria-label="Non letta" />;

export const lists: GuideSection = {
  id: "elenchi",
  title: "Elenchi e cronologie",
  intro: "Righe che portano a un dettaglio, eventi nel tempo, lavori in corso. Ogni riga dice cosa è successo in parole, non con codici.",
  docs: [
    {
      id: "row-list",
      name: "RowList",
      importPath: 'import { RowList } from "@/components/app/RowList";',
      origin: "Composizione del boilerplate",
      purpose: "Elenco di righe cliccabili con l'evidenza scorrevole di GlideMenu: segno a sinistra, titolo, riga secondaria, stato, valore a destra. Paginazione inclusa.",
      demos: [
        { label: "Notifiche", render: () => <RowList rows={[
          { key: "n1", to: ".", mark: dot, title: "Ordine confermato da Termoservice", meta: "Manutenzione caldaia · intervento giovedì", aside: "5 min fa" },
          { key: "n2", to: ".", mark: dot, title: "Nuova domanda di Panificio Aurora", meta: "Non riesco ad accedere dal telefono", aside: "1 h fa" },
          { key: "n3", to: ".", title: "Fattura di ottobre disponibile", meta: "Ottica Belvedere", aside: "Ieri" },
        ]} /> },
        { label: "Pratiche", render: () => <RowList rows={[
          { key: "p1", to: ".", title: "Ristrutturazione bagno, via Etnea", meta: "Preventivo inviato al cliente", status: statusOf("in_attesa"), aside: "€ 4.800" },
          { key: "p2", to: ".", title: "Impianto fotovoltaico 6 kW", meta: "Sopralluogo fatto", status: statusOf("in_lavorazione"), aside: "€ 9.200" },
          { key: "p3", to: ".", title: "Sostituzione infissi", meta: "Lavori chiusi il 28 ottobre", status: statusOf("completata"), aside: "€ 6.150" },
        ]} /> },
      ],
      variants: ["Con segno (non letta, priorità)", "Con stato (StatusPill)", "Con valore a destra (ora relativa, importo, quantità)", "wrap: testi su due righe"],
      states: ["Vuoto: EmptyState con cosa fare", "Paginata in locale, oppure paginate={false} con Pagination del backend"],
      props: [
        ["rows", "RowItem[]", "{ key, to, title, meta?, status?, aside?, mark?, onOpen? }"],
        ["paginate", "boolean", "false quando il backend restituisce già una pagina"],
        ["wrap", "boolean", "Titolo e riga secondaria su due righe"],
      ],
      use: ["Notifiche, ultime attività, conversazioni, risultati di ricerca brevi", "Elenchi in cui ogni riga apre una pagina"],
      avoid: ["Prodotti o offerte da scegliere: EntityCard", "Dati da filtrare, ordinare, esportare: tabella", "Data qualsiasi nell'aside: mostra solo ciò che aiuta a decidere"],
      wiring: `const { data } = useLoad(listNotifications);
<RowList rows={data.map((n) => ({
  key: n.id, to: linkFor(n), mark: n.read ? undefined : <UnreadDot />,
  title: n.title, meta: describe(n), aside: relative(n.at),
  onOpen: () => markRead([n.id]),
}))} />`,
      responsive: "Titolo e riga secondaria si troncano (o vanno su due righe con wrap). Con stato presente, l'aside si nasconde sotto 640 px per lasciare spazio alla pillola.",
      a11y: "Ogni riga è un link con testo completo. Il segno di non letta ha un'etichetta. Lo stato è testo nella pillola.",
      customize: ["Contenuto di segno, aside e riga secondaria", "Numero di righe per pagina tramite usePagination"],
      mistakes: [
        { wrong: "Notifica come card alta con «Apri →» e «Segna come letta» testuali.", right: "Riga compatta: aprirla la segna come letta; «Segna tutte come lette» nell'intestazione." },
        { wrong: "Testo del backend mostrato così com'è: «Riferimento: practice_d799a0a3ad6d… Residuo assigned: 2».", right: "Frase composta dai campi: «Residuo di 2 sacchi assegnato · Pratica del 6 novembre», con link." },
      ],
    },
    {
      id: "timeline",
      name: "Timeline",
      importPath: 'import { Timeline } from "@/components/app/Timeline";',
      origin: "Composizione del boilerplate",
      purpose: "Cronologia verticale di un singolo elemento: passaggi di stato, scambi domanda/risposta, modifiche. L'evento più recente è in alto ed evidenziato.",
      demos: [
        { label: "Richiesta di assistenza", render: () => <Timeline events={[
          { key: "e3", when: "Oggi, 9:40", who: "Chiara Leone", title: "Risposta inviata", status: statusOf("completata"), detail: "Abbiamo reinviato la fattura all'indirizzo amministrazione@ottica-belvedere.it." },
          { key: "e2", when: "Ieri, 17:10", who: "Sistema", title: "Presa in carico" },
          { key: "e1", when: "Ieri, 16:52", who: "Ottica Belvedere", title: "Domanda ricevuta", detail: "La fattura di ottobre non è arrivata." },
        ]} /> },
        { label: "Ordine", render: () => <Timeline events={[
          { key: "o3", when: "6 nov", title: "Pronto per il ritiro", status: statusOf("disponibile") },
          { key: "o2", when: "4 nov", who: "Termoservice", title: "Confermato dal fornitore" },
          { key: "o1", when: "3 nov", who: "Tu", title: "Ordine inviato", detail: "12 sacchi · ritiro dal 6 novembre" },
        ]} /> },
      ],
      props: [["events", "TimelineEvent[]", "{ key, when, title, who?, detail?, status? }"], ["label", "string", "Nome accessibile dell'elenco"]],
      use: ["Storico di una pratica, di un ordine, di un ticket", "Registro attività visto dal dettaglio di un elemento"],
      avoid: ["Cercare tra centinaia di eventi: tabella del registro con filtri"],
      wiring: `const { data } = useLoad(() => getTicket(id));
<Timeline events={data.history.map((h) => ({
  key: h.id, when: formatDateTime(h.at), who: h.actorName,
  title: EVENT_LABEL[h.type], detail: h.message, status: h.state && statusOf(h.state),
}))} />`,
      responsive: "Una colonna sempre; i dettagli vanno a capo dentro il riquadro.",
      a11y: "Elenco ordinato con etichetta; il punto evidenziato è decorativo.",
      customize: ["Etichette degli eventi", "Presenza del dettaglio"],
      mistakes: [{ wrong: "Storico in una scheda separata che nasconde il dettaglio.", right: "Sezione «Cronologia» sotto i dati principali della stessa pagina." }],
    },
    {
      id: "task-rows",
      name: "TaskRows",
      importPath: 'import TaskRows from "@/components/primitives/TaskRows";',
      origin: "Beautiful UI + parametri",
      purpose: "Lavori in corso con passaggi espandibili: importazioni, invii programmati, elaborazioni. Nelle dashboard, insieme a InsightCards per i numeri chiave.",
      demos: [{ label: "Lavori di sistema", render: () => <TaskRows className="max-w-none" rows={ADMIN_TASKS} labels={TASK_LABELS} /> }],
      props: [["rows", "TaskRow[]", "{ key, label, amount, status, step?, details }"], ["labels", "Partial<TaskRowsLabels>", "Testi di completato e non riuscito"]],
      use: ["Attività che avanzano per passi", "Cosa sta facendo il sistema per l'utente"],
      avoid: ["Elenco di numeri: InsightCards", "Righe statiche senza avanzamento: RowList"],
      wiring: `<TaskRows rows={jobs.map((j) => ({ key: j.id, label: j.name, amount: j.scope,
  status: j.state, step: j.step, details: j.steps }))} labels={TASK_LABELS} />`,
      responsive: "Larghezza del contenitore con className; i passaggi si espandono sotto la riga.",
      a11y: "Righe espandibili con stato annunciato.",
      customize: ["Etichette", "Larghezza tramite className"],
      mistakes: [{ wrong: "Indicatori come elenco «Etichetta … 0» in una card.", right: "InsightCards per i numeri, TaskRows per le attività, niente righe a zero." }],
    },
  ],
};
