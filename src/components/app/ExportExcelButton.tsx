/** Esporta solo i dati forniti dalla vista: XLSX reale, celle testo mai interpretate come formule. */
import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/components/feedback/toast-context";

export type ExcelValue = string | number | boolean | null;
export function ExportExcelButton({ headers, rows, filename }: { headers: string[]; rows: ExcelValue[][]; filename: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function download() {
    if (busy || !rows.length) return;
    setBusy(true);
    try {
      const { default: writeExcelFile } = await import("write-excel-file/browser");
      await writeExcelFile([headers, ...rows], { sheet: "Dati" }).toFile(`${filename}.xlsx`);
    } catch {
      toast.show({ tone: "error", title: "Esportazione non riuscita", body: "Riprova tra un momento." });
    } finally { setBusy(false); }
  }
  return <button type="button" disabled={busy || !rows.length} onClick={download}
    title={`${rows.length} righe caricate e filtrate, tutte le pagine. Non include dati non caricati.`}
    className="inline-flex min-h-9 items-center gap-2 self-end rounded-control border border-line px-3 text-[12.5px] text-ink-2 hover:bg-hover disabled:opacity-50">
    <Download size={14} aria-hidden="true" />{busy ? "Esportazione…" : "Esporta Excel"}
  </button>;
}
