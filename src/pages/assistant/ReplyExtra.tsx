import { ExportExcelButton } from "@/components/app/ExportExcelButton";
/*
 * Blocco d'azione alla fine di una risposta: suggerimento (Recommendation Card), modifiche
 * proposte (Diff Table), documenti (Context Cards), lavoro in corso (Agent Screen).
 */
import RecommendationCard from "@/components/primitives/RecommendationCard";
import DiffTable from "@/components/primitives/DiffTable";
import ContextCards from "@/components/primitives/ContextCards";
import AgentScreen from "@/components/primitives/AgentScreen";
import { EntityChip } from "@/components/atoms/EntityChip";
import { ValuePill } from "@/components/atoms/ValuePill";
import { useToast } from "@/components/feedback/toast-context";
import type { ScenarioExtra } from "@/pages/assistant/scenarios";

const ARCHIVE_ROWS = [
          { key: "R-1039", id: "R-1039", dept: "Reso", email: "Ferramenta Sciuto", removed: true },
          { key: "R-1035", id: "R-1035", dept: "Fornitura", email: "Ceramiche Etna", removed: true },
          { key: "R-1037", id: "R-1037", dept: "Fornitura", email: "Edil Sud S.r.l.", removed: false },
        ];

export function ReplyExtra({ kind, onOpen }: { kind: ScenarioExtra; onOpen: (to: string) => void }) {
  const toast = useToast();
  if (kind === "recommendation") {
    return (
      <RecommendationCard
        labels={{ title: "Assegno R-1038 a Sara Lombardo?", alternatives: "Alternative", otherOptions: "Altre opzioni", accepted: "Assegnata" }}
        onAccept={() => toast.show({ tone: "success", title: "R-1038 assegnata a Sara Lombardo" })}
        options={[
          { key: "sara", body: <>Assegna a <EntityChip name="Sara Lombardo" />, libera <ValuePill tone="green">da domani</ValuePill></>, short: "Assegna a Sara Lombardo", signal: 3, tone: "var(--green)", label: "Consigliato", cta: "Assegna", ctaVariant: "accent" },
          { key: "apri", body: <>Apri la richiesta e decidi tu.</>, short: "Apri R-1038", signal: 1, tone: "var(--ink-3)", label: "Manuale", cta: "Apri", ctaVariant: "secondary" },
        ]}
      />
    );
  }
  if (kind === "diff") {
    return (
      <div className="flex flex-col gap-2">
      <ExportExcelButton filename="proposta-archiviazione" headers={["Richiesta", "Categoria", "Cliente", "Proposta di archiviazione"]}
        rows={ARCHIVE_ROWS.map((row) => [row.id, row.dept, row.email, row.removed])} />
      <DiffTable
        rows={ARCHIVE_ROWS}
        added={null}
        dots={{ Reso: "bg-orange", Fornitura: "bg-accent" }}
        labels={{
          title: "Richieste completate da archiviare", hint: "Tocca una riga per escluderla", columns: ["Richiesta", "Categoria", "Cliente"], include: "Includi",
          edit: "richiesta", edits: "richieste", applied: "archiviate", removal: "da archiviare", removals: "da archiviare",
          addition: "aggiunta", additions: "aggiunte", apply: "Archivia", change: "richiesta", changes: "richieste",
        }}
        onApply={(keys) => toast.show({ tone: "success", title: `${keys.length} richieste archiviate` })}
      />
      </div>
    );
  }
  if (kind === "context") {
    return (
      <ContextCards
        labels={{ header: "Documenti usati", count: "2" }}
        chunks={[
          { title: "Impermeabilizzazione cementizia", chars: "Scheda tecnica", body: "Bicomponente elastica, 2 mani da 1 mm, posa di piastrelle dopo 5 giorni.", source: "Scheda-impermeabilizzante.pdf", badge: "PDF", tone: "bg-red" },
          { title: "Raccordi e pluviali", chars: "Dettaglio di posa", body: "Nastro in tessuto sui raccordi parete-pavimento e bocchettoni prefabbricati sui pluviali.", source: "Dettagli-posa.pdf", badge: "PDF", tone: "bg-red" },
        ]}
      />
    );
  }
  if (kind === "agent") {
    return (
      <div className="flex flex-col items-start gap-2">
        <AgentScreen agentName="Assistente" variant="Working" streamSrc="./schermo-assistente.jpg" />
        <button type="button" onClick={() => onOpen("/richieste/R-1042")} className="text-[13px] font-medium text-accent-ink hover:underline">Apri R-1042</button>
      </div>
    );
  }
  return null;
}
