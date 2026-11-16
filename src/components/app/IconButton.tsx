/* Bottone solo icona, con nome accessibile e tooltip. Stile "secondary" del Button di Beautiful UI. */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

type IconButtonProps = { label: string; icon: ReactNode; onClick?: () => void; to?: string; tone?: "default" | "danger" };

const shape = "size-9 rounded-full p-0";

export function IconButton({ label, icon, onClick, to, tone = "default" }: IconButtonProps) {
  const toneClass = tone === "danger" ? "text-red hover:text-red" : "";
  if (to) {
    return (
      <Link to={to} aria-label={label} title={label} className={cn(buttonVariants({ variant: "secondary" }), shape, toneClass)}>
        {icon}
      </Link>
    );
  }
  return (
    <Button type="button" variant="secondary" aria-label={label} title={label} onClick={onClick} className={cn(shape, toneClass)}>
      {icon}
    </Button>
  );
}

/** Azione principale della pagina: icona + verbo breve, Button primario di Beautiful UI. */
export function PrimaryAction({ label, icon, to, onClick }: { label: string; icon: ReactNode; to?: string; onClick?: () => void }) {
  const cls = cn(buttonVariants({ variant: "primary" }), "h-9 gap-1.5 px-3.5");
  if (to) return <Link to={to} className={cls}>{icon}{label}</Link>;
  return <Button type="button" variant="primary" onClick={onClick} className="h-9 gap-1.5 px-3.5">{icon}{label}</Button>;
}
