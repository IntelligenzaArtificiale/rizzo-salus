/*
 * Statistiche. In alto gli indicatori del periodo, poi un grafico per riga:
 * richieste ricevute nel tempo (colonne), andamento (Insight Cards di Beautiful UI),
 * ripartizione per stato (barra segmentata), per categoria e per operatore (barre).
 * Ogni grafico ha la vista tabella. Regole dei grafici: docs/grafici.md.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InsightCards from "@/components/primitives/InsightCards";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PageError, PageLoading } from "@/components/app/PageState";
import { ChartCard } from "@/components/charts/ChartCard";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { BarList } from "@/components/charts/BarList";
import { SegmentedBar } from "@/components/charts/SegmentedBar";
import { StatTile } from "@/components/charts/StatTile";
import { listRequests, type RequestItem } from "@/api/requests";
import { useLoad } from "@/lib/data/useLoad";
import { buildInsights } from "@/pages/dashboard/insights";
import { PERIODS, type Period } from "@/pages/admin/statsData";

const group = (items: RequestItem[], key: (r: RequestItem) => string) =>
  Object.entries(items.reduce<Record<string, { tot: number; done: number }>>((acc, r) => {
    const k = key(r); const c = acc[k] ?? { tot: 0, done: 0 };
    return { ...acc, [k]: { tot: c.tot + 1, done: c.done + (r.stato === "done" ? 1 : 0) } };
  }, {})).sort((a, b) => b[1].tot - a[1].tot);

export function StatsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(listRequests);
  const [period, setPeriod] = useState<Period>("30 giorni");

  if (loading && !data) return <Page wide><PageLoading /></Page>;
  if (error || !data) return <Page wide><PageError onRetry={reload} /></Page>;

  const p = PERIODS[period];
  const received = p.buckets.reduce((a, b) => a + b.value, 0);
  const pct = (now: number, before: number) => Math.round(((now - before) / before) * 100);
  const byState = [
    { label: "Da prendere in carico", value: data.filter((r) => r.stato === "todo").length },
    { label: "In lavorazione", value: data.filter((r) => r.stato === "progress").length },
    { label: "Chiuse", value: data.filter((r) => r.stato === "done").length },
  ];
  const byCategory = group(data, (r) => r.categoria);
  const byOwner = group(data, (r) => (r.assegnata && r.assegnata !== "—" ? r.assegnata : "Non assegnata"));

  return (
    <Page wide>
      <PageHeader title="Statistiche" subtitle={`Ultimi ${period}`} />
      <SegmentedControl options={Object.keys(PERIODS) as Period[]} value={period} onChange={setPeriod} className="w-full sm:w-fit" />

      <div key={period} className="anim-swap grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Richieste ricevute" value={received.toLocaleString("it-IT")} delta={pct(received, p.prevReceived)} />
        <StatTile label="Chiuse" value={p.closed.toLocaleString("it-IT")} delta={pct(p.closed, p.prevClosed)} />
        <StatTile label="Prima risposta" value={`${p.response.toFixed(1).replace(".", ",")} h`} delta={pct(p.response, p.prevResponse)} goodWhen="down" />
        <StatTile label="Clienti soddisfatti" value={`${p.satisfied}%`} delta={p.satisfied - p.prevSatisfied} format={(n) => `${Math.abs(n)} punti`} />
      </div>

      <ChartCard title="Richieste ricevute" subtitle={p.bucketLabel} unit="Richieste" rows={p.buckets}>
        <ColumnChart key={period} rows={p.buckets} unit="richieste" />
      </ChartCard>

      <InsightCards key={`i-${period}`} fill pages={buildInsights(data, p.buckets.slice(-8).map((b) => b.value))}
        labels={{ title: "Andamento", previous: "Precedente", next: "Successivo" }}
        onPill={(q) => navigate(`/assistente?domanda=${encodeURIComponent(q)}`)} />

      <ChartCard title="Per stato" subtitle={`${data.length} richieste in tutto`} unit="Richieste" rows={byState}>
        <SegmentedBar parts={byState} unit="richieste" />
      </ChartCard>

      <ChartCard title="Per categoria" subtitle="Chiuse sul totale ricevuto" unit="Chiuse / totali" rows={byCategory.map(([label, v]) => ({ label, value: v.tot, display: `${v.done} di ${v.tot}` }))}>
        <BarList rows={byCategory.map(([label, v]) => ({ label, value: v.tot, part: v.done }))} unit="richieste" partLabel="chiuse" />
      </ChartCard>

      <ChartCard title="Per operatore" subtitle="Richieste assegnate e chiuse" unit="Chiuse / assegnate" rows={byOwner.map(([label, v]) => ({ label, value: v.tot, display: `${v.done} di ${v.tot}` }))}>
        <BarList rows={byOwner.map(([label, v]) => ({ label, value: v.tot, part: v.done }))} unit="richieste" partLabel="chiuse" />
      </ChartCard>
    </Page>
  );
}
