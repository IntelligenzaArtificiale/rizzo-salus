/*
 * Elenco di righe cliccabili con l'evidenza scorrevole del GlideMenu di Beautiful UI.
 * Riga: segno a sinistra (es. non letta), titolo, riga secondaria, stato (StatusPill), valore a destra.
 * Per elenchi che portano a un dettaglio: notifiche, attività, conversazioni, risultati brevi.
 * Per dati da confrontare, filtrare o esportare usare FilterTable/RecordsTable (docs/mapping.md).
 * L'aside è un'informazione utile alla riga (ora relativa, importo, quantità), non una data qualsiasi.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import GlideMenu from "@/components/primitives/GlideMenu";
import { StatusPill } from "@/components/atoms/StatusPill";
import { usePagination } from "@/components/app/Pagination";
import type { StatusInfo } from "@/lib/status";

export type RowItem = {
  key: string;
  to?: string;
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
  mark?: ReactNode;
  /** stato della riga, già tradotto con statusOf() */
  status?: StatusInfo;
  onOpen?: () => void;
  /** Azioni di riga esterne al link: nessun controllo interattivo annidato. */
  actions?: ReactNode;
};

type Props = {
  rows: RowItem[];
  resetKey?: unknown;
  /** false quando la pagina è già tagliata dal backend: usare <Pagination> sotto l'elenco */
  paginate?: boolean;
  /** titolo e riga secondaria su più righe invece che troncati (testi lunghi, mobile) */
  wrap?: boolean;
};

export function RowList({
  rows,
  resetKey,
  paginate = true,
  wrap = false,
}: Props) {
  const { pageItems, pager } = usePagination(
    rows,
    paginate ? undefined : Math.max(rows.length, 1),
    resetKey ?? rows.length,
  );
  const clamp = wrap ? "line-clamp-2" : "truncate";
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-card bg-surface p-1 shadow-card">
        <GlideMenu
          className="flex flex-col gap-px"
          highlightClassName="inset-x-0 rounded-[8px] bg-hover"
        >
          {pageItems.map((row) => (
            <div
              key={row.key}
              data-menu-row
              data-row
              className="relative z-10 flex min-w-0 flex-wrap items-center sm:flex-nowrap"
            >
              <RowTarget
                row={row}
                className="density-row relative z-10 flex min-w-0 basis-full sm:basis-auto flex-1 min-h-14 items-center gap-3 rounded-[8px] px-3 py-2.5 outline-offset-[-2px]"
              >
                {row.mark && (
                  <span className="flex w-2 shrink-0 justify-center">
                    {row.mark}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={`${clamp} text-[14px] font-medium text-ink`}>
                    {row.title}
                  </span>
                  {row.meta && (
                    <span className={`${clamp} text-[12.5px] text-ink-2`}>
                      {row.meta}
                    </span>
                  )}
                </span>
                {row.status && (
                  <StatusPill tone={row.status.tone} className="shrink-0">
                    {row.status.label}
                  </StatusPill>
                )}
                {row.aside && (
                  <span
                    className={`${row.status ? "hidden sm:block" : ""} shrink-0 text-[12.5px] whitespace-nowrap text-ink-3 tabular-nums`}
                  >
                    {row.aside}
                  </span>
                )}
              </RowTarget>
              {row.actions && (
                <div className="max-w-full px-3 pb-3 sm:shrink-0 sm:pr-2 sm:pb-0">
                  {row.actions}
                </div>
              )}
            </div>
          ))}
        </GlideMenu>
      </div>
      {paginate && pager}
    </div>
  );
}

function RowTarget({
  row,
  className,
  children,
}: {
  row: RowItem;
  className: string;
  children: ReactNode;
}) {
  return row.to ? (
    <Link to={row.to} onClick={row.onOpen} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}
