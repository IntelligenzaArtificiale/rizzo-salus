/* Consensi finali: quelli obbligatori tengono disattivo il bottone finché non sono spuntati. */
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/form/Checkbox";
import { PrimaryButton } from "@/components/form/PrimaryButton";
import type { RegistrationValues, StepDef } from "@/config/registration-steps";

type Consents = Extract<StepDef, { kind: "consents" }>["consents"];

type ConsentStepProps = {
  consents: Consents;
  data: RegistrationValues;
  submitLabel: string;
  busy: boolean;
  onDone: (patch: RegistrationValues) => void;
};

export function ConsentStep({ consents, data, submitLabel, busy, onDone }: ConsentStepProps) {
  const [values, setValues] = useState(() => Object.fromEntries(consents.map((c) => [c.name, data[c.name] === true])));
  const ready = consents.every((c) => !c.required || values[c.name]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (ready && !busy) onDone(values);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {consents.map((c) => (
          <div key={c.name} className="flex items-center gap-1.5">
            <Checkbox checked={values[c.name]} onChange={(v) => setValues((s) => ({ ...s, [c.name]: v }))} label={c.label} />
            {c.link && (
              <Link to={c.link.to} target="_blank" className="text-[13.5px] font-medium text-accent-ink hover:underline">
                {c.link.label}
              </Link>
            )}
          </div>
        ))}
      </div>
      <PrimaryButton disabled={!ready} busy={busy} busyLabel="Creazione account">
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}
