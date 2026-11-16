/*
 * Card di un'entità del dominio (prodotto, offerta, servizio, persona, account) composta con
 * gli atomi Beautiful UI: StatusPill per lo stato, ValuePill per il valore chiave, superficie
 * rounded-card + shadow-card. Estensione documentata in docs/mapping.md: il catalogo vendor
 * non ha una card generica per elementi di una griglia.
 *
 * Slot in ordine di lettura: media → eyebrow (chi/cosa) + stato → titolo → descrizione →
 * valore chiave → meta (al massimo 3 fatti brevi) → azioni.
 * Regole: nessuna data senza significato, nessun codice interno, una sola azione principale.
 * Tutta la card è il link quando c'è `to`; le azioni secondarie restano bottoni separati.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StatusPill } from "@/components/atoms/StatusPill";
import type { StatusInfo } from "@/lib/status";
import { cn } from "@/lib/utils";

export type EntityCardProps = {
  title: ReactNode;
  to?: string;
  media?: ReactNode;
  eyebrow?: ReactNode;
  status?: StatusInfo;
  description?: ReactNode;
  /** valore che decide la scelta: prezzo, sconto, disponibilità, ruolo */
  value?: ReactNode;
  meta?: ReactNode[];
  actions?: ReactNode;
  /** orizzontale per elenchi stretti e persone; verticale (predefinito) per griglie */
  layout?: "vertical" | "horizontal";
  className?: string;
};

export function EntityCard({ title, to, media, eyebrow, status, description, value, meta, actions, layout = "vertical", className }: EntityCardProps) {
  const horizontal = layout === "horizontal";
  const body = (
    <>
      {media && (
        <div className={cn("shrink-0 overflow-hidden rounded-[10px] bg-field", horizontal ? "size-14" : "aspect-[4/3] w-full")}>{media}</div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {(eyebrow || status) && (
          <div className="flex min-h-6 items-center justify-between gap-2">
            {eyebrow && <span className="min-w-0 truncate text-[12.5px] font-medium text-ink-3">{eyebrow}</span>}
            {status && <StatusPill tone={status.tone} className="ml-auto shrink-0">{status.label}</StatusPill>}
          </div>
        )}
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{title}</h3>
        {description && <p className="line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{description}</p>}
        {value && <div className="pt-0.5 text-[15px] font-semibold text-ink">{value}</div>}
        {meta && meta.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 text-[12.5px] text-ink-3">
            {meta.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
      </div>
    </>
  );
  const shell = cn(
    "flex gap-3 rounded-card bg-surface p-3.5 shadow-card motion-state",
    horizontal ? "flex-row items-center" : "flex-col",
    to && "hover:shadow-raised focus-visible:outline-2 focus-visible:outline-accent",
  );
  return (
    <article className={cn("relative flex flex-col", className)}>
      {to ? <Link to={to} className={shell}>{body}</Link> : <div className={shell}>{body}</div>}
      {actions && <div className="absolute right-3 bottom-3 flex gap-1.5">{actions}</div>}
    </article>
  );
}

/** Griglia responsiva di EntityCard: 1 colonna su mobile, poi 2 e 3. */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}
