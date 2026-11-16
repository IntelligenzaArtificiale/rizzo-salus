/*
 * Rinomina sul posto: il campo prende il posto del testo, già selezionato.
 * Invio o clic fuori salvano, Esc annulla. Vuoto o invariato: nessuna chiamata.
 * Dopo la chiusura il focus torna dove l'aveva lasciato il chiamante (onDone).
 */
import { useEffect, useRef, useState } from "react";

type Props = { value: string; label: string; maxLength?: number; onSave: (value: string) => void; onDone: () => void };

export function InlineRename({ value, label, maxLength = 60, onSave, onDone }: Props) {
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const finished = useRef(false);

  useEffect(() => { ref.current?.select(); }, []);

  const finish = (save: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const clean = text.trim();
    if (save && clean && clean !== value) onSave(clean);
    onDone();
  };

  return (
    <input
      ref={ref}
      autoFocus
      aria-label={label}
      value={text}
      maxLength={maxLength}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); finish(true); }
        if (e.key === "Escape") { e.preventDefault(); finish(false); }
      }}
      className="h-8 w-full rounded-[8px] bg-surface px-2 text-[14px] font-medium text-ink shadow-[0_0_0_1.5px_var(--accent)] outline-none"
    />
  );
}
