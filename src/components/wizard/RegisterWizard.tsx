/*
 * Percorso a passaggi dentro AuthLayout: barra di avanzamento, Indietro, un passaggio per volta.
 * Non sa nulla di API: alla fine chiama onComplete con tutte le risposte.
 * stepOffset serve quando una parte del percorso è già stata fatta (es. prima del link).
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { useWizard } from "@/components/wizard/useWizard";
import { FieldsStep } from "@/components/wizard/FieldsStep";
import { ChoiceStep } from "@/components/wizard/ChoiceStep";
import { ConsentStep } from "@/components/wizard/ConsentStep";
import type { RegistrationValues, StepDef } from "@/config/registration-steps";

type RegisterWizardProps = {
  steps: StepDef[];
  storageKey: string;
  initialData?: RegistrationValues;
  stepOffset?: number;
  /** passaggi totali del percorso completo, se più lungo di quelli montati qui */
  totalSteps?: number;
  submitLabel: string;
  busyLabel: string;
  /** contenuto sopra il primo campo, es. l'email già confermata */
  banner?: ReactNode;
  onComplete: (data: RegistrationValues) => Promise<void>;
};

export function RegisterWizard({ steps, storageKey, initialData, stepOffset = 0, totalSteps, submitLabel, busyLabel, banner, onComplete }: RegisterWizardProps) {
  const wizard = useWizard(steps, storageKey, initialData);
  const [busy, setBusy] = useState(false);
  const { step } = wizard;
  const isLast = wizard.index === wizard.total - 1;
  const total = Math.max(totalSteps ?? 0, stepOffset + wizard.total);

  async function advance(patch: RegistrationValues) {
    const { done, data } = wizard.next(patch);
    if (!done) return;
    setBusy(true);
    await onComplete(data);
    setBusy(false);
  }

  const showLoginLink = stepOffset === 0 && wizard.index === 0;

  return (
    <AuthLayout
      title={step.title}
      subtitle={step.subtitle}
      progress={total > 1 ? { current: stepOffset + wizard.index + 1, total } : undefined}
      onBack={wizard.back}
      aside={showLoginLink ? <>Hai già un account? <Link to="/accedi" className="font-medium text-accent-ink hover:underline">Accedi</Link></> : undefined}
    >
      <div key={step.id} className="anim-rise">
        {banner && wizard.index === 0 && <div className="mb-5">{banner}</div>}
        {step.kind === "fields" && (
          <FieldsStep
            fields={step.fields}
            data={wizard.data}
            submitLabel={isLast ? submitLabel : "Continua"}
            busyLabel={busyLabel}
            busy={busy}
            onDone={advance}
          />
        )}
        {step.kind === "choice" && (
          <ChoiceStep
            options={step.options}
            multiple={step.multiple}
            value={wizard.data[step.name] as string | string[] | undefined}
            onDone={(value) => advance({ [step.name]: value })}
          />
        )}
        {step.kind === "consents" && (
          <ConsentStep consents={step.consents} data={wizard.data} submitLabel={submitLabel} busy={busy} onDone={advance} />
        )}
      </div>
    </AuthLayout>
  );
}
