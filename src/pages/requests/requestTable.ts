/* Adattamento delle richieste alla Filter Table di Beautiful UI: righe ed etichette italiane. */
import type { FilterTableLabels, TableRow } from "@/components/primitives/FilterTable";
import { STATUS_LABEL, type RequestItem } from "@/api/requests";
import { formatDate } from "@/lib/format";
import type { ExportSpec } from "@/components/app/ExportableTable";

export const REQUEST_TABLE_LABELS: FilterTableLabels = {
  columns: { task: "Richiesta", date: "Data", status: "Stato", owner: "Cliente" },
  all: "Tutte",
  statuses: STATUS_LABEL,
  tableLabel: "Richieste",
};

export const toRows = (items: RequestItem[]): TableRow[] =>
  items.map((r) => ({ id: r.id, task: r.titolo, date: formatDate(r.creata, true), status: r.stato, owner: r.cliente }));

/** Colonne dell'export Excel: codice leggibile della richiesta, nessun identificativo interno. */
export const REQUEST_EXPORT: ExportSpec = {
  filename: "richieste",
  headers: ["Codice", "Richiesta", "Data", "Stato", "Cliente"],
  row: (row) => [row.id ?? "", row.task, row.date, STATUS_LABEL[row.status], row.owner],
};
