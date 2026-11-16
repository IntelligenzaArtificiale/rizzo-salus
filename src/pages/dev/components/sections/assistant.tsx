/* Sezione Assistente: composer, messaggi e cronologia con menu ⋯ (contratto riutilizzabile). */
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import PromptBar from "@/components/primitives/PromptBar";
import ThinkingState from "@/components/primitives/ThinkingState";
import { ActionMenu } from "@/components/app/ActionMenu";
import { InlineRename } from "@/components/app/InlineRename";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { PROMPT_COMMANDS, PROMPT_LABELS, PROMPT_SOURCES } from "@/pages/assistant/composer";
import type { GuideSection } from "@/pages/dev/components/types";

function HistoryDemo() {
  const [items, setItems] = useState([{ id: "a", t: "Preventivo per 20 postazioni" }, { id: "b", t: "Riepilogo vendite di ottobre" }, { id: "c", t: "Come imposto le ferie del team" }]);
  const [active, setActive] = useState("a");
  const [editing, setEditing] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  return (
    <div className="w-full max-w-[280px] rounded-card bg-canvas p-1.5 shadow-card">
      {items.map((i) => editing === i.id ? (
        <div key={i.id} className="flex h-8 items-center px-0.5"><InlineRename value={i.t} label="Nome della conversazione" onSave={(v) => setItems((s) => s.map((x) => (x.id === i.id ? { ...x, t: v } : x)))} onDone={() => setEditing(null)} /></div>
      ) : (
        <div key={i.id} data-row className={`flex h-8 items-center rounded-[8px] ${active === i.id ? "bg-hover-2" : "hover:bg-hover"}`}>
          <button type="button" onClick={() => setActive(i.id)} aria-current={active === i.id ? "page" : undefined} className="h-full min-w-0 flex-1 truncate px-2 text-left text-[14px] font-medium text-ink-2">{i.t}</button>
          <ActionMenu label={`Azioni per ${i.t}`} visible={active === i.id} actions={[
            { label: "Rinomina", icon: <Pencil size={15} />, onSelect: () => setEditing(i.id) },
            { label: "Elimina", icon: <Trash2 size={15} />, danger: true, onSelect: () => setDel(i.id) },
          ]} />
        </div>
      ))}
      {items.length === 0 && <p className="px-2 py-2 text-[13px] text-ink-3">Nessuna conversazione. Scrivi una domanda per iniziare.</p>}
      <ConfirmDialog open={Boolean(del)} title="Eliminare la conversazione?" actionLabel="Elimina" onClose={() => setDel(null)}
        onConfirm={() => { const rest = items.filter((x) => x.id !== del); setItems(rest); if (del === active) setActive(rest[0]?.id ?? ""); setDel(null); }}>
        Sparirà dalla cronologia. Non si può recuperare.
      </ConfirmDialog>
    </div>
  );
}

