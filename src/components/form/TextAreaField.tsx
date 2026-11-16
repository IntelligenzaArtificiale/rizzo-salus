/* Testo lungo con etichetta sopra, aiuto o errore sotto e conteggio dei caratteri quando c'è un limite. */
import { useId } from "react";
import { cn } from "@/lib/utils";
import { fieldLabel, fieldMessage } from "@/components/form/fieldStyles";

type TextAreaFieldProps = { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; error?: string | null; placeholder?: string; maxLength?: number; rows?: number; hint?: string };

export function TextAreaField({ label, value, onChange, onBlur, error, placeholder, maxLength, rows = 5, hint }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5 pb-4">
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-24 w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2.5 text-[14px] leading-[1.5] text-ink outline-none placeholder:text-ink-3",
          "focus:border-accent focus:ring-[3px] focus:ring-accent-tint",
          error && "border-red",
        )}
      />
      <p className={cn(fieldMessage, "flex justify-between gap-3", error ? "text-red" : "text-ink-3")}>
        <span>{error ?? hint ?? ""}</span>
        {maxLength && <span className="tabular-nums">{value.length}/{maxLength}</span>}
      </p>
    </div>
  );
}
