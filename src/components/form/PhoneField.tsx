/*
 * Telefono con prefisso internazionale nello stesso campo: il prefisso è una scelta,
 * il numero accetta solo cifre e spazi. Le regole di lunghezza sono in lib/validation.
 */
import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { PHONE_PREFIXES } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { fieldBox, fieldBoxInvalid, fieldInput, fieldLabel, fieldMessage } from "@/components/form/fieldStyles";

type PhoneFieldProps = {
  label: string;
  prefix: string;
  onPrefixChange: (value: string) => void;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: ReactNode;
  hint?: ReactNode;
};

export function PhoneField({ label, prefix, onPrefixChange, value, onChange, onBlur, error, hint }: PhoneFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5 pb-4">
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      <div className={cn(fieldBox, "pl-0", error && fieldBoxInvalid)}>
        <span className="relative flex h-full shrink-0 items-center border-r border-line">
          <select
            value={prefix}
            onChange={(e) => onPrefixChange(e.target.value)}
            aria-label="Prefisso internazionale"
            className="h-full appearance-none bg-transparent pr-7 pl-3 text-[14px] text-ink outline-none"
          >
            {PHONE_PREFIXES.map((p) => (
              <option key={p.code} value={p.code}>{p.code} {p.country}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2 text-ink-3" />
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d\s]/g, ""))}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-msg`}
          placeholder="333 123 4567"
          className={cn(fieldInput, "pl-1")}
        />
      </div>
      <p id={`${id}-msg`} className={cn(fieldMessage, error ? "text-red" : "text-ink-3")} aria-live="polite">
        {error ?? hint ?? ""}
      </p>
    </div>
  );
}
