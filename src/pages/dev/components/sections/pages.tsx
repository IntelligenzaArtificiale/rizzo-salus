/* Sezione Pagine: superfici (sito, accesso, app) e schemi di creazione, modifica e dettaglio. */
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { DetailList, Section } from "@/components/app/Section";
import { Timeline } from "@/components/app/Timeline";
import { StatusPill } from "@/components/atoms/StatusPill";
import { statusOf } from "@/lib/status";
import type { GuideSection } from "@/pages/dev/components/types";

function Frame({ title, header, side, note }: { title: string; header: string; side?: boolean; note: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-36 flex-col overflow-hidden rounded-[12px] bg-surface shadow-card">
        <div className="flex h-7 items-center gap-2 border-b border-line px-2.5 text-[11px] text-ink-3">{header}</div>
        <div className="flex flex-1">
          {side && <div className="w-12 border-r border-line bg-canvas" />}
          <div className="flex flex-1 flex-col gap-1.5 p-2.5"><div className="h-2.5 w-1/2 rounded bg-line-strong" /><div className="h-2 w-3/4 rounded bg-line" /><div className="h-2 w-2/3 rounded bg-line" /></div>
        </div>
      </div>
      <figcaption className="text-[13px] leading-snug text-ink-2"><span className="font-medium text-ink">{title}.</span> {note}</figcaption>
    </figure>
  );
}

const Surfaces = () => (
  <div className="grid gap-4 sm:grid-cols-3">
    <Frame title="Sito" header="Logotipo · Blog · Accedi · Registrati" note="SiteLayout. Landing progettata a parte, contenuti pubblici, nessuna sidebar." />
    <Frame title="Accesso" header="Logotipo" note="AuthLayout. Card centrata: accedi, registrati, recupero password." />
    <Frame title="App" header="Ricerca · Tema · Notifiche" side note="AppLayout con SidebarNav, solo dopo l'accesso." />
  </div>
);

const Detail = () => (
  <div className="flex flex-col gap-6 rounded-window bg-surface p-5 shadow-card">
    <PageHeader back={{ to: ".", label: "Richieste" }} title="Fornitura adesivo per piastrelle"
      actions={<><IconButton label="Modifica" icon={<Pencil size={15} />} onClick={() => {}} /><IconButton label="Elimina" tone="danger" icon={<Trash2 size={15} />} onClick={() => {}} /></>} />
    <DetailList items={[
      { label: "Stato", value: <StatusPill tone={statusOf("in_lavorazione").tone}>{statusOf("in_lavorazione").label}</StatusPill> },
      { label: "Cliente", value: "Impresa Edile Rossi" },
      { label: "Quantità", value: "12 sacchi" },
      { label: "Ritiro", value: "Dal 6 novembre, magazzino centro" },
    ]} />
    <Section title="Cronologia">
      <Timeline events={[{ key: "2", when: "Ieri, 16:10", who: "Chiara Leone", title: "Presa in carico" }, { key: "1", when: "Ieri, 15:02", who: "Impresa Edile Rossi", title: "Richiesta inviata" }]} />
    </Section>
  </div>
);

export const pages: GuideSection = {
  id: "pagine",
  title: "Pagine e superfici",
  intro: "Tre superfici con cornici diverse, e tre tipi di pagina nell'area riservata: elenco, dettaglio, creazione/modifica.",
  docs: [
    {
      id: "superfici",
      name: "SiteLayout, AuthLayout, AppLayout",
      importPath: 'import { SiteLayout } from "@/layouts/SiteLayout";\nimport { AuthLayout } from "@/layouts/AuthLayout";\nimport { AppLayout, Page } from "@/layouts/AppLayout";',
      origin: "Composizione del boilerplate",
      purpose: "Ogni rotta appartiene a una superficie (routes/site.tsx, routes/auth.tsx, routes/app.tsx). La landing non è nel boilerplate: si progetta con Hallmark o Design Taste e la sua CTA porta a /registrazione o /accedi.",
      demos: [{ label: "Superfici", render: () => <Surfaces /> }],
      props: [["SiteLayout wide", "boolean", "Larghezza piena per cataloghi pubblici"], ["AuthLayout progress / aside", "{ current, total } / ReactNode", "Avanzamento e fascia inferiore"], ["AppLayout chats", "ChatsConfig", "Cronologia nella sidebar (assistente)"], ["Page wide", "boolean", "Contenuto largo per tabelle"]],
      use: ["Sito: blog, note legali, catalogo e offerte consultabili senza account", "Accesso: login, registrazione, verifica, password", "App: tutto ciò che richiede una sessione"],
      avoid: ["SidebarNav nel sito pubblico o «Crea il tuo account» nel piede della sidebar", "Landing costruita con card e liste dell'area riservata"],
      wiring: `// routes/site.tsx
<Route path="/catalogo" element={<CatalogPublicPage />} />   // dentro: <SiteLayout wide>…</SiteLayout>
// routes/app.tsx
<Route path="/ordini" element={area(<OrdersPage />, "ordini.vedi")} />`,
      responsive: "Sito: header con link nascosti sotto 640 px, CTA sempre visibili. App: sidebar come pannello da menu su mobile.",
      a11y: "Un solo h1 per pagina; nav con etichetta; ordine di tabulazione naturale.",
      customize: ["SITE_LINKS in config/site.ts", "Voci di menu in config/navigation.ts"],
      mistakes: [{ wrong: "Landing dentro l'area riservata con sidebar Catalogo/Offerte/Accedi.", right: "Landing a parte; sito con SiteLayout; area riservata dopo l'accesso." }],
    },
    {
      id: "dettaglio",
      name: "Pagina di dettaglio",
      importPath: 'import { PageHeader } from "@/components/app/PageHeader";\nimport { DetailList, Section } from "@/components/app/Section";',
      origin: "Composizione del boilerplate",
      purpose: "Intestazione con ritorno all'elenco e azioni con icona, dati principali in DetailList, sezioni sotto (cronologia, documenti). Crea e modifica sono pagine separate: /elementi/nuovo e /elementi/:id/modifica.",
      demos: [{ label: "Richiesta", render: () => <Detail /> }],
      props: [["PageHeader back / actions", "{ to, label } / ReactNode", "Ritorno e azioni con icona"], ["DetailList items", "{ label, value }[]", "Coppie etichetta/valore"], ["Section title / aside", "string / ReactNode", "Blocchi sotto i dati"]],
      use: ["Ogni elemento che si apre da un elenco"],
      avoid: ["Dettaglio in una modal o in un pannello che copre l'elenco", "Identificativi interni tra i dati («UUID», «id tabella»)"],
      wiring: `const { data, loading, error, reload } = useLoad(() => getItem(id), [id]);
if (loading) return <Page><PageLoading /></Page>;
if (error) return <Page><PageError onRetry={reload} /></Page>;`,
      responsive: "DetailList passa a una colonna sotto 640 px; le azioni restano in alto a destra.",
      a11y: "Il titolo della pagina è l'h1; le azioni con icona hanno nome e tooltip.",
      customize: ["Ordine dei dati", "Sezioni sotto"],
      mistakes: [{ wrong: "«Annulla» e «Salva» su una pagina di sola lettura.", right: "Azione «Modifica» che porta alla pagina di modifica." }],
    },
  ],
};
