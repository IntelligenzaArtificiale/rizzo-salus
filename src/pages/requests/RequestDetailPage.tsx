/*
 * Scheda di una richiesta. Dati in sola lettura; modificare apre la pagina dedicata,
 * eliminare chiede conferma (unica modal ammessa). Componenti Beautiful UI:
 * Selection Actions (migliorare la descrizione), Context Cards (documenti),
 * Chat (domande sulla richiesta).
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import SelectionActions from "@/components/primitives/SelectionActions";
import ContextCards from "@/components/primitives/ContextCards";
import ChatComposer from "@/components/primitives/ChatComposer";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DetailList, Section } from "@/components/app/Section";
import { PageError, PageLoading } from "@/components/app/PageState";
import { useToast } from "@/components/feedback/toast-context";
import { deleteRequest, getRequest, STATUS_LABEL } from "@/api/requests";
import { useLoad } from "@/lib/data/useLoad";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { formatDate } from "@/lib/format";
import { SELECTION_ACTIONS_IT, SELECTION_LABELS_IT, improveText } from "@/pages/requests/requestAi";

const BADGE_TONE = { PDF: "bg-red", XLSX: "bg-green", JPG: "bg-accent" } as const;
const PRIORITY = { bassa: "Bassa", media: "Media", alta: "Alta" } as const;

export function RequestDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePlatform();
  const { data, loading, error, reload } = useLoad(() => getRequest(id), [id]);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading && !data) return <Page><PageLoading /></Page>;
  if (error || !data) return <Page><PageError onRetry={reload} /></Page>;

  async function remove() {
    setDeleting(true);
    await deleteRequest(id);
    setDeleting(false);
    toast.show({ tone: "success", title: `${id} eliminata` });
    navigate("/richieste");
  }

  return (
    <Page>
      <PageHeader
        back={{ to: "/richieste", label: "Richieste" }}
        title={data.titolo}
        subtitle={`${data.id} · ${data.cliente}`}
        actions={
          <>
            {can("richieste.modifica") && <IconButton label="Modifica" icon={<Pencil size={15} />} to={`/richieste/${id}/modifica`} />}
            {can("richieste.elimina") && <IconButton label="Elimina" icon={<Trash2 size={15} />} tone="danger" onClick={() => setConfirm(true)} />}
          </>
        }
      />

      <DetailList
        items={[
          { label: "Stato", value: STATUS_LABEL[data.stato] },
          { label: "Priorità", value: PRIORITY[data.priorita] },
          { label: "Categoria", value: data.categoria },
          { label: "Assegnata a", value: data.assegnata },
          { label: "Creata il", value: formatDate(data.creata) },
        ]}
      />

      <Section title="Descrizione">
        <SelectionActions
          text={{ lead: "", original: data.descrizione, rewrite: improveText(data.descrizione) }}
          actions={SELECTION_ACTIONS_IT}
          labels={SELECTION_LABELS_IT}
        />
      </Section>

      {data.allegati.length > 0 && (
        <ContextCards
            className="max-w-none"
            labels={{ header: "Documenti", count: String(data.allegati.length) }}
            chunks={data.allegati.map((a) => ({ title: a.nome, chars: a.dimensione, body: a.estratto, source: a.nome, badge: a.tipo, tone: BADGE_TONE[a.tipo] }))}
          />
      )}

      <Section title="Chiedi all'assistente">
        <ChatComposer
          suggestions={["Richiesta", "Cliente"]}
          labels={{ initialPrompt: `Qual è il prossimo passo per ${data.id}?`, placeholder: "Scrivi una domanda su questa richiesta" }}
          messages={[
            { label: "Storico", sub: data.id, time: "2s", body: data.storico.length ? `Ultima modifica: ${data.storico[0].campo.toLowerCase()} da ${data.storico[0].prima} a ${data.storico[0].dopo}.` : "Nessuna modifica dalla creazione." },
            { label: "Prossimo passo", sub: data.categoria, time: "1s", body: data.stato === "done" ? "La richiesta è chiusa: puoi archiviarla." : `Contatta ${data.cliente} per confermare i tempi.` },
          ]}
        />
      </Section>

      <ConfirmDialog open={confirm} title={`Eliminare ${data.id}?`} actionLabel="Elimina" busy={deleting} onConfirm={remove} onClose={() => setConfirm(false)}>
        La richiesta e i suoi documenti non saranno più recuperabili.
      </ConfirmDialog>
    </Page>
  );
}
