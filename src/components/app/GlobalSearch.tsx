/** Comando di ricerca delle dashboard: riusa SearchList, caricamento pigro e accesso da tastiera. */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import SearchList from "@/components/primitives/SearchList";
import { listRequests, type RequestItem } from "@/api/requests";

export type SearchTarget = { label: string; to: string };

export function GlobalSearch({ pages }: { pages: SearchTarget[] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [attempt, setAttempt] = useState(0);
  const [shortcut, setShortcut] = useState("Ctrl K");
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
    const onKey = (e: globalThis.KeyboardEvent) => {
      const editing = e.target instanceof HTMLElement && Boolean(e.target.closest("input, textarea, [contenteditable='true']"));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !editing) {
        e.preventDefault(); setOpen((value) => !value);
      }
      if (e.key === "Escape" && box.current?.contains(document.activeElement)) {
        setOpen(false); trigger.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setStatus("loading");
    listRequests().then((result) => {
      if (!active) return;
      if (result.ok) { setRequests(result.data); setStatus("ready"); }
      else setStatus("error");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [open, attempt]);

  const targets = useMemo<SearchTarget[]>(
    () => [...pages, ...requests.map((r) => ({ label: `${r.id} · ${r.titolo}`, to: `/richieste/${r.id}` }))],
    [pages, requests],
  );

  const moveFocus = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const controls = Array.from(box.current?.querySelectorAll<HTMLElement>("input, [data-menu-row]") ?? []);
    if (!controls.length) return;
    e.preventDefault();
    const index = controls.indexOf(document.activeElement as HTMLElement);
    controls[(index + (e.key === "ArrowDown" ? 1 : -1) + controls.length) % controls.length]?.focus();
  };

  return (
    <div ref={box} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button ref={trigger} type="button" onClick={() => setOpen((value) => !value)}
        aria-label="Cerca nella piattaforma" aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? "platform-search" : undefined}
        className="flex h-8 items-center gap-2 rounded-control px-2.5 text-[12.5px] text-ink-2 hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent">
        <Search size={15} aria-hidden="true" />
        <span>Cerca</span>
        <kbd className="hidden rounded border border-line px-1 font-sans text-[10px] leading-4 text-ink-3 sm:block">{shortcut}</kbd>
      </button>
      {open && (
        <div id="platform-search" role="dialog" aria-label="Cerca pagine e richieste"
          onKeyDown={moveFocus} className="absolute right-0 top-10 z-40 w-[min(360px,calc(100vw-32px))]">
          <div className="mb-1 flex items-center justify-between px-1 text-[11px] text-ink-3">
            <span>Pagine e richieste</span>
            <button type="button" onClick={close} aria-label="Chiudi ricerca" className="flex size-7 items-center justify-center rounded-control bg-surface hover:bg-hover"><X size={14} /></button>
          </div>
          <SearchList autoFocus items={targets.map((t) => t.label)}
            labels={{ placeholder: "Nome pagina o richiesta…", ariaLabel: "Cerca pagine e richieste", emptyTitle: "Nessun risultato", emptyHint: "Prova con un'altra parola", clear: "Svuota" }}
            onPick={(label) => {
              const target = targets.find((t) => t.label === label);
              setOpen(false);
              if (target) navigate(target.to);
            }} />
          {status === "loading" && <p role="status" className="mt-1 rounded-control bg-surface p-2 text-[12px] text-ink-3">Cerco anche nelle richieste…</p>}
          {status === "error" && <div role="status" className="mt-1 rounded-control bg-surface p-2 text-[12px] text-ink-2">Richieste non disponibili. Le pagine restano ricercabili. <button type="button" className="underline" onClick={() => setAttempt((value) => value + 1)}>Riprova</button></div>}
        </div>
      )}
    </div>
  );
}
