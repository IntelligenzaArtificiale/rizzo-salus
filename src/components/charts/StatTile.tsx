/*
 * Indicatore: etichetta, valore, variazione rispetto a un periodo nominato.
 * Il colore della variazione dice se è un bene (`goodWhen`), non solo se sale; con freccia e testo.
 */
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Props = { label: string; value: string; delta?: number; deltaLabel?: string; goodWhen?: "up" | "down"; format?: (n: number) => string };

export function StatTile({ label, value, delta, deltaLabel = "rispetto al periodo prima", goodWhen = "up", format = (n) => `${Math.abs(n)}%` }: Props) {
  const good = delta === undefined || delta === 0 ? null : (delta > 0) === (goodWhen === "up");
  return (
    <div className="flex flex-col gap-1 rounded-card bg-surface p-4 shadow-card">
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <span className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{value}</span>
      {delta !== undefined && (
        <span className={`flex items-center gap-1 text-[12.5px] ${good === null ? "text-ink-3" : good ? "text-green" : "text-red"}`}>
          {delta > 0 ? <ArrowUpRight size={14} aria-hidden /> : delta < 0 ? <ArrowDownRight size={14} aria-hidden /> : null}
          <span>{delta === 0 ? "Stabile" : `${delta > 0 ? "+" : "−"}${format(delta)}`} <span className="text-ink-3">{deltaLabel}</span></span>
        </span>
      )}
    </div>
  );
}
