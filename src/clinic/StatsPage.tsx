// Statistiche calcolate dal backend, senza numeri o confronti simulati.
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { TextField } from "@/components/form/TextField";
import { StatTile } from "@/components/charts/StatTile";
import { ChartCard } from "@/components/charts/ChartCard";
import { BarList } from "@/components/charts/BarList";
import { DetailList, Section } from "@/components/app/Section";
import { api, type Data } from "./api";
import { LoadState, useLoad, today, monday, addDays, date } from "./common";
export function StatsPage() {
  const [params, setParams] = useSearchParams();
  const week = params.get("settimana") || monday(today());
  const from = params.get("da") || week,
    through = params.get("a") || addDays(week, 4);
  const load = useLoad(
    () => api("/agenda/statistiche", { da: from, a: through }),
    [from, through],
  );
  const d = load.data;
  const therapies = (d?.terapie || []).map((t: Data) => ({
    label: t.nome,
    value: t.sedute,
  }));
  const professionals = (d?.professionisti || []).map((p: Data) => ({
    label: p.nome,
    value: p.programmati,
  }));
  return (
    <LoadState load={load} wide>
      <PageHeader
        title="Statistiche agenda"
        subtitle={`${date(from)} – ${date(through)}`}
        actions={
          <>
            <IconButton
              label="Settimana precedente"
              icon={<ChevronLeft size={16} />}
              onClick={() => setParams({ settimana: addDays(week, -7) })}
            />
            <IconButton
              label="Settimana successiva"
              icon={<ChevronRight size={16} />}
              onClick={() => setParams({ settimana: addDays(week, 7) })}
            />
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Statistiche dal"
          type="date"
          value={from}
          onChange={(da) => setParams({ da, a: through })}
        />
        <TextField
          label="Statistiche fino al"
          type="date"
          value={through}
          onChange={(a) => setParams({ da: from, a })}
        />
      </div>
      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Appuntamenti"
              value={String(d.totali.programmati)}
            />
            <StatTile label="Eseguiti" value={String(d.totali.eseguiti)} />
            <StatTile
              label="Assenze"
              value={`${d.totali.assenti} · ${d.totali.tasso_assenze}%`}
            />
            <StatTile
              label="Saturazione"
              value={`${d.totali.saturazione ?? 0}%`}
            />
          </div>
          <ChartCard title="Sedute per terapia" rows={therapies} unit="Sedute">
            <BarList rows={therapies} unit="sedute" />
          </ChartCard>
          <ChartCard
            title="Appuntamenti per professionista"
            rows={professionals}
            unit="Appuntamenti"
          >
            <BarList rows={professionals} unit="appuntamenti" />
          </ChartCard>
          <Section title="Pazienti, prestazioni e ore per professionista">
            <p className="text-sm text-ink-2">
              Un gruppo conta una sola volta per le ore dell’operatore. Le ore
              da sedute eseguite sono distinte dalle presenze registrate;
              nessuna preparazione aggiunta automaticamente.
            </p>
            <DetailList
              items={d.professionisti.map((p: Data) => ({
                label: p.nome,
                value: `${p.pazienti_trattati} pazienti · ${p.prestazioni_eseguite} prestazioni · ${(p.minuti_programmati / 60).toFixed(2)} ore programmate · ${(p.minuti_eseguiti / 60).toFixed(2)} ore da eseguite · ${(p.minuti_presenze_registrate / 60).toFixed(2)} ore presenze registrate`,
              }))}
            />
          </Section>
          <Section title="Presenze per famiglia">
            <DetailList
              items={(d.presenze_per_famiglia ?? []).map((f: Data) => ({
                label: f.famiglia,
                value: `${f.eseguite} eseguite · ${f.programmate} programmate · ${f.assenze} assenze · ${f.cancellazioni} cancellazioni`,
              }))}
            />
          </Section>
          <Section title="Esiti per paziente">
            <DetailList
              items={(d.esiti_per_paziente ?? []).map((p: Data) => ({
                label: p.nome,
                value: `${p.eseguite} eseguite · ${p.assenze} assenze · ${p.cancellazioni} cancellazioni`,
              }))}
            />
          </Section>
          <Section title="Saturazione e assenze">
            <DetailList
              items={d.professionisti.map((p: Data) => ({
                label: p.nome,
                value: `Saturazione ${p.saturazione ?? 0}% · ${p.assenti} assenze`,
              }))}
            />
          </Section>
        </>
      )}
    </LoadState>
  );
}
