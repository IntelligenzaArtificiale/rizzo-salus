/*
 * Domanda a risposta multipla. Scelta singola: un clic seleziona e avanza da solo.
 * Scelta multipla: si selezionano più voci e si preme Continua.
 * Tastiera: i numeri 1-9 scelgono l'opzione corrispondente.
 * Stile dalle opzioni dell'Approval Card di Beautiful UI (GlideMenu + indicatore radio/check).
 */
import { useEffect, useRef, useState } from "react";
import GlideMenu from "@/components/primitives/GlideMenu";
import { PrimaryButton } from "@/components/form/PrimaryButton";
import type { ChoiceOption } from "@/config/registration-steps";

const AUTO_ADVANCE_MS = 260;

type ChoiceStepProps = {
  options: ChoiceOption[];
  multiple?: boolean;
  value: string | string[] | undefined;
  onDone: (value: string | string[]) => void;
};

export function ChoiceStep({ options, multiple = false, value, onDone }: ChoiceStepProps) {
  const [picked, setPicked] = useState<string[]>(Array.isArray(value) ? value : value ? [value] : []);
  const advancing = useRef(false);

  function choose(option: string) {
    if (advancing.current) return;
    if (multiple) {
      setPicked((p) => (p.includes(option) ? p.filter((v) => v !== option) : [...p, option]));
      return;
    }
    setPicked([option]);
    advancing.current = true;
    setTimeout(() => onDone(option), AUTO_ADVANCE_MS);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if ((event.target as HTMLElement).tagName === "INPUT") return;
      const n = Number(event.key);
      if (n >= 1 && n <= options.length) choose(options[n - 1].value);
      if (event.key === "Enter" && multiple && picked.length > 0) onDone(picked);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col gap-6">
      <GlideMenu className="flex flex-col gap-2" highlightClassName="inset-x-0 rounded-control bg-hover">
        {options.map((option, i) => {
          const on = picked.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              data-menu-row
              aria-pressed={on}
              autoFocus={i === 0}
              onClick={() => choose(option.value)}
              className={`relative z-10 flex items-center gap-3 rounded-control border px-3.5 py-3 text-left transition-[border-color,box-shadow] duration-150
                ${on ? "border-accent ring-[3px] ring-accent-tint" : "border-line-strong"}`}
            >
              <span
                className={`flex size-[18px] shrink-0 items-center justify-center transition-colors duration-200
                  ${multiple ? "rounded-[5px]" : "rounded-full"}
                  ${on ? "bg-ink text-canvas" : "shadow-[inset_0_0_0_1.5px_var(--line-strong)] text-transparent"}`}
              >
                {multiple ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : (
                  <span className="size-1.5 rounded-full bg-canvas transition-transform duration-200" style={{ transform: on ? "scale(1)" : "scale(0)" }} />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[14px] font-medium text-ink">{option.label}</span>
                {option.description && <span className="text-[12.5px] text-ink-2">{option.description}</span>}
              </span>
              <kbd className="hidden size-5 shrink-0 items-center justify-center rounded-[5px] bg-inset font-sans text-[11px] text-ink-3 shadow-hairline sm:flex">
                {i + 1}
              </kbd>
            </button>
          );
        })}
      </GlideMenu>
      {multiple && (
        <PrimaryButton type="button" onClick={() => onDone(picked)} disabled={picked.length === 0} busyLabel="">
          Continua
        </PrimaryButton>
      )}
    </div>
  );
}
