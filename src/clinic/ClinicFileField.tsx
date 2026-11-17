// Upload condiviso: selezione, trascinamento e limite coerente con il server.
import { useId, useRef, useState } from "react";
import { UploadCloud, FileCheck2, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { fieldLabel } from "@/components/form/fieldStyles";
import type { Data } from "./api";
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;
export function ClinicFileField({ onChange, onFile, accept = ".pdf,.png,.jpg,.jpeg,.csv,.xml,.xlsx", label = "Allegato", disabled = false }: {
  onChange?: (data: Data) => void; onFile?: (file: File) => Promise<void>;
  accept?: string; label?: string; disabled?: boolean;
}) {
  const id = useId(), input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [over, setOver] = useState(false);
  const select = async (f?: File) => {
    if (!f || busy || disabled) return;
    setError("");
    if (f.size > MAX_ATTACHMENT_BYTES) { setError("Questo file supera 50 MB. Scegli un documento più piccolo."); return; }
    if (!accept.split(",").some(ext => f.name.toLowerCase().endsWith(ext.trim().toLowerCase()))) { setError("Scegli un documento nel formato richiesto."); return; }
    setBusy(true);
    try {
      if (onFile) await onFile(f);
      else onChange?.({ nome_file: f.name, mime: f.type || (/\.xml$/i.test(f.name) ? "application/xml" : "text/csv"), base64: await fileBase64(f) });
      setFile(f);
    } catch (e) { setError(e instanceof Error ? e.message : "Non riesco a leggere questo documento."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  return <div className="flex flex-col gap-2 pb-3">
    <label className={fieldLabel} htmlFor={id}>{label}</label>
    <input ref={input} id={id} type="file" accept={accept} className="sr-only" disabled={disabled || busy} onChange={e => void select(e.target.files?.[0])} />
    <div className={`clinic-upload ${over ? "clinic-upload-over" : ""}`} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); void select(e.dataTransfer.files[0]); }}>
      {file ? <FileCheck2 size={24} className="shrink-0 text-ink-2" /> : <UploadCloud size={24} className="shrink-0 text-ink-2" />}
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink" aria-live="polite">{busy ? "Lettura del documento…" : file?.name || "Trascina qui il documento"}</p><p className="text-xs text-ink-2">{file ? `${(file.size / 1024 / 1024).toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB · Pronto` : "oppure sceglilo dal tuo dispositivo"}</p></div>
      <Button type="button" variant="secondary" size="sm" disabled={disabled || busy} onClick={() => input.current?.click()}>{file ? "Sostituisci" : "Scegli file"}</Button>
      {file && onChange && <Button type="button" variant="quiet" size="sm" aria-label="Rimuovi allegato" disabled={busy || disabled} onClick={() => { setFile(null); onChange({}); }}><X size={16} /></Button>}
    </div>
    {error && <p role="alert" className="text-sm text-red">{error}</p>}
  </div>;
}
export function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("Non riesco a leggere il file. Riprova.")); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); });
}
