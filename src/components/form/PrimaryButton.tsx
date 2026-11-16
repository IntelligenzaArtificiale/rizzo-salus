/*
 * Bottone d'invio dei form: Button di Beautiful UI, variante accent, a tutta larghezza.
 * Disattivo finché il form non è valido; durante l'invio mostra cosa sta succedendo.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

type PrimaryButtonProps = {
  children: ReactNode;
  busyLabel: string;
  busy?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  className?: string;
};

export function PrimaryButton({ children, busyLabel, busy = false, disabled = false, type = "submit", onClick, className }: PrimaryButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      variant="accent"
      disabled={disabled || busy}
      aria-busy={busy}
      className={cn("h-10 w-full rounded-[8px] text-[14px] font-semibold hover:bg-accent hover:brightness-110 aria-busy:opacity-100", className)}
    >
      {busy ? (
        <span className="flex items-center gap-2">
          <span className="size-3.5 rounded-full border-2 border-white/40 border-t-white anim-spin" />
          {busyLabel}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}

/** Link con l'aspetto di PrimaryButton, per azioni che portano a un'altra pagina. */
export function PrimaryLink({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className={cn(buttonVariants({ variant: "accent" }), "h-10 w-full rounded-[8px] text-[14px] font-semibold hover:bg-accent hover:brightness-110")}>
      {children}
    </Link>
  );
}
