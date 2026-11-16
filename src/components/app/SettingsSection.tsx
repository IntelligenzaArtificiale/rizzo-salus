/*
 * Impaginazione delle impostazioni: ogni sezione ha titolo e descrizione a sinistra e i controlli
 * a destra (una colonna su mobile). Tutte le schede usano la stessa griglia, quindi i campi sono
 * allineati fra loro e occupano la larghezza della pagina.
 * SaveBar: barra fissa in basso che compare solo con modifiche da salvare (Annulla modifiche / Salva).
 */
import type { ReactNode } from "react";
import { Button } from "@/components/atoms/Button";

export function SettingsSection({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-x-10 gap-y-4 border-t border-line py-7 first:border-t-0 first:pt-2 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <header className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && (
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            {description}
          </p>
        )}
        {aside}
      </header>
      <div className="flex min-w-0 flex-col">{children}</div>
    </section>
  );
}

export function SaveBar({
  dirty,
  busy,
  onReset,
  label = "Salva",
  disabled = false,
}: {
  dirty: boolean;
  busy: boolean;
  onReset: () => void;
  label?: string;
  disabled?: boolean;
}) {
  if (!dirty && !busy) return null;
  return (
    <div
      className="anim-rise sticky bottom-0 z-20 -mx-4 mt-2 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8"
      role="region"
      aria-label="Modifiche da salvare"
    >
      <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">
        Modifiche non salvate
      </span>
      <Button
        type="button"
        variant="secondary"
        onClick={onReset}
        disabled={busy}
        className="h-9"
      >
        Annulla modifiche
      </Button>
      <Button
        type="submit"
        variant="primary"
        disabled={busy || disabled}
        aria-busy={busy}
        className="h-9 min-w-24 gap-2"
      >
        {busy && (
          <span
            aria-hidden
            className="size-3.5 rounded-full border-2 border-current/30 border-t-current anim-spin"
          />
        )}
        {busy ? "Salvataggio" : label}
      </Button>
    </div>
  );
}
