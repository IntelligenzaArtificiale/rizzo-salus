/*
 * Esito dentro la card: titolo, una frase, azioni. Niente icone decorative:
 * il titolo dice già cosa è successo (regola "meno testo, niente decorazioni").
 */
import type { ReactNode } from "react";

type StatusPanelProps = {
  /** tono del titolo: neutro di default, rosso per i problemi */
  kind?: "neutral" | "success" | "error" | "email";
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
};

export function StatusPanel({ kind = "neutral", title, children, actions }: StatusPanelProps) {
  return (
    <div className="anim-rise flex flex-col items-start">
      <h1 className={`text-[22px] font-medium tracking-[-0.02em] ${kind === "error" ? "text-red" : "text-ink"}`}>{title}</h1>
      {children && <div className="mt-2 text-[14px] leading-[1.55] text-ink-2">{children}</div>}
      {actions && <div className="mt-7 flex w-full flex-col gap-3">{actions}</div>}
    </div>
  );
}
