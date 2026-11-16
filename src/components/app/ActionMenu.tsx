/*
 * Menu «⋯» di una riga (conversazione, file, elemento di un elenco): poche azioni secondarie.
 * - Il bottone è sempre nel DOM: si raggiunge con Tab, compare su hover, focus, riga attiva
 *   e sempre sui dispositivi touch. Nessuna azione dipende dall'hover.
 * - Tastiera: Invio/Spazio/Freccia giù apre e porta sulla prima voce, frecce e Home/Fine
 *   scorrono, Esc chiude e torna al bottone, Tab chiude.
 * - Le azioni distruttive si confermano fuori dal menu (ConfirmDialog nella pagina).
 * Contratto e usi: docs/assistente-cronologia.md, docs/mapping.md («Azioni di riga»).
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import GlideMenu from "@/components/primitives/GlideMenu";
import { cn } from "@/lib/utils";

export type MenuAction = { label: string; icon?: ReactNode; danger?: boolean; onSelect: () => void };

type Props = { label: string; actions: MenuAction[]; visible?: boolean; className?: string };

export function ActionMenu({ label, actions, visible = false, className }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const items = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
  const close = (refocus = true) => { setOpen(false); if (refocus) trigger.current?.focus(); };

  function openMenu() {
    const r = trigger.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 200) });
    setOpen(true);
  }

  useLayoutEffect(() => { if (open) items()[0]?.focus(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !trigger.current?.contains(t)) close(false);
    };
    const onScroll = () => close(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onScroll);
    return () => { document.removeEventListener("pointerdown", onDown); window.removeEventListener("resize", onScroll); };
  }, [open]);

  function onMenuKey(e: KeyboardEvent) {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => { e.preventDefault(); list[(n + list.length) % list.length]?.focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close(false);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); if (open) close(); else openMenu(); }}
        onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); openMenu(); } }}
        className={cn(
          "row-action motion-state flex size-7 items-center justify-center rounded-[7px] text-ink-3 hover:bg-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-accent",
          visible && "row-action-visible",
          className,
        )}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && createPortal(
        <div ref={menu} role="menu" aria-label={label} onKeyDown={onMenuKey} className="anim-pop fixed z-50 w-48 rounded-[12px] bg-surface p-1 shadow-overlay" style={{ top: pos.top, left: pos.left }}>
          <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[8px] bg-hover">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                data-menu-row
                onClick={() => { close(false); a.onSelect(); }}
                className={cn("relative z-10 flex h-9 w-full items-center gap-2 rounded-[8px] px-2.5 text-left text-[13.5px] font-medium outline-none focus-visible:bg-hover", a.danger ? "text-red" : "text-ink")}
              >
                {a.icon && <span className="flex shrink-0">{a.icon}</span>}
                {a.label}
              </button>
            ))}
          </GlideMenu>
        </div>,
        document.body,
      )}
    </>
  );
}
