/*
 * Checkbox con etichetta. Riusa 1:1 le classi della checkbox delle Records Table
 * di Beautiful UI (records-checkbox, chiaro e scuro in records-table.css).
 */
import { Check } from "lucide-react";

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-[13.5px] text-ink">
      <span className="records-checkbox -ml-[3px]">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`records-checkbox-box ${checked ? "is-active" : ""}`}>
          {checked && <Check size={12} strokeWidth={2.5} />}
        </span>
      </span>
      {label}
    </label>
  );
}
