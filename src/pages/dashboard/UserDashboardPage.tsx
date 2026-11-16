/*
 * Dashboard utente. Domanda della pagina: "a che punto sono le mie richieste?".
 * Avanzamento (Task Rows), elenco (Filter Table), azione principale: nuova richiesta.
 */
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import TaskRows from "@/components/primitives/TaskRows";
import FilterTable from "@/components/app/ExportableTable";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryAction } from "@/components/app/IconButton";
import { Section } from "@/components/app/Section";
import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";
import { listRequests } from "@/api/requests";
import { useLoad } from "@/lib/data/useLoad";
import { REQUEST_TABLE_LABELS, toRows } from "@/pages/requests/requestTable";
import { TASK_LABELS, userTasks } from "@/pages/dashboard/tasks";

export function UserDashboardPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(listRequests);

  if (loading && !data) return <Page><PageLoading /></Page>;
  if (error || !data) return <Page><PageError onRetry={reload} /></Page>;

  const open = data.filter((r) => r.stato !== "done");
  const newRequest = <PrimaryAction label="Nuova richiesta" icon={<Plus size={15} />} to="/richieste/nuova" />;

  return (
    <Page>
      <PageHeader title="Dashboard" subtitle={open.length ? `${open.length} richieste in lavorazione.` : "Nessuna richiesta in lavorazione."} actions={newRequest} />

      <Section title="In lavorazione">
        {open.length ? <TaskRows className="max-w-none" rows={userTasks(open.slice(0, 3))} labels={TASK_LABELS} /> : <EmptyState title="Quando invii una richiesta, qui ne vedi l'avanzamento." action={newRequest} />}
      </Section>

      <Section title="Le tue richieste" aside={<Link to="/richieste" className="text-[13px] font-medium text-accent-ink hover:underline">Vedi tutte</Link>}>
        <FilterTable fill rows={toRows(data.slice(0, 5))} labels={REQUEST_TABLE_LABELS} onRowClick={(row) => navigate(`/richieste/${row.id}`)} />
      </Section>
    </Page>
  );
}
