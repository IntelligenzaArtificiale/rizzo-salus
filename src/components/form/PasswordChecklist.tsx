/* Requisiti della nuova password, spuntati mentre si scrive: l'utente vede cosa manca prima di sbagliare. */
import { Check } from "lucide-react";
import { PASSWORD_MIN } from "@/lib/validation";

export function PasswordChecklist({ value }: { value: string }) {
  const items = [
    { ok: value.length >= PASSWORD_MIN, label: `Almeno ${PASSWORD_MIN} caratteri` },
    { ok: /[A-Za-z]/.test(value), label: "Una lettera" },
    { ok: /\d/.test(value), label: "Un numero" },
  ];
  return (
    <ul className="-mt-1 mb-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Requisiti della password">
      {items.map((item) => (
        <li key={item.label} className={`flex items-center gap-1.5 text-[12.5px] transition-colors duration-150 ${item.ok ? "text-green" : "text-ink-3"}`}>
          <span className={`flex size-3.5 items-center justify-center rounded-full transition-colors duration-150 ${item.ok ? "bg-green text-white" : "shadow-[inset_0_0_0_1.5px_var(--line-strong)]"}`}>
            {item.ok && <Check size={9} strokeWidth={3.5} />}
          </span>
          {item.label}
          <span className="sr-only">{item.ok ? " — fatto" : " — mancante"}</span>
        </li>
      ))}
    </ul>
  );
}
