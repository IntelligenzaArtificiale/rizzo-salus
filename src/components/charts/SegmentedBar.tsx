/*
 * Un intero diviso in parti (es. richieste per stato). Barra alta 28 px, blocchi separati da 2 px,
 * quota stampata dentro quando c'è spazio, legenda con i nomi nello stesso ordine.
 * Colori categoriali validati (charts.css): sempre in quest'ordine, mai assegnati per rango.
 */
const SLOT = ["bg-[var(--viz-1)]", "bg-[var(--viz-2)]", "bg-[var(--viz-3)]"];

export function SegmentedBar({ parts, unit }: { parts: { label: string; value: number }[]; unit: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-7 gap-[2px]" role="img" aria-label={parts.map((p) => `${p.label} ${p.value} ${unit} (${Math.round((p.value / total) * 100)}%)`).join(", ")}>
        {parts.filter((p) => p.value > 0).map((p) => {
          const share = Math.round((p.value / total) * 100);
          const i = parts.indexOf(p);
          return (
            <div key={p.label} title={`${p.label}: ${p.value} ${unit} (${share}%)`} className={`flex min-w-0 items-center rounded-[4px] px-2 ${SLOT[i]}`} style={{ flexGrow: p.value, flexBasis: 0 }}>
              {share >= 12 && <span className="truncate text-[12px] font-semibold text-white tabular-nums">{share}%</span>}
            </div>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2">
        {parts.map((p, i) => <li key={p.label} className="flex items-center gap-1.5"><span aria-hidden className={`size-2.5 rounded-[3px] ${SLOT[i]}`} />{p.label}</li>)}
      </ul>
    </div>
  );
}
