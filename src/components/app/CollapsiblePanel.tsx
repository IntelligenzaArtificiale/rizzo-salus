import { useId, useState, type ReactNode } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

/** Disclosure applicativo: comando esplicito, tastiera e contenuto mantenuto al cambio stato. */
export function CollapsiblePanel({ title, description, children, defaultOpen = false, className }: {
  title: ReactNode; description?: string; children: ReactNode; defaultOpen?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-card border border-line bg-surface", className)} data-collapsible>
      <Button type="button" variant="quiet" aria-expanded={open} aria-controls={id} id={`${id}-title`}
        onClick={() => setOpen(!open)} className="w-full justify-between gap-3 rounded-none px-4 py-3.5 text-left active:scale-100 sm:px-5">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-inset" aria-hidden="true">
            {open ? <Minus size={16} /> : <Plus size={16} />}
          </span>
          <span className="min-w-0"><span className="block text-sm font-medium text-ink">{title}</span>
            {description && <span className="mt-0.5 block text-xs font-normal text-ink-2">{description}</span>}
          </span>
        </span>
        <span className="shrink-0 text-xs font-normal text-ink-2">{open ? "Nascondi" : "Mostra"}</span>
      </Button>
      <div id={id} role="region" aria-labelledby={`${id}-title`} hidden={!open} onInvalidCapture={() => setOpen(true)}>
        <div className="flex min-w-0 flex-col gap-4 px-4 pb-4 pt-1 sm:px-5">{children}</div>
      </div>
    </section>
  );
}
