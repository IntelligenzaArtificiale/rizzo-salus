/*
 * Riquadro di un grafico: titolo, una riga di contesto, comando «tabella» e il grafico.
 * La vista tabella mostra gli stessi valori in righe: nessun dato è raggiungibile solo col mouse.
 */
import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";

export type ChartRow = { label: string; value: number; display?: string };

export function ChartCard({ title, subtitle, rows, unit, children }: { title: string; subtitle?: string; rows: ChartRow[]; unit: string; children: ReactNode }) {
  const [table, setTable] = useState(false);
  return (
    <section className="viz-root flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card sm:p-5" aria-label={title}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-[13px] text-ink-2">{subtitle}</p>}
        </div>
        <button type="button" onClick={() => setTable((t) => !t)} aria-pressed={table} title={table ? "Mostra il grafico" : "Mostra come tabella"} aria-label={table ? "Mostra il grafico" : "Mostra come tabella"}
          className="motion-state flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 hover:bg-hover hover:text-ink">
          {table ? <BarChart3 size={16} /> : <Table2 size={16} />}
        </button>
      </header>
      {table ? (
        <table className="anim-swap w-full text-left text-[13.5px]">
          <thead><tr className="border-b border-line text-[12.5px] text-ink-2"><th className="py-2 font-medium">Voce</th><th className="py-2 text-right font-medium">{unit}</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.label} className="border-b border-line last:border-0"><td className="py-2 text-ink">{r.label}</td><td className="py-2 text-right text-ink tabular-nums">{r.display ?? r.value.toLocaleString("it-IT")}</td></tr>)}</tbody>
        </table>
      ) : <div className="anim-swap min-w-0">{children}</div>}
    </section>
  );
}
