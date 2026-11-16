"use client";

import { useState, type ReactNode } from "react";

/* ─────────────────────────────────────────────────────────
 * FILTER TABLE
 * Status chips directly filter the task table.
 * ───────────────────────────────────────────────────────── */

type Status = "todo" | "progress" | "done";

export type TableRow = { id?: string; task: string; date: string; status: Status; owner: string };
export type FilterStatus = Status;

export type FilterTableLabels = {
  columns: { task: string; date: string; status: string; owner: string };
  /* [boilerplate] etichette di filtri e stati, prima fisse nel codice */
  all?: string;
  statuses?: Record<Status, string>;
  tableLabel?: string;
};

/* [boilerplate] conteggi calcolati dalle righe invece che fissi */
const FILTERS: { key: "all" | Status; dot?: string }[] = [
  { key: "all" },
  { key: "todo", dot: "#f09a2f" },
  { key: "progress", dot: "#16a6c7" },
  { key: "done", dot: "#25a878" },
];

const ROWS: TableRow[] = [
  { task: "Restock mango sorbet", date: "Dec 03", status: "todo", owner: "Mango Moon Gelato" },
  { task: "Churn black sesame", date: "Sep 22", status: "progress", owner: "Kumo Creamery" },
  { task: "Print summer menu", date: "Jan 02", status: "todo", owner: "Coral Coast Sorbet" },
  { task: "Taste-test batch 42", date: "Nov 08", status: "progress", owner: "Maple Orbit" },
  { task: "Order waffle cones", date: "Apr 14", status: "done", owner: "Aurora Scoops" },
];

const LABELS: FilterTableLabels = {
  columns: { task: "Task name", date: "Date", status: "Status", owner: "Advisor" },
};

const PILLS: Record<Status, { label: string; cls: string }> = {
  todo: { label: "To do", cls: "filter-status-todo" },
  progress: { label: "In Progress", cls: "filter-status-progress" },
  done: { label: "Completed", cls: "filter-status-done" },
};

export default function FilterTable({
  rows = ROWS,
  labels = LABELS,
  fill = false,
  onRowClick,
  pageSize = 0,
  renderExport,
}: {
  rows?: TableRow[];
  renderExport?: (rows: TableRow[]) => ReactNode;
  labels?: FilterTableLabels;
  variant?: string;
  /* [boilerplate] tutta la larghezza del contenitore e righe cliccabili */
  fill?: boolean;
  onRowClick?: (row: TableRow) => void;
  /* [boilerplate] paginazione dopo il filtro (0 = nessuna) */
  pageSize?: number;
} = {}) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [page, setPage] = useState(0);
  const filtered = rows.filter((r) => filter === "all" || r.status === filter);
  const pages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const current = Math.min(page, pages - 1);
  const visibleIds = new Set((pageSize ? filtered.slice(current * pageSize, current * pageSize + pageSize) : filtered).map((r) => r.id ?? r.task));
  const filterLabel = (key: "all" | Status) => (key === "all" ? labels.all ?? "All" : labels.statuses?.[key] ?? PILLS[key].label);
  const countOf = (key: "all" | Status) => (key === "all" ? rows.length : rows.filter((r) => r.status === key).length);

  return (
    <div className={fill ? "w-full" : "w-full max-w-105"}>
      {renderExport && <div className="mb-2 flex justify-end">{renderExport(filtered)}</div>}
      {/* filter chips */}
      <div
        className="-mx-1 mb-1 flex items-center gap-1 overflow-x-auto px-1 py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => { setFilter(f.key); setPage(0); }}
              className={`flex h-6.5 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px]
                font-medium transition-[background-color,box-shadow,color] duration-200
                ${active ? "bg-surface text-ink shadow-btn" : "text-ink-2 hover:bg-hover"}`}
            >
              {f.dot && <span className="size-1.5 rounded-full" style={{ background: f.dot }} />}
              {filterLabel(f.key)}
              <span
                className={`rounded-[4px] px-1 text-[10.5px] tabular-nums
                  ${active ? "bg-field text-ink-2" : "text-ink-3"}`}
              >
                {countOf(f.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* table */}
      <div
        aria-label={labels.tableLabel ?? "Scrollable task table"}
        className="overflow-x-auto rounded-card bg-surface shadow-card"
        role="region"
        tabIndex={0}
        style={{ scrollbarWidth: "none" }}
      >
        <div className="min-w-[420px]">
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.6fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] border-b border-[var(--grid-line)] text-[12.5px] font-medium text-ink-2">
            <span className="border-r border-[var(--grid-line)] px-3 py-2">{labels.columns.task}</span>
            <span className="border-r border-[var(--grid-line)] px-3 py-2">{labels.columns.date}</span>
            <span className="border-r border-[var(--grid-line)] px-3 py-2">{labels.columns.status}</span>
            <span className="px-3 py-2">{labels.columns.owner}</span>
          </div>
          {rows.map((row) => {
            const shown = visibleIds.has(row.id ?? row.task);
            const pill = PILLS[row.status];
            return (
              <div
                key={row.id ?? row.task}
                className="grid transition-[grid-template-rows,opacity] duration-300"
                style={{
                  gridTemplateRows: shown ? "1fr" : "0fr",
                  opacity: shown ? 1 : 0,
                  transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                <div className="overflow-hidden">
                  <div
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => { if (e.key === "Enter") onRowClick(row); } : undefined}
                    role={onRowClick ? "link" : undefined}
                    tabIndex={onRowClick && shown ? 0 : undefined}
                    className={`grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.6fr)_minmax(0,0.95fr)_minmax(0,0.9fr)] border-b
                      border-[var(--grid-line)] text-[13px] transition-colors duration-100 hover:bg-hover ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    <span className="flex min-w-0 items-center border-r border-[var(--grid-line)] px-3 py-2">
                      <span className="truncate font-medium text-ink">{row.task}</span>
                    </span>
                    <span className="flex items-center whitespace-nowrap border-r border-[var(--grid-line)] px-3 py-2 text-ink-2 tabular-nums">
                      {row.date}
                    </span>
                    <span className="flex items-center border-r border-[var(--grid-line)] px-3 py-2">
                      <span
                        className={`inline-flex h-[23px] shrink-0 items-center whitespace-nowrap rounded-[8px] border px-[7px]
                          text-[13px] font-medium ${pill.cls}`}
                      >
                        {labels.statuses?.[row.status] ?? pill.label}
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center px-3 py-2 text-ink-2">
                      <span className="truncate">{row.owner}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {pageSize > 0 && filtered.length > pageSize && (
        <nav aria-label="Pagine" className="mt-2 flex items-center justify-end gap-1 text-[12.5px] text-ink-2 tabular-nums">
          <span className="mr-2">{current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} / {filtered.length}</span>
          {[-1, 1].map((d) => (
            <button key={d} type="button" disabled={d < 0 ? current === 0 : current >= pages - 1} onClick={() => setPage(current + d)}
              aria-label={d < 0 ? "Pagina precedente" : "Pagina successiva"} title={d < 0 ? "Pagina precedente" : "Pagina successiva"}
              className="flex size-7 items-center justify-center rounded-[7px] text-ink-2 hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-35">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={d < 0 ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} /></svg>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
