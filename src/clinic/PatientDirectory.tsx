// Schede composte dai token del kit: identità, stato del percorso e prossimo appuntamento reale.
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Phone, FileText } from "lucide-react";
import { usePagination } from "@/components/app/Pagination";
import { StatusPill } from "@/components/atoms/StatusPill";
import { name, date } from "./common";
import type { Data } from "./api";
export function PatientDirectory({ rows, resetKey }: { rows: Data[]; resetKey: string }) {
  const { pageItems, pager } = usePagination(rows, 18, resetKey);
  return <><div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{pageItems.map(p => {
    const summary = p.riepilogo || {}, next = summary.prossimo;
    return <Link key={p.id} to={"/pazienti/" + p.id} className="patient-directory-card group flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-5 text-ink outline-offset-4 hover:border-line-strong hover:bg-hover">
      <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-inset text-base font-semibold text-ink-2" aria-hidden>{p.nome?.[0]}{p.cognome?.[0]}</span><div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold">{name(p)}</h2><p className="mt-0.5 text-xs text-ink-2">{p.data_nascita ? `Nato/a il ${date(p.data_nascita)}` : "Scheda paziente"}</p></div><ArrowUpRight size={17} className="mt-1 shrink-0 text-ink-2" /></div>
      <div><StatusPill tone={summary.percorsi_attivi ? "green" : "neutral"}>{summary.percorsi_attivi ? `${summary.percorsi_attivi} ${summary.percorsi_attivi === 1 ? "percorso attivo" : "percorsi attivi"}` : "Nessun percorso attivo"}</StatusPill></div>
      <div className="flex min-h-14 items-start gap-2 rounded-control bg-inset px-3 py-2.5"><CalendarDays size={16} className="mt-0.5 shrink-0 text-ink-2" /><div className="min-w-0 text-sm"><p className="font-medium">{next ? `${date(next.start)} · ${next.start.slice(11, 16)}` : "Appuntamento da pianificare"}</p><p className="truncate text-xs text-ink-2">{next?.prestazione || "Nessuna seduta nei prossimi 3 mesi"}</p></div></div>
      <div className="mt-auto flex flex-col gap-1.5 border-t border-line pt-3 text-xs text-ink-2">{p.telefono && <span className="flex items-center gap-2"><Phone size={13} />{p.telefono.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3")}</span>}{p.codice_fiscale && <span className="flex items-center gap-2"><FileText size={13} />{p.codice_fiscale}</span>}{!p.telefono && !p.codice_fiscale && <span>Apri la scheda e i percorsi di cura</span>}</div>
    </Link>;
  })}</div>{pager}</>;
}