export const assistant: GuideSection = {
  id: "assistente",
  title: "Assistente AI",
  intro: "Chat con cronologia: la conversazione al centro, l'elenco nella sidebar, il campo di scrittura in basso. La pagina completa è in /assistente.",
  docs: [
    {
      id: "cronologia",
      name: "Cronologia con menu ⋯",
      importPath: 'import { ActionMenu } from "@/components/app/ActionMenu";\nimport { InlineRename } from "@/components/app/InlineRename";\nimport { useChatHistory } from "@/pages/assistant/useChatHistory";',
      origin: "Composizione del boilerplate",
      purpose: "Ogni conversazione ha un menu «⋯» con Rinomina ed Elimina. Funziona con mouse, touch e tastiera; non dipende dall'hover. Contratto in docs/assistente-cronologia.md.",
      demos: [{ label: "Cronologia", render: () => <HistoryDemo /> }],
      states: ["Riga attiva: ⋯ sempre visibile", "Altre righe: ⋯ su hover, focus o touch", "Rinomina: campo sul posto, Invio salva, Esc annulla", "Errore: torna il nome precedente con un avviso", "Eliminazione della chat aperta: si apre la successiva o una nuova"],
      props: [
        ["ActionMenu label / actions / visible", "string / MenuAction[] / boolean", "Nome accessibile, voci, visibile anche a riposo"],
        ["InlineRename value / onSave / onDone", "string / (v) => void / () => void", "Rinomina sul posto"],
        ["SidebarNav recentAction / editingRecentId / renderRecentEditor", "slot [boilerplate]", "Azione per riga ed editor nella cronologia"],
        ["API", "listChats, renameChat, deleteChat", "src/api/assistant.ts, contratto del backend"],
      ],
      use: ["Cronologie di conversazioni, documenti recenti, filtri salvati"],
      avoid: ["Cronologia come scheda che sostituisce la chat", "Solo «Elimina tutta la cronologia»", "Azioni visibili solo su hover"],
      wiring: `const history = useChatHistory(id);      // elenco, rinomina, elimina, conferma
<AppLayout chats={history.chats}>
  {conversation}
  {history.dialog}
</AppLayout>`,
      responsive: "Su mobile la cronologia sta nel pannello del menu; ⋯ è sempre visibile perché non c'è hover.",
      a11y: "Bottone ⋯ con aria-haspopup e nome «Azioni per …»; voci role=menuitem; frecce, Home/Fine, Esc riporta il focus al bottone; dopo la rinomina il focus torna sulla riga.",
      customize: ["Voci del menu (es. Fissa, Esporta)", "Lunghezza massima del titolo"],
      mistakes: [{ wrong: "Menu che compare solo passando col mouse.", right: "Bottone sempre nel DOM: Tab lo raggiunge, il touch lo vede." }],
    },
    {
      id: "composer",
      name: "PromptBar e risposte",
      importPath: 'import PromptBar from "@/components/primitives/PromptBar";\nimport ThinkingState from "@/components/primitives/ThinkingState";\nimport StreamingText from "@/components/primitives/StreamingText";',
      origin: "Beautiful UI + parametri",
      purpose: "PromptBar per scrivere (fonti, comandi, dettatura), ThinkingState mentre l'assistente lavora, StreamingText per la risposta con fonti e domande successive.",
      demos: [
        { label: "Composer", render: () => <div className="max-w-[620px]"><PromptBar demo={false} showModel={false} dictate={null} sources={PROMPT_SOURCES} commands={PROMPT_COMMANDS} labels={PROMPT_LABELS} placeholder="Chiedi qualcosa sui tuoi ordini" onSend={() => {}} /></div> },
        { label: "In elaborazione", render: () => <ThinkingState /> },
      ],
      props: [["PromptBar demo / showModel / dictate", "boolean / boolean / fn | null", "Senza comportamento finto, senza scelta del modello, dettatura vera o nascosta"], ["sources / commands / labels", "array / array / object", "Fonti e comandi del progetto, testi italiani"], ["onSend", "(text) => void", "Avvia o continua la conversazione"]],
      use: ["Pagina assistente", "Domanda rapida da una dashboard (?domanda= apre la chat già avviata)"],
      avoid: ["Testo «in elaborazione» simulato senza una richiesta reale in corso"],
      wiring: `<PromptBar demo={false} showModel={false} dictate={dictate} sources={SOURCES}
  commands={COMMANDS} labels={LABELS} placeholder="Chiedi qualcosa" onSend={(t) => start(t)} />`,
      responsive: "Il composer resta in basso, a tutta larghezza fino a 720 px.",
      a11y: "Campo con etichetta; invio con Invio, a capo con Maiusc+Invio; risposte annunciate al termine.",
      customize: ["Fonti, comandi, segnaposto"],
      mistakes: [{ wrong: "ChatComposer con risposte d'esempio lasciate attive.", right: "PromptBar con demo={false} collegato all'API." }],
    },
  ],
};
