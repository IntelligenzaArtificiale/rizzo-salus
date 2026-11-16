/* Preferenza on/off: titolo, una riga di descrizione, Switch di Beautiful UI a destra. Si salva da sola. */
import { Switch } from "@/components/atoms/Switch";

export function SwitchRow({ title, description, checked, onChange }: { title: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="density-row flex items-center gap-4 border-b border-line py-3.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
