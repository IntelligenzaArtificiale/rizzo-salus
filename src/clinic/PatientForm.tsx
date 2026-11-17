import { CollapsiblePanel } from "@/components/app/CollapsiblePanel";
// Tutti i campi dell'anagrafica originale. Revision e conferma duplicato restano nel contratto server.
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { PageTabs } from "@/components/app/PageTabs";
import { Button } from "@/components/atoms/Button";
import { Section } from "@/components/app/Section";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { FormActions } from "@/components/form/FormActions";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { useFormFields } from "@/lib/forms/useFormFields";
import { useUnsavedChanges } from "@/lib/forms/useUnsavedChanges";
import { email, cap, codiceFiscale } from "@/lib/validation";
import { api, ApiError, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { LoadState, useLoad, useAction, name } from "./common";
export function PatientFormPage() {
  const { id } = useParams();
  const load = useLoad(
    () =>
      id
        ? api("/pazienti/dettaglio", { id })
        : Promise.resolve({ canale_preferito: "whatsapp", consensi: {} }),
    [id],
  );
  return (
    <LoadState load={load}>
      {load.data && <PatientForm key={id || "new"} p={load.data} />}
    </LoadState>
  );
}
function PatientForm({ p }: { p: Data }) {
  const { can } = useClinic(),
    navigate = useNavigate(),
    a = useAction();
  const steps = ["Anagrafica", "Contatti", "Consensi", "Note"];
  const [step, setStep] = useState("Anagrafica");
  const stepIndex = steps.indexOf(step);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current
      ?.querySelector<HTMLInputElement>("input,select,textarea")
      ?.focus();
  }, [step]);
  const [duplicate, setDuplicate] = useState(false),
    [consents, setConsents] = useState<Data>(p.consensi || {});
  const f = useFormFields({
    nome: { initial: p.nome, rules: [] },
    cognome: { initial: p.cognome, rules: [] },
    codice_fiscale: {
      initial: p.codice_fiscale || "",
      rules: [codiceFiscale],
      optional: true,
    },
    data_nascita: { initial: p.data_nascita || "", rules: [], optional: true },
    luogo_nascita: {
      initial: p.luogo_nascita || "",
      rules: [],
      optional: true,
    },
    sesso: { initial: p.sesso || "", rules: [], optional: true },
    medico_curante: {
      initial: p.medico_curante || "",
      rules: [],
      optional: true,
    },
    telefono: {
      initial: p.telefono || "",
      rules: [
        (v) =>
          /^\+?[\d\s()-]{6,20}$/.test(v)
            ? null
            : "Controlla il numero di telefono.",
      ],
      optional: true,
    },
    email: { initial: p.email || "", rules: [email], optional: true },
    canale_preferito: { initial: p.canale_preferito || "whatsapp", rules: [] },
    indirizzo: { initial: p.indirizzo || "", rules: [], optional: true },
    cap: { initial: p.cap || "", rules: [cap], optional: true },
    citta: { initial: p.citta || "", rules: [], optional: true },
    provincia: {
      initial: p.provincia || "",
      rules: [(v) => (/^[a-zA-Z]{2}$/.test(v) ? null : "Usa due lettere.")],
      optional: true,
    },
    anamnesi: { initial: p.anamnesi || "", rules: [], optional: true },
    allergie: { initial: p.allergie || "", rules: [], optional: true },
    note_amministrative: {
      initial: p.note_amministrative || "",
      rules: [],
      optional: true,
    },
  });
  const dirty =
    f.dirty || JSON.stringify(consents) !== JSON.stringify(p.consensi || {});
  const guard = useUnsavedChanges(dirty);
  const save = async (force = false) => {
    const values: Data = { ...f.values };
    for (const k of Object.keys(values)) if (values[k] === "") values[k] = null;
    if (!can("pazienti.clinica")) {
      delete values.anamnesi;
      delete values.allergie;
    }
    try {
      const result = await api("/pazienti/salva", {
        ...values,
        consensi: consents,
        ...(p.id ? { id: p.id, revision: p.revision } : {}),
        conferma_duplicato: force,
      });
      guard.allowNext();
      navigate("/pazienti/" + result.id);
    } catch (e) {
      if (e instanceof ApiError && e.code.includes("duplicat"))
        setDuplicate(true);
      else throw e;
    }
  };
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Pazienti", to: "/pazienti" }, ...(p.id ? [{ label: name(p), to: "/pazienti/" + p.id }] : []), { label: p.id ? "Modifica paziente" : "Nuovo paziente" }]}
        title={p.id ? "Modifica paziente" : "Nuovo paziente"}
        subtitle={p.id ? name(p) : undefined}
        back={{
          to: p.id ? "/pazienti/" + p.id : "/pazienti",
          label: p.id ? "Scheda paziente" : "Pazienti",
        }}
      />
      {!p.id && (
        <p className="text-[12px] text-ink-3">
          Passo {stepIndex + 1} di {steps.length} · I dati rimangono compilati
          passando da una sezione all’altra.
        </p>
      )}
      <PageTabs
        options={steps}
        value={step}
        onChange={setStep}
        label="Dati del paziente"
      />
      <form
        ref={formRef}
        className="flex max-w-[640px] flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.isValid) return;
          if (!p.id && stepIndex < steps.length - 1) {
            setStep(steps[stepIndex + 1]);
            return;
          }
          a.act(() => save());
        }}
      >
        {step === "Anagrafica" && (
          <Section title="Dati personali">
            <TextField
              label="Nome"
              autoFocus
              maxLength={80}
              {...f.field("nome")}
            />
            <TextField label="Cognome" maxLength={80} {...f.field("cognome")} />
            <TextField
              label="Codice fiscale"
              hint="Facoltativo. Completa data di nascita e sesso quando riconosciuto."
              maxLength={16}
              {...f.field("codice_fiscale")}
            />
            <CollapsiblePanel title={<> Altri dati anagrafici </>}>
              <div className="pt-4">
                <TextField
                  label="Data di nascita"
                  type="date"
                  {...f.field("data_nascita")}
                />
                <TextField
                  label="Luogo di nascita"
                  {...f.field("luogo_nascita")}
                />
                <SelectField
                  label="Sesso"
                  value={f.values.sesso}
                  onChange={(v) => f.setValue("sesso", v)}
                  options={[
                    { value: "", label: "Non indicato" },
                    { value: "M", label: "Maschile" },
                    { value: "F", label: "Femminile" },
                  ]}
                />
                <TextField
                  label="Medico curante"
                  {...f.field("medico_curante")}
                />
              </div>
            </CollapsiblePanel>
          </Section>
        )}
        {step === "Contatti" && (
          <Section title="Contatti">
            <TextField label="Cellulare" type="tel" {...f.field("telefono")} />
            <TextField label="Email" type="email" {...f.field("email")} />
            <SelectField
              label="Canale preferito"
              value={f.values.canale_preferito}
              onChange={(v) => f.setValue("canale_preferito", v)}
              options={[
                { value: "whatsapp", label: "WhatsApp" },
                { value: "sms", label: "SMS" },
                { value: "email", label: "Email" },
                { value: "nessuno", label: "Nessuno" },
              ]}
            />
            <CollapsiblePanel title={<> Indirizzo per la fatturazione </>}>
              <div className="pt-4">
                <TextField label="Indirizzo" {...f.field("indirizzo")} />
                <TextField label="CAP" maxLength={5} {...f.field("cap")} />
                <TextField label="Città" {...f.field("citta")} />
                <TextField
                  label="Provincia"
                  maxLength={2}
                  {...f.field("provincia")}
                />
              </div>
            </CollapsiblePanel>
          </Section>
        )}
        {step === "Consensi" && (
          <Section title="Consensi">
            <div className="flex flex-col gap-4">
              {[
                ["privacy", "Privacy"],
                ["whatsapp", "Messaggi WhatsApp"],
                ["marketing", "Comunicazioni promozionali"],
                ["sts_opposizione", "Opposizione all’invio al Sistema TS"],
              ].map(([k, label]) => (
                <Checkbox
                  key={k}
                  label={label}
                  checked={Boolean(consents[k]?.valore)}
                  onChange={(v) =>
                    setConsents((c) => ({ ...c, [k]: { valore: v } }))
                  }
                />
              ))}
            </div>
          </Section>
        )}
        {step === "Note" && (
          <>
            {can("pazienti.clinica") && (
              <Section title="Dati clinici">
                <TextAreaField label="Anamnesi" {...f.field("anamnesi")} />
                <TextAreaField label="Allergie" {...f.field("allergie")} />
              </Section>
            )}
            <TextAreaField
              label="Note amministrative"
              {...f.field("note_amministrative")}
            />
          </>
        )}
        <FormActions
          submitLabel={
            p.id
              ? "Salva modifiche"
              : stepIndex < steps.length - 1
                ? "Continua"
                : "Crea paziente"
          }
          onAction={
            !p.id && stepIndex < steps.length - 1
              ? () => setStep(steps[stepIndex + 1])
              : undefined
          }
          leading={
            stepIndex > 0 ? (
              <Button
                type="button"
                variant="quiet"
                onClick={() => setStep(steps[stepIndex - 1])}
              >
                Indietro
              </Button>
            ) : undefined
          }
          busy={a.busy}
          disabled={!f.isValid || (!dirty && Boolean(p.id))}
          cancelTo={p.id ? "/pazienti/" + p.id : "/pazienti"}
        />
      </form>
      {guard.dialog}
      <ConfirmDialog
        open={duplicate}
        title="Paziente simile già presente"
        actionLabel="Salva comunque"
        busy={a.busy}
        onClose={() => setDuplicate(false)}
        onConfirm={() => a.act(() => save(true))}
      >
        Controlla i dati prima di confermare la creazione o la modifica.
      </ConfirmDialog>
    </>
  );
}
