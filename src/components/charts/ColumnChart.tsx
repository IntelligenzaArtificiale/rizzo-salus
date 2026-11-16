/*
 * Colonne di una sola serie nel tempo (es. richieste per settimana). Colore del marchio,
 * colonne fino a 24 px con estremità arrotondate di 4 px, griglia sottile, tacche arrotondate.
 * Valore stampato solo sull'ultima colonna; gli altri con hover o focus (tooltip) e nella tabella.
 */
import { useState } from "react";
import type { ChartRow } from "@/components/charts/ChartCard";

const nice = (max: number) => { const step = Math.pow(10, Math.floor(Math.log10(max || 1))); const m = max / step; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 8 ? 8 : 10) * step; };

export function ColumnChart({ rows, unit, height = 180 }: { rows: ChartRow[]; unit: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = nice(Math.max(...rows.map((r) => r.value)));
  const ticks = [0, top / 2, top];
  const W = 100 / rows.length;
  return (
    <div className="relative" onPointerLeave={() => setHover(null)}>
      <div className="relative ml-8" style={{ height }}>
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-[var(--viz-grid)]" style={{ bottom: `${(t / top) * 100}%` }}>
            <span className="absolute -left-8 -translate-y-1/2 text-[11.5px] text-[var(--viz-axis)] tabular-nums">{t.toLocaleString("it-IT")}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end">
          {rows.map((r, i) => (
            <div key={r.label} className="relative flex h-full items-end justify-center" style={{ width: `${W}%` }}>
              <button type="button" className="viz-bar absolute inset-x-0 top-0 bottom-0 flex items-end justify-center" aria-label={`${r.label}: ${r.display ?? r.value} ${unit}`}
                onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                <span className="block w-[min(24px,60%)] rounded-t-[4px] bg-accent" style={{ height: `${(r.value / top) * 100}%` }} />
              </button>
              {i === rows.length - 1 && <span className="pointer-events-none absolute -translate-y-5 text-[12px] font-semibold text-ink tabular-nums" style={{ bottom: `${(r.value / top) * 100}%` }}>{r.display ?? r.value}</span>}
              {hover === i && (
                <div role="tooltip" className="anim-pop pointer-events-none absolute z-10 -translate-y-2 rounded-[8px] bg-surface px-2.5 py-1.5 shadow-overlay" style={{ bottom: `${(r.value / top) * 100}%` }}>
                  <div className="text-[13px] font-semibold whitespace-nowrap text-ink tabular-nums">{r.display ?? r.value} {unit}</div>
                  <div className="text-[11.5px] whitespace-nowrap text-ink-2">{r.label}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 ml-8 flex">
        {rows.map((r, i) => <span key={r.label} className={`truncate text-center text-[11.5px] text-[var(--viz-axis)] ${rows.length > 8 && i % 2 ? "invisible sm:visible" : ""}`} style={{ width: `${W}%` }}>{r.label}</span>)}
      </div>
    </div>
  );
}
