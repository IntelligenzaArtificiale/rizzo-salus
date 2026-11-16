/* Blocco di pagina: titolo piccolo e contenuto. Un blocco per riga (regole UX). */
import type { ReactNode } from "react";

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Coppie etichetta/valore della scheda di dettaglio. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-card border border-line sm:grid-cols-[180px_1fr]">
      {items.map((item, i) => (
        <div key={item.label} className={`contents ${i > 0 ? "[&>*]:border-t [&>*]:border-line" : ""}`}>
          <dt className="bg-inset px-4 py-2.5 text-[13px] text-ink-2">{item.label}</dt>
          <dd className="px-4 py-2.5 text-[14px] text-ink sm:border-l-0">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
