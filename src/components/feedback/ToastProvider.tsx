/*
 * Toast in basso a destra, impilati senza spostare quelli già visibili.
 * Superficie, ombra e animazione sono quelle delle card sospese di Beautiful UI
 * (rounded-card, shadow-overlay, keyframe pop-in). Gli errori restano finché
 * l'utente li chiude; gli altri si chiudono da soli dopo 6 secondi.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { SmartLink } from "@/components/navigation/SmartLink";
import { ToastContext, type ToastInput, type ToastTone } from "@/components/feedback/toast-context";

type ToastItem = ToastInput & { id: number };

const ICONS: Record<ToastTone, ReactNode> = {
  error: <CircleAlert size={18} className="text-red" />,
  warning: <TriangleAlert size={18} className="text-orange" />,
  success: <CircleCheck size={18} className="text-green" />,
  info: <Info size={18} className="text-accent" />,
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (toast: ToastInput) => {
      const id = nextId++;
      setItems((all) => [...all.slice(-2), { ...toast, id }]);
      if (toast.tone !== "error") setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-[360px] gap-3 rounded-card bg-surface p-3.5 shadow-overlay anim-pop"
          >
            <span className="mt-px shrink-0">{ICONS[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[13px] leading-[1.45] text-ink-2">{t.body}</p>}
              {t.action && (
                <SmartLink href={t.action.href} className="mt-2 inline-block text-[13px] font-medium text-accent-ink hover:underline">
                  {t.action.label}
                </SmartLink>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Chiudi"
              className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-[7px] text-ink-3 hover:bg-hover hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
