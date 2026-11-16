/*
 * Dashboard amministratore. Domanda della pagina: "cosa devo prendere in carico oggi?".
 * Un blocco per riga: andamento (Insight Cards), suggerimento (Recommendation Card),
 * lavori in corso (Task Rows), ultime richieste (Filter Table).
 */
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import InsightCards from "@/components/primitives/InsightCards";
import RecommendationCard from "@/components/primitives/RecommendationCard";
import TaskRows from "@/components/primitives/TaskRows";
import FilterTable from "@/components/app/ExportableTable";
import { EntityChip } from "@/components/atoms/EntityChip";
import { ValuePill } from "@/components/atoms/ValuePill";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { PageError, PageLoading } from "@/components/app/PageState";
import { useToast } from "@/components/feedback/toast-context";
import { listRequests } from "@/api/requests";
import { useLoad } from "@/lib/data/useLoad";
import { buildInsights, RECEIVED_LAST_DAYS } from "@/pages/dashboard/insights";
import { REQUEST_TABLE_LABELS, toRows } from "@/pages/requests/requestTable";
import { ADMIN_TASKS, TASK_LABELS } from "@/pages/dashboard/tasks";

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(listRequests);

  if (loading && !data) return <Page><PageLoading /></Page>;
  if (error || !data) return <Page><PageError onRetry={reload} /></Page>;

  const todo = data.filter((r) => r.stato === "todo");
  const ask = (prompt: string) => navigate(`/assistente?domanda=${encodeURIComponent(prompt)}`);

  return (
    <Page>
      <PageHeader title="Dashboard" subtitle={todo.length === 1 ? "1 richiesta da prendere in carico." : `${todo.length} richieste da prendere in carico.`} />

      <Section title="Suggerimento">
        <RecommendationCard
          fill
          labels={{ title: `Assegno ${todo[0]?.id ?? "R-1042"} a Luca Greco?`, alternatives: "Alternative", otherOptions: "Altre opzioni", accepted: "Assegnata" }}
          onAccept={() => toast.show({ tone: "success", title: "Richiesta assegnata a Luca Greco" })}
          options={[
            { key: "luca", body: <>Assegna a <EntityChip name="Luca Greco" /> che chiude queste richieste in <ValuePill tone="green">1,2 giorni</ValuePill></>, short: "Assegna a Luca Greco", signal: 3, tone: "var(--green)", label: "Consigliato", cta: "Assegna", ctaVariant: "accent" },
            { key: "sara", body: <>Assegna a <EntityChip name="Sara Lombardo" />, oggi con <ValuePill>4 richieste</ValuePill> aperte</>, short: "Assegna a Sara Lombardo", signal: 2, tone: "var(--orange)", label: "Possibile", cta: "Assegna", ctaVariant: "primary" },
            { key: "coda", body: <>Lascia la richiesta in <span className="font-medium text-ink">coda</span> fino a domani.</>, short: "Lascia in coda", signal: 1, tone: "var(--ink-3)", label: "Sconsigliato", cta: "Lascia in coda", ctaVariant: "secondary" },
          ]}
        />
      </Section>

      <InsightCards fill pages={buildInsights(data, RECEIVED_LAST_DAYS)} labels={{ title: "Andamento", previous: "Precedente", next: "Successivo" }} onPill={ask} />

      <Section title="Lavori in corso">
        <TaskRows className="max-w-none" rows={ADMIN_TASKS} labels={TASK_LABELS} />
      </Section>

      <Section title="Ultime richieste" aside={<Link to="/richieste" className="text-[13px] font-medium text-accent-ink hover:underline">Vedi tutte</Link>}>
        <FilterTable fill rows={toRows(data.slice(0, 5))} labels={REQUEST_TABLE_LABELS} onRowClick={(row) => navigate(`/richieste/${row.id}`)} />
      </Section>
    </Page>
  );
}
