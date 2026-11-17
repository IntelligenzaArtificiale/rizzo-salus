// Gerarchia della pagina attiva: le etichette dei dettagli arrivano dai dati già caricati.
import { useLayoutEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
export type Crumb = { label: string; to?: string };
export const BREADCRUMB_EVENT = "rizzo-page-breadcrumbs";
export function Breadcrumbs({ fallback }: { fallback: string }) {
  const { pathname } = useLocation();
  const [page, setPage] = useState<{ path: string; items: Crumb[] } | null>(null);
  useLayoutEffect(() => {
    const receive = (event: Event) => setPage((event as CustomEvent).detail);
    window.addEventListener(BREADCRUMB_EVENT, receive);
    return () => window.removeEventListener(BREADCRUMB_EVENT, receive);
  }, []);
  const items = page?.path === pathname ? page.items : [{ label: fallback || "Panoramica" }];
  return <nav aria-label="Percorso di navigazione" className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[12px] text-ink-2">
    <Link to="/panoramica" className="shrink-0 rounded px-1 py-1 hover:bg-hover hover:text-ink">Poliambulatorio Rizzo</Link>
    {items.map((item, i) => <span key={i} className="flex min-w-0 shrink-0 items-center gap-1.5"><ChevronRight size={12} aria-hidden />{item.to && i !== items.length - 1 ? <Link className="rounded px-1 py-1 hover:bg-hover hover:text-ink" to={item.to}>{item.label}</Link> : <span aria-current={i === items.length - 1 ? "page" : undefined} className="max-w-64 truncate px-1 font-medium text-ink">{item.label}</span>}</span>)}
  </nav>;
}
