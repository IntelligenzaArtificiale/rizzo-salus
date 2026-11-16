import { ExportExcelButton } from "@/components/app/ExportExcelButton";
/* Registro attività: chi ha fatto cosa e quando. Filtro per tipo con il Segmented Control di Beautiful UI. */
import { useState } from "react";
import { PageTabs } from "@/components/app/PageTabs";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { RowList } from "@/components/app/RowList";
import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";
import { listAudit, type AuditItem } from "@/api/feed";
import { useLoad } from "@/lib/data/useLoad";
import { formatDateTime } from "@/lib/format";

const FILTERS = ["Tutto", "Modifiche", "Creazioni", "Eliminazioni", "Accessi"] as const;
const ACTION_OF: Record<(typeof FILTERS)[number], AuditItem["azione"] | null> = {
  Tutto: null, Modifiche: "modifica", Creazioni: "creazione", Eliminazioni: "eliminazione", Accessi: "accesso",
};

export function AuditPage() {
  const { data, loading, error, reload } = useLoad(listAudit);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tutto");
  const rows = (data ?? []).filter((a) => !ACTION_OF[filter] || a.azione === ACTION_OF[filter]);

  return (
    <Page>
      <PageHeader title="Registro attività" />
      <div><PageTabs options={FILTERS} value={filter} onChange={setFilter} /></div>
      <ExportExcelButton filename="registro-attivita" headers={["ID", "Data", "Utente", "Azione", "Oggetto", "Descrizione"]} rows={rows.map((a) => [a.id, a.quando, a.chi, a.azione, a.oggetto, a.descrizione])} />
      {loading && !data && <PageLoading />}
      {error && <PageError onRetry={reload} />}
      {data && rows.length === 0 && <EmptyState title="Nessuna attività di questo tipo." />}
      {rows.length > 0 && (
        <RowList
          resetKey={filter}
          rows={rows.map((a) => ({
            key: a.id,
            to: `/admin/registro/${a.id}`,
            title: `${a.chi} · ${a.descrizione.toLowerCase()}`,
            meta: a.oggetto,
            aside: formatDateTime(a.quando),
            mark: <span className={`size-1.5 rounded-full ${a.azione === "eliminazione" ? "bg-red" : a.azione === "creazione" ? "bg-green" : a.azione === "accesso" ? "bg-ink-3" : "bg-accent"}`} />,
          }))}
        />
      )}
    </Page>
  );
}
