/*
 * Percorso decisionale: dalla domanda «cosa devo mostrare e dove» al componente del catalogo.
 * In fondo, l'ordine obbligato quando il catalogo non copre un bisogno.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";

const SURFACES = ["Sito pubblico", "Accesso", "Area riservata"] as const;
type Surface = (typeof SURFACES)[number];

type Need = { key: string; label: string; answer: string; section: string; avoid: string };

const NEEDS: Need[] = [
  { key: "scegliere", label: "Elementi da scegliere fra tanti", answer: "EntityCard in CardGrid. Con molti attributi da confrontare: FilterTable.", section: "card", avoid: "Un elenco di soli titoli con una data accanto." },
  { key: "confrontare", label: "Dati da filtrare, ordinare, esportare", answer: "TableToolbar + FilterTable (stati) o RecordsTable (ordinamento), Pagination, ExportExcelButton.", section: "tabelle", avoid: "Campi di ricerca in un modulo sopra la tabella e filtri duplicati." },
  { key: "tempo", label: "Cose accadute nel tempo", answer: "Timeline per un singolo elemento; tabella del registro per cercare tra molti eventi; RowList per notifiche.", section: "elenchi", avoid: "Card alte una per evento." },
  { key: "stato", label: "Uno stato o un esito", answer: "StatusPill nella riga o nella card; toast per l'esito di un'azione; StatusPanel per un esito di pagina.", section: "feedback", avoid: "Lo stato scritto come testo grigio nel sottotitolo." },
  { key: "numeri", label: "Numeri chiave e andamenti", answer: "StatTile per gli indicatori, ColumnChart / BarList / SegmentedBar in ChartCard per gli andamenti, InsightCards per le spiegazioni, TaskRows per le attività.", section: "grafici", avoid: "Etichetta e numero in un elenco con molti zeri; due scale sullo stesso grafico." },
  { key: "config", label: "Impostazioni da salvare", answer: "SettingsSection per ogni gruppo, SaveBar e useSettingsForm; interruttori che si salvano da soli solo in sezioni senza Salva.", section: "impostazioni", avoid: "Form stretti allineati a sinistra; Salva sempre visibile e disattivo." },
  { key: "modulo", label: "Dati da inserire o modificare", answer: "Pagina dedicata con i campi del boilerplate, FormActions, useSubmit e useUnsavedChanges.", section: "moduli", avoid: "Modali per creare o modificare, checkbox per un'impostazione on/off." },
  { key: "chat", label: "Conversazione con l'assistente", answer: "Pagina assistente: PromptBar, risposte con ThinkingState e StreamingText, cronologia con menu ⋯.", section: "assistente", avoid: "La cronologia come scheda che sostituisce la chat." },
  { key: "attesa", label: "Caricamento, vuoto, errore", answer: "PageLoading, EmptyState con azione, PageError con Riprova; pagine di errore per 403 e 404.", section: "stati", avoid: "Testi generici come «Nessun elemento in questa vista»." },
];

const SURFACE_NOTE: Record<Surface, string> = {
  "Sito pubblico": "SiteLayout: header con logotipo e ingresso all'area riservata. Mai SidebarNav. La landing si progetta a parte (Hallmark o Design Taste); i contenuti consultabili usano comunque card e tabelle del catalogo.",
  Accesso: "AuthLayout: card centrata, una sola azione principale, nessun Annulla. Registrazione con RegisterWizard e barra di avanzamento.",
  "Area riservata": "AppLayout con SidebarNav. Ogni pagina: PageHeader, un blocco per riga, azioni con icona, stati di caricamento/vuoto/errore.",
};

const FALLBACK = [
  ["Varianti e props", "Il componente esiste ma serve un aspetto o un dato diverso: usa varianti, etichette, slot e token. Esempio: FilterTable con colonne rietichettate."],
  ["Composizione", "Più componenti del catalogo insieme risolvono il bisogno. Esempio: TableToolbar + FilterTable + Pagination."],
  ["Estensione", "Un wrapper del boilerplate aggiunge un comportamento senza cambiare il vendor. Esempio: ExportableTable. Patch al vendor solo per un problema concreto, segnata [boilerplate] e scritta in PATCH.md."],
  ["Nuovo componente", "Solo se i tre passi prima non bastano. Si documenta in docs/redesign/eccezioni.md: bisogno, componenti valutati, limite, verifica."],
] as const;

export function DecisionPath() {
  const [surface, setSurface] = useState<Surface>("Area riservata");
  const [need, setNeed] = useState<Need>(NEEDS[0]);
  return (
    <section id="percorso" className="flex scroll-mt-20 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold text-ink-3">1. Dove si trova la pagina?</h2>
        <SegmentedControl options={SURFACES} value={surface} onChange={setSurface} className="w-full sm:w-fit" />
        <p className="max-w-[760px] text-[14px] leading-relaxed text-ink-2">{SURFACE_NOTE[surface]}</p>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold text-ink-3">2. Cosa deve mostrare il blocco?</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cosa mostra il blocco">
          {NEEDS.map((n) => (
            <button key={n.key} type="button" role="radio" aria-checked={need.key === n.key} onClick={() => setNeed(n)}
              className={`motion-state rounded-full px-3 py-1.5 text-[13.5px] shadow-hairline ${need.key === n.key ? "bg-ink text-canvas" : "bg-surface text-ink-2 hover:text-ink"}`}>
              {n.label}
            </button>
          ))}
        </div>
        <div key={need.key} className="anim-swap flex max-w-[760px] flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
          <p className="text-[15px] font-medium text-ink">{need.answer}</p>
          <p className="text-[13.5px] text-ink-2"><span className="font-medium text-red">Da evitare:</span> {need.avoid}</p>
          <Link to={`/anteprima/componenti/${need.section}`} className="flex w-fit items-center gap-1 text-[13.5px] font-medium text-accent-ink hover:underline">Vai agli esempi <ArrowRight size={14} /></Link>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold text-ink-3">3. Se il catalogo non copre il bisogno, in quest'ordine</h2>
        <ol className="grid max-w-[900px] gap-3 sm:grid-cols-2">
          {FALLBACK.map(([title, text], i) => (
            <li key={title} className="flex gap-3 rounded-card bg-surface p-4 shadow-card">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-inset text-[12.5px] font-semibold text-ink">{i + 1}</span>
              <span className="flex flex-col gap-1"><span className="text-[14px] font-medium text-ink">{title}</span><span className="text-[13.5px] leading-relaxed text-ink-2">{text}</span></span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
