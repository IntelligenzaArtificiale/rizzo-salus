/*
 * Paginazione: "1–20 di 46" e frecce. Compare solo se gli elementi superano una pagina.
 * Due modi, stesso aspetto:
 * - locale: usePagination(items) taglia l'elenco già caricato e torna alla prima pagina quando cambia;
 * - server: <Pagination page pages total pageSize onPage /> con i totali restituiti dal backend
 *   (page parte da 0; serverPage() converte da numerazione 1-based).
 * Mai bottoni testuali «Precedente/Successiva» o un secondo componente di paginazione.
 */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 20;

export function usePagination<T>(items: T[], pageSize = PAGE_SIZE, resetKey: unknown = items.length) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [resetKey]);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages - 1);
  return {
    pageItems: items.slice(current * pageSize, current * pageSize + pageSize),
    pager: <Pagination page={current} pages={pages} total={items.length} pageSize={pageSize} onPage={setPage} />,
  };
}

/** Risposta paginata del backend con pagine numerate da 1 → props di Pagination. */
export const serverPage = (r: { page: number; pages: number; total: number; per_page: number }, onPage: (page1: number) => void) =>
  ({ page: r.page - 1, pages: r.pages, total: r.total, pageSize: r.per_page, onPage: (p: number) => onPage(p + 1) });

type Props = { page: number; pages: number; total: number; pageSize: number; onPage: (p: number) => void; busy?: boolean };

export function Pagination({ page, pages, total, pageSize, onPage, busy = false }: Props) {
  if (total <= pageSize || pages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, from + pageSize - 1);
  const btn = "motion-state flex size-8 items-center justify-center rounded-[8px] text-ink-2 hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-35";
  return (
    <nav aria-label="Pagine" aria-busy={busy} className="flex items-center justify-end gap-1 text-[13px] text-ink-2 tabular-nums">
      <span className="mr-2" aria-live="polite">{from}–{to} di {total}</span>
      <button type="button" className={btn} onClick={() => onPage(page - 1)} disabled={page === 0 || busy} aria-label="Pagina precedente" title="Pagina precedente"><ChevronLeft size={16} /></button>
      <button type="button" className={btn} onClick={() => onPage(page + 1)} disabled={page >= pages - 1 || busy} aria-label="Pagina successiva" title="Pagina successiva"><ChevronRight size={16} /></button>
    </nav>
  );
}
