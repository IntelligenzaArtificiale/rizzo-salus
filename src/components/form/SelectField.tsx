/*
 * Scelta da elenco con etichetta sopra, stesso box dei campi di testo. Select nativa: tastiera e mobile corretti.
 * compact: senza etichetta visibile e senza spazio per il messaggio, per barre di filtri (TableToolbar);
 * l'etichetta resta come nome accessibile. Per scegliere fra 2-4 voci brevi preferire SegmentedControl.
 */
import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldBox, fieldLabel } from "@/components/form/fieldStyles";

type SelectFieldProps = {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void;
  placeholder?: string; compact?: boolean; className?: string;
};

export function SelectField({ label, value, options, onChange, placeholder, compact = false, className }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", !compact && "pb-[18px]", className)}>
      <label htmlFor={id} className={compact ? "sr-only" : fieldLabel}>{label}</label>
      <div className={cn(fieldBox, "relative px-0", compact && "h-9")}>
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-full w-full appearance-none bg-transparent pr-9 pl-3 text-[14px] text-ink outline-none">
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 text-ink-3" />
      </div>
    </div>
  );
}
