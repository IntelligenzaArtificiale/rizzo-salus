/*
 * Pagine delle Insight Cards (Beautiful UI) costruite dai dati delle richieste.
 * I numeri derivano dalle righe: conteggi per categoria, ricevute per giorno.
 */
import { AllocationCard, AnomalyCard, CompareCard, Entity, Mono, type InsightPage } from "@/components/primitives/InsightCards";
import type { RequestItem } from "@/api/requests";

const hours = (v: number) => `${v.toFixed(1)} h`;
const count = (v: number) => `${Math.round(v)}`;

export function buildInsights(requests: RequestItem[], days: number[]): InsightPage[] {
  const open = requests.filter((r) => r.stato !== "done").length;
  const byCategory = Object.entries(
    requests.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.categoria]: (acc[r.categoria] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);
  const top = byCategory[0];
  const total = requests.length;
  const tones = ["bg-orange", "bg-line-strong", "bg-line"];
  const segments = byCategory.slice(0, 3).map(([name, n], i) => ({
    name: name.slice(0, 4).toUpperCase(),
    label: name,
    pct: Math.round((n / total) * 1000) / 10,
    amount: `${n} richieste`,
    cls: tones[i],
    tone: i === 0 ? "text-orange" : "text-ink-2",
  }));
  const peak = Math.max(...days);
  const avg = days.slice(0, -1).reduce((a, b) => a + b, 0) / (days.length - 1);

  return [
    {
      key: "risposta",
      prose: (
        <>Il tempo medio di prima risposta è sceso a <Mono tone="green">3,1 h</Mono>, contro <Mono tone="red">4,4 h</Mono> della settimana scorsa.</>
      ),
      Card: () => (
        <CompareCard
          title="Tempo di prima risposta"
          badge="Ultime 8 settimane"
          format={hours}
          series={[
            { name: "Assistenza tecnica", values: [5.2, 4.9, 5.1, 4.6, 4.4, 4.0, 3.6, 3.1], sub: "−1,3 h", tone: "green", dot: "bg-green", color: "#25a878", tooltipColor: "var(--green)" },
            { name: "Forniture", values: [3.1, 3.4, 3.3, 3.8, 4.0, 4.2, 4.3, 4.4], sub: "+0,4 h", tone: "red", dot: "bg-orange", color: "#f68f3c", tooltipColor: "var(--orange)" },
          ]}
        />
      ),
      pill: "Perché le forniture rallentano?",
    },
    {
      key: "ricevute",
      prose: (
        <>Oggi sono arrivate <span className="font-medium text-ink">{days.at(-1)}</span> richieste: <Mono tone="red">+{Math.round(days.at(-1)! - avg)}</Mono> rispetto alla media degli ultimi giorni.</>
      ),
      Card: () => (
        <AnomalyCard
          data={{ spend: days, usage: days.map((d) => Math.max(1, Math.round(d * 0.4))) }}
          formatSpend={count}
          formatUsage={count}
          labels={{
            title: "Richieste ricevute", badge: "Ultimi 8 giorni", spend: "Richieste", usage: "Urgenti", threshold: "Soglia",
            thresholdSpend: String(Math.round(peak * 0.8)), thresholdUsage: String(Math.round(peak * 0.3)), total: "oggi",
            delta: `+${Math.round(days.at(-1)! - avg)}`, deltaNote: "sulla media",
          }}
        />
      ),
      pill: "Chi può prendere in carico le nuove?",
    },
    {
      key: "categorie",
      prose: (
        <>Le richieste di <Entity name={top[0]} tone="bg-orange" /> sono <span className="font-medium text-ink">{top[1]} su {total}</span>. Aperte in totale: {open}.</>
      ),
      Card: () => <AllocationCard segments={segments} title="Richieste per categoria" note="Tocca una categoria per vederne la quota." />,
      pill: "Mostrami le richieste aperte per categoria",
    },
  ];
}

/** Richieste ricevute negli ultimi 8 giorni (dato d'esempio coerente con l'elenco). */
export const RECEIVED_LAST_DAYS = [3, 4, 2, 5, 4, 3, 6, 11];
