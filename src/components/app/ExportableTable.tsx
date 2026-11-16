/*
 * FilterTable di Beautiful UI con il comando Esporta nella sua barra.
 * L'export riceve le righe filtrate (prima della paginazione) dallo slot renderExport del vendor.
 * La pagina decide nome del file, intestazioni e valori: mai chiavi interne nelle colonne.
 */
import type { ComponentProps } from "react";
import FilterTable, { type TableRow } from "@/components/primitives/FilterTable";
import { ExportExcelButton } from "@/components/app/ExportExcelButton";

export type ExportSpec = { filename: string; headers: string[]; row: (row: TableRow) => (string | number)[] };

export default function ExportableTable({ exportAs, ...props }: ComponentProps<typeof FilterTable> & { exportAs?: ExportSpec }) {
  if (!exportAs) return <FilterTable {...props} />;
  return <FilterTable {...props} renderExport={(rows) => <ExportExcelButton filename={exportAs.filename} headers={exportAs.headers} rows={rows.map(exportAs.row)} />} />;
}
