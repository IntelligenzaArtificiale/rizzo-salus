/* Sezione Stati di pagina: caricamento, vuoto, errore, accesso negato, esito positivo. */
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";
import { PrimaryAction } from "@/components/app/IconButton";
import { StatusPanel } from "@/components/feedback/StatusPanel";
import type { GuideSection } from "@/pages/dev/components/types";

const Box = ({ children }: { children: React.ReactNode }) => <div className="max-w-[560px] rounded-window bg-surface p-5 shadow-card">{children}</div>;

export const states: GuideSection = {
  id: "stati",
  title: "Stati di pagina",
  intro: "Ogni pagina che carica dati ha quattro stati: attesa, vuoto, errore, pronto. Più l'accesso negato quando manca un permesso.",
  docs: [
    {
      id: "page-state",
      name: "PageLoading, EmptyState, PageError",
      importPath: 'import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";',
      origin: "Wrapper del boilerplate",
      purpose: "Attesa con LoadingState di Beautiful UI, vuoto che dice cosa fare, errore con «Riprova». Accesso negato e pagina non trovata sono pagine (ErrorPages).",
      demos: [
        { label: "Caricamento", render: () => <Box><PageLoading label="Carico gli ordini" /></Box> },
        { label: "Vuoto", render: () => <Box><EmptyState title="Ancora nessun ordine" description="Quando ne crei uno, lo trovi qui con il suo stato." action={<PrimaryAction label="Nuovo ordine" icon={<Plus size={15} />} onClick={() => {}} />} /></Box> },
        { label: "Errore", render: () => <Box><PageError message="Non riusciamo a caricare gli ordini." onRetry={() => {}} /></Box> },
        { label: "Accesso negato", render: () => <Box><StatusPanel kind="error" title="Non hai accesso a questa pagina" actions={<Link to="." className="text-[14px] font-medium text-accent-ink hover:underline">Torna alla dashboard</Link>}>Chiedi a un amministratore di abilitarti.</StatusPanel></Box> },
        { label: "Completato", render: () => <Box><StatusPanel kind="success" title="Importazione completata">1.240 prodotti aggiornati, 3 da controllare.</StatusPanel></Box> },
      ],
      states: ["loading senza dati: PageLoading", "errore: PageError con Riprova (la barra e l'intestazione restano)", "dati vuoti: EmptyState con azione", "permesso mancante: /accesso-negato (RequireAuth)"],
      props: [["PageLoading label", "string", "Cosa si sta caricando"], ["EmptyState title / description / action", "string / string / ReactNode", "Cosa manca, perché, cosa fare"], ["PageError message / onRetry", "string / () => void", "Frase leggibile e nuovo tentativo"]],
      use: ["Ogni pagina con useLoad", "Sezioni di dashboard che caricano dati separati"],
      avoid: ["Spinner senza testo", "Attese simulate o rallentate per «effetto»", "Messaggi con codici d'errore del server"],
      wiring: `const { data, loading, error, reload } = useLoad(listOrders);
{loading && !data && <PageLoading label="Carico gli ordini" />}
{error && <PageError onRetry={reload} />}
{data && (data.length ? <OrdersTable rows={data} /> : <EmptyState title="Ancora nessun ordine" action={newOrder} />)}`,
      responsive: "Larghezza del contenuto; nessuna altezza fissa.",
      a11y: "Errore con role=alert; il caricamento ha un'etichetta testuale; con «riduci movimento» gli indicatori non si animano.",
      customize: ["Testi per entità"],
      mistakes: [
        { wrong: "«Nessun elemento in questa vista»", right: "«Ancora nessun ordine» + «Nuovo ordine»" },
        { wrong: "«Errore 503 — servizio non disponibile»", right: "«Non riusciamo a caricare gli ordini» + «Riprova»" },
      ],
    },
  ],
};
