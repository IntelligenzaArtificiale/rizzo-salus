/*
 * Serie d'esempio delle statistiche per periodo. In produzione arrivano dal backend
 * (POST /statistiche/periodo { periodo } → stessa forma): il frontend non calcola totali storici.
 */
export type PeriodData = {
  bucketLabel: string; buckets: { label: string; value: number }[];
  prevReceived: number; closed: number; prevClosed: number;
  response: number; prevResponse: number; satisfied: number; prevSatisfied: number;
};

const days = ["28 ott", "29 ott", "30 ott", "31 ott", "1 nov", "2 nov", "3 nov"];
const weeks = ["7 ott", "14 ott", "21 ott", "28 ott"];
const months = ["dic", "gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov"];
const series = (labels: string[], values: number[]) => labels.map((label, i) => ({ label, value: values[i] }));

export const PERIODS = {
  "7 giorni": { bucketLabel: "Per giorno", buckets: series(days, [4, 6, 3, 7, 2, 1, 9]), prevReceived: 26, closed: 21, prevClosed: 18, response: 3.1, prevResponse: 4.4, satisfied: 92, prevSatisfied: 89 },
  "30 giorni": { bucketLabel: "Per settimana", buckets: series(weeks, [24, 31, 27, 32]), prevReceived: 101, closed: 96, prevClosed: 88, response: 3.6, prevResponse: 4.1, satisfied: 90, prevSatisfied: 90 },
  "12 mesi": { bucketLabel: "Per mese", buckets: series(months, [61, 70, 66, 75, 80, 78, 85, 72, 54, 96, 114, 32]), prevReceived: 790, closed: 841, prevClosed: 702, response: 4.0, prevResponse: 5.2, satisfied: 88, prevSatisfied: 84 },
} satisfies Record<string, PeriodData>;

export type Period = keyof typeof PERIODS;
