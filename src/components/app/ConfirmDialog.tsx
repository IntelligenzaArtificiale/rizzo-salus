/*
 * Unica modal ammessa (regole UX): conferma di un'azione irreversibile.
 * <dialog> nativo: focus intrappolato, Esc chiude. Superficie e ombra di Beautiful UI.
 * confirmText: se presente, l'utente deve riscriverlo per abilitare il bottone.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children?: ReactNode;
  actionLabel: string;
  confirmText?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ open, title, children, actionLabel, confirmText, busy = false, onConfirm, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setTyped("");
  }, [open]);

  const ready = !confirmText || typed.trim() === confirmText;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="fixed inset-0 m-auto h-fit w-[min(420px,calc(100%-32px))] rounded-window bg-surface p-0 text-ink shadow-overlay backdrop:bg-black/40"
    >
      <form method="dialog" onSubmit={(e) => { e.preventDefault(); if (ready && !busy) onConfirm(); }} className="flex flex-col gap-4 p-6">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
        {children && <div className="text-[14px] leading-[1.55] text-ink-2">{children}</div>}
        {confirmText && (
          <TextField label={`Scrivi ${confirmText} per confermare`} value={typed} onChange={setTyped} autoFocus autoComplete="off" />
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit" variant="primary" disabled={!ready || busy} className="bg-red text-white hover:opacity-90">
            {busy ? "Attendi" : actionLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
