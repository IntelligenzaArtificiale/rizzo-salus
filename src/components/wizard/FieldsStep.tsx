/*
 * Passaggio con campi, costruito dalla configurazione (config/registration-steps.ts).
 * Comportamento comune da useFormFields; in più:
 * - email nuova: suggerisce i domini scritti male e controlla al blur che non sia già registrata;
 * - password nuova: requisiti spuntati mentre si scrive e conferma;
 * - telefono: prefisso internazionale e lunghezza per paese.
 */
import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { TextField } from "@/components/form/TextField";
import { PasswordField } from "@/components/form/PasswordField";
import { PasswordChecklist } from "@/components/form/PasswordChecklist";
import { PhoneField } from "@/components/form/PhoneField";
import { PrimaryButton } from "@/components/form/PrimaryButton";
import { useFormFields } from "@/lib/forms/useFormFields";
import { suggestEmail } from "@/lib/forms/emailSuggestion";
import { email as emailRule, newPassword, phone, samePassword, type Validator } from "@/lib/validation";
import { checkEmailAvailable } from "@/api/registration";
import type { FieldDef, RegistrationValues } from "@/config/registration-steps";

type Spec = Record<string, { initial?: string; rules: Validator[]; optional?: boolean }>;

const confirmName = (name: string) => `${name}Conferma`;
const prefixName = (name: string) => `${name}Prefisso`;

function buildSpec(fields: FieldDef[], data: RegistrationValues, read: () => Record<string, string>): Spec {
  const spec: Spec = {};
  const initial = (n: string) => (typeof data[n] === "string" ? (data[n] as string) : "");
  for (const f of fields) {
    if (f.kind === "text") spec[f.name] = { initial: initial(f.name), rules: f.rules ?? [], optional: f.optional };
    if (f.kind === "email-new") spec[f.name] = { initial: initial(f.name), rules: [emailRule] };
    if (f.kind === "password-new") {
      spec[f.name] = { rules: [newPassword] };
      spec[confirmName(f.name)] = { rules: [samePassword(() => read()[f.name])] };
    }
    if (f.kind === "phone") spec[f.name] = { initial: initial(f.name), rules: [phone(() => read()[prefixName(f.name)])], optional: f.optional };
  }
  return spec;
}

type FieldsStepProps = {
  fields: FieldDef[];
  data: RegistrationValues;
  submitLabel: string;
  busyLabel?: string;
  busy?: boolean;
  onDone: (patch: RegistrationValues) => void;
};

export function FieldsStep({ fields, data, submitLabel, busyLabel = "Attendi", busy = false, onDone }: FieldsStepProps) {
  const current = useRef<Record<string, string>>({});
  const [spec] = useState(() => buildSpec(fields, data, () => current.current));
  const form = useFormFields(spec);
  const [prefixes, setPrefixes] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.filter((f) => f.kind === "phone").map((f) => [prefixName(f.name), (data[prefixName(f.name)] as string) || "+39"])),
  );
  current.current = { ...form.values, ...prefixes };

  /* disponibilità dell'email: undefined = da controllare, "checking", true/false */
  const [availability, setAvailability] = useState<Record<string, boolean | "checking">>({});
  const emailField = fields.find((f) => f.kind === "email-new");
  const emailValue = emailField ? form.values[emailField.name].trim().toLowerCase() : "";
  const emailState = emailField ? availability[emailValue] : true;

  /** controlla una volta per indirizzo; restituisce se l'email è libera */
  async function checkEmail(): Promise<boolean> {
    if (!emailField || emailRule(emailValue)) return true;
    const known = availability[emailValue];
    if (known === true || known === false) return known;
    setAvailability((a) => ({ ...a, [emailValue]: "checking" }));
    const result = await checkEmailAvailable(emailValue);
    const free = result.ok ? result.data.disponibile : true;
    setAvailability((a) => ({ ...a, [emailValue]: free }));
    return free;
  }

  const canSubmit = form.isValid && !busy && (!emailField || emailState !== false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    if (!(await checkEmail())) return;
    const patch: RegistrationValues = {};
    for (const f of fields) {
      patch[f.name] = f.kind === "email-new" ? emailValue : f.kind === "password-new" ? form.values[f.name] : form.values[f.name].trim();
      if (f.kind === "phone") patch[prefixName(f.name)] = prefixes[prefixName(f.name)];
    }
    onDone(patch);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1">
      {fields.map((f, i) => {
        const field = form.field(f.name);
        if (f.kind === "text") {
          return <TextField key={f.name} {...field} label={f.label} placeholder={f.placeholder} autoComplete={f.autoComplete} hint={f.hint} autoFocus={i === 0} />;
        }
        if (f.kind === "email-new") {
          const suggestion = !field.error ? suggestEmail(field.value) : null;
          const taken = emailState === false;
          return (
            <TextField
              key={f.name}
              {...field}
              onBlur={() => { field.onBlur(); void checkEmail(); }}
              label={f.label}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nome@azienda.it"
              autoFocus={i === 0}
              error={taken ? <>Hai già un account con questa email. <Link to="/accedi" className="font-medium underline">Accedi</Link></> : field.error}
              hint={suggestion ? (
                <>Intendevi <button type="button" onClick={() => field.onChange(suggestion)} className="font-medium text-accent-ink hover:underline">{suggestion}</button>?</>
              ) : undefined}
            />
          );
        }
        if (f.kind === "password-new") {
          const confirm = form.field(confirmName(f.name));
          return (
            <div key={f.name} className="flex flex-col gap-1">
              <PasswordField {...field} label={f.label} autoComplete="new-password" autoFocus={i === 0} error={null} />
              <PasswordChecklist value={field.value} />
              <PasswordField {...confirm} label="Ripeti la password" autoComplete="new-password" />
            </div>
          );
        }
        const prefix = prefixName(f.name);
        return (
          <PhoneField
            key={f.name}
            {...field}
            label={f.label}
            hint={f.hint}
            prefix={prefixes[prefix]}
            onPrefixChange={(v) => setPrefixes((p) => ({ ...p, [prefix]: v }))}
          />
        );
      })}
      <PrimaryButton className="mt-3" disabled={!canSubmit} busy={busy} busyLabel={busyLabel}>
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}
