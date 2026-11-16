/*
 * Piede dei form a pagina (creazione e modifica). Salvataggio attivo solo se il form è valido;
 * durante l'invio mostra «Salvataggio» e non accetta un secondo invio (useSubmit).
 * Annulla solo nelle pagine di creazione/modifica: torna alla pagina di provenienza
 * e, con modifiche in corso, passa dalla conferma di useUnsavedChanges.
 * Non usare nel login, nelle impostazioni a schede o dove non c'è nulla da annullare.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

type Props = {
  submitLabel: string;
  busy: boolean;
  disabled?: boolean;
  cancelTo?: string;
  busyLabel?: string;
  onAction?: () => void;
  leading?: ReactNode;
};

export function FormActions({
  cancelTo,
  submitLabel,
  busy,
  disabled = false,
  busyLabel = "Salvataggio",
  onAction,
  leading,
}: Props) {
  return (
    <div className="flex justify-end gap-2 border-t border-line pt-5">
      {leading && <div className="mr-auto">{leading}</div>}
      {cancelTo && (
        <Link
          to={cancelTo}
          className={cn(buttonVariants({ variant: "secondary" }), "h-9")}
        >
          Annulla
        </Link>
      )}
      <Button
        type={onAction ? "button" : "submit"}
        onClick={onAction ? event=>{
          // Il passaggio successivo può trasformare questo bottone in submit nello stesso click.
          event.preventDefault();
          onAction();
        } : undefined}
        variant="primary"
        disabled={disabled || busy}
        aria-busy={busy}
        className="h-9 min-w-24 gap-2"
      >
        {busy && (
          <span
            aria-hidden
            className="size-3.5 rounded-full border-2 border-current/30 border-t-current anim-spin"
          />
        )}
        {busy ? busyLabel : submitLabel}
      </Button>
    </div>
  );
}
