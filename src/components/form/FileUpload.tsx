/*
 * Caricamento file: trascina o scegli, controllo di tipo e dimensione prima di inviare,
 * avanzamento per file, annulla, riprova, rimuovi. Usa uploadFile (a blocchi).
 * Stile: superfici e barre di Beautiful UI (bg-field, rounded-card, accent).
 */
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { FileUp, RotateCw, X } from "lucide-react";
import { uploadFile, type UploadResult } from "@/api/uploads";
import { fieldLabel, fieldMessage } from "@/components/form/fieldStyles";

type Item = { key: string; file: File; progress: number; state: "uploading" | "done" | "error"; error?: string; result?: UploadResult; abort: AbortController };

type FileUploadProps = {
  label: string;
  /** es. ".pdf,.jpg,.png" oppure "image/*" */
  accept: string;
  maxMb: number;
  multiple?: boolean;
  hint?: string;
  onChange?: (files: UploadResult[]) => void;
};

const sizeLabel = (bytes: number) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.ceil(bytes / 1024)} KB`);

function accepts(file: File, accept: string) {
  return accept.split(",").map((a) => a.trim().toLowerCase()).some((a) =>
    a.endsWith("/*") ? file.type.startsWith(a.slice(0, -1)) : a.startsWith(".") ? file.name.toLowerCase().endsWith(a) : file.type === a);
}

export function FileUpload({ label, accept, maxMb, multiple = false, hint, onChange }: FileUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const patch = (key: string, p: Partial<Item>) => setItems((all) => all.map((i) => (i.key === key ? { ...i, ...p } : i)));

  /* il genitore riceve i file completati dopo il render, mai durante l'aggiornamento dello stato */
  const notify = useRef(onChange);
  useEffect(() => { notify.current = onChange; }, [onChange]);
  const doneKeys = items.filter((i) => i.result).map((i) => i.key).join("|");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    notify.current?.(items.filter((i) => i.result).map((i) => i.result!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doneKeys]);

  function start(item: Item) {
    patch(item.key, { state: "uploading", progress: 0, error: undefined });
    uploadFile(item.file, (progress) => patch(item.key, { progress }), item.abort.signal)
      .then((result) => patch(item.key, { state: "done", progress: 1, result }))
      .catch((e: Error) => patch(item.key, { state: "error", error: e.message === "annullato" ? "Annullato." : "Caricamento non riuscito." }));
  }

  function add(list: FileList | null) {
    if (!list) return;
    setRejected(null);
    const files = Array.from(list).slice(0, multiple ? undefined : 1);
    const bad = files.find((f) => !accepts(f, accept) || f.size > maxMb * 1048576);
    if (bad) setRejected(!accepts(bad, accept) ? `${bad.name}: formato non accettato.` : `${bad.name} supera ${maxMb} MB.`);
    const good = files.filter((f) => accepts(f, accept) && f.size <= maxMb * 1048576)
      .map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, file, progress: 0, state: "uploading" as const, abort: new AbortController() }));
    setItems((all) => (multiple ? [...all, ...good] : good.length ? good : all));
    good.forEach(start);
  }

  const remove = (item: Item) => {
    item.abort.abort();
    setItems((all) => all.filter((i) => i.key !== item.key));
  };

  return (
    <div className="flex flex-col gap-1.5 pb-[18px]">
      <span className={fieldLabel} id={`${id}-l`}>{label}</span>
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={`${id}-l`}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={`flex cursor-pointer items-center gap-3 rounded-card border border-dashed px-4 py-4 text-[13.5px] transition-colors ${over ? "border-accent bg-accent-tint" : "border-line-strong bg-field hover:bg-hover"}`}
      >
        <FileUp size={18} className="shrink-0 text-ink-2" />
        <span className="text-ink-2"><span className="font-medium text-ink">Scegli un file</span> o trascinalo qui</span>
        <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {items.length > 0 && (
        <ul className="mt-1 flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-control border border-line px-3 py-2">
              {item.result?.url && item.file.type.startsWith("image/") && <img src={item.result.url} alt="" className="size-8 rounded-[6px] object-cover" />}
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex justify-between gap-2 text-[13px]"><span className="truncate text-ink">{item.file.name}</span><span className="shrink-0 text-ink-3 tabular-nums">{sizeLabel(item.file.size)}</span></span>
                {item.state === "uploading" && <span className="h-1 overflow-hidden rounded-full bg-field"><span className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.round(item.progress * 100)}%` }} /></span>}
                {item.state === "error" && <span className="text-[12.5px] text-red">{item.error}</span>}
              </span>
              {item.state === "error" && <button type="button" onClick={() => { item.abort = new AbortController(); start(item); }} aria-label="Riprova" title="Riprova" className="flex size-7 items-center justify-center rounded-[7px] text-ink-2 hover:bg-hover"><RotateCw size={14} /></button>}
              <button type="button" onClick={() => remove(item)} aria-label={item.state === "uploading" ? "Annulla" : "Rimuovi"} title={item.state === "uploading" ? "Annulla" : "Rimuovi"} className="flex size-7 items-center justify-center rounded-[7px] text-ink-3 hover:bg-hover hover:text-ink"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <p className={`${fieldMessage} ${rejected ? "text-red" : "text-ink-3"}`} aria-live="polite">{rejected ?? hint ?? `Massimo ${maxMb} MB.`}</p>
    </div>
  );
}
