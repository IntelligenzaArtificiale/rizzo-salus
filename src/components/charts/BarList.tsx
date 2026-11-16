/*
 * Barre orizzontali per confrontare grandezze fra categorie, ordinate dalla più grande.
 * Una serie, colore del marchio, barre da 10 px con estremità arrotondata, valore alla punta.
 * Opzionale `part`: quota evidenziata dentro la barra (es. chiuse su totali), traccia più chiara.
 */
import type { ChartRow } from "@/components/charts/ChartCard";

export type BarRow = ChartRow & { part?: number };

export function BarList({ rows, unit, partLabel }: { rows: BarRow[]; unit: string; partLabel?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto] items-center gap-3 text-[13.5px]"
          title={`${r.label}: ${r.display ?? r.value} ${unit}${r.part !== undefined && partLabel ? `, ${r.part} ${partLabel}` : ""}`}>
          <span className="truncate text-ink">{r.label}</span>
          <span className="relative h-2.5 overflow-hidden rounded-full bg-accent-tint" aria-hidden>
            <span className="absolute inset-y-0 left-0 rounded-full bg-accent/35" style={{ width: `${(r.value / max) * 100}%` }} />
            {r.part !== undefined && <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${(r.part / max) * 100}%` }} />}
          </span>
          <span className="text-right text-ink-2 tabular-nums">{r.part !== undefined ? `${r.part} di ${r.value}` : (r.display ?? r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
