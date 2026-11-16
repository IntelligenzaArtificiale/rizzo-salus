/*
 * Campo di testo con etichetta sopra, aiuto sotto e messaggio d'errore al posto dell'aiuto.
 * Quando mostrare l'errore lo decide useFormFields (lib/forms): qui solo presentazione.
 * Non gestisce la logica del form: riceve valore, errore e callback dal genitore.
 */
import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";
import { fieldBox, fieldBoxInvalid, fieldInput, fieldLabel, fieldMessage } from "@/components/form/fieldStyles";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: ReactNode;
  hint?: ReactNode;
  /** contenuto a destra dell'etichetta, es. link "Password dimenticata?" */
  labelAside?: ReactNode;
  /** contenuto a destra dentro il campo, es. il bottone occhio */
  trailing?: ReactNode;
  /** unità di misura o valuta dentro il campo, es. "sacchi", "€", "kg" */
  suffix?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({ label, value, onChange, error, hint, labelAside, trailing, suffix, inputRef, className, ...input }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div className={cn("flex flex-col gap-1.5 pb-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className={fieldLabel}>{label}</label>
        {labelAside}
      </div>
      <div className={cn(fieldBox, error && fieldBoxInvalid)}>
        <input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          aria-label={suffix ? `${label} (${suffix})` : undefined}
          className={fieldInput}
          {...input}
        />
        {suffix && <span aria-hidden className="shrink-0 pr-3 text-[14px] text-ink-3">{suffix}</span>}
        {trailing}
      </div>
      <p id={messageId} className={cn(fieldMessage, error ? "text-red" : "text-ink-3")} aria-live="polite">
        {error ?? hint ?? ""}
      </p>
    </div>
  );
}
