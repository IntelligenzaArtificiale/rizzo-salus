import { useState } from "react";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { useAction } from "./common";
const days = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];
export function AvailabilityFields({
  value,
  onChange,
}: {
  value: Data[];
  onChange: (v: Data[]) => void;
}) {
  const patch = (i: number, p: Data) =>
    onChange(value.map((v, j) => (i === j ? { ...v, ...p } : v)));
  return (
    <div className="flex flex-col gap-4">
      {value.map((v, i) => (
        <div key={i} className="rounded-card border border-line p-4">
          <div className="grid gap-x-4 sm:grid-cols-3">
            <SelectField
              label="Giorno"
              value={String(v.giorno)}
              onChange={(x) => patch(i, { giorno: Number(x) })}
              options={days.map((d, j) => ({ value: String(j + 1), label: d }))}
            />
            <TextField
              label="Dalle"
              type="time"
              value={v.da}
              onChange={(da) => patch(i, { da })}
            />
            <TextField
              label="Alle"
              type="time"
              value={v.a}
              onChange={(a) => patch(i, { a })}
            />
            <SelectField
              label="Preferenza"
              value={v.preferenza ?? "media"}
              onChange={(preferenza) => patch(i, { preferenza })}
              options={["alta", "media", "bassa"].map((t) => ({
                value: t,
                label: t,
              }))}
            />
            <TextField
              label="Valida dal"
              type="date"
              value={v.valida_dal ?? ""}
              onChange={(valida_dal) =>
                patch(i, { valida_dal: valida_dal || null })
              }
            />
            <TextField
              label="Valida fino al"
              type="date"
              value={v.valida_al ?? ""}
              onChange={(valida_al) =>
                patch(i, { valida_al: valida_al || null })
              }
            />
          </div>
          <Button
            variant="quiet"
            type="button"
            onClick={() => onChange(value.filter((_, j) => i !== j))}
          >
            Rimuovi fascia
          </Button>
        </div>
      ))}
      <Button
        type="button"
        onClick={() =>
          onChange([
            ...value,
            { giorno: 1, da: "08:00", a: "13:00", preferenza: "media" },
          ])
        }
      >
        Aggiungi disponibilità
      </Button>
    </div>
  );
}
export function PatientAvailability({
  patient,
  onSaved,
}: {
  patient: Data;
  onSaved: () => void;
}) {
  const { can } = useClinic();
  const [v, setV] = useState<Data>(patient);
  const a = useAction();
  return (
    <Section title="Disponibilità e riferimenti del paziente">
      <p className="text-sm text-ink-2">
        Le fasce generali valgono per tutti i percorsi che non hanno fasce
        dedicate.
      </p>
      {can("pazienti.anagrafica") ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            a.act(async () => {
              await api("/pazienti/salva", v);
              onSaved();
            }, "Scheda aggiornata");
          }}
        >
          <AvailabilityFields
            value={v.disponibilita ?? []}
            onChange={(disponibilita) => setV({ ...v, disponibilita })}
          />
          <TextField
            label="Medico curante"
            value={v.medico_curante ?? ""}
            onChange={(medico_curante) => setV({ ...v, medico_curante })}
          />
          <TextField
            label="Medico specialista"
            value={v.medico_specialista ?? ""}
            onChange={(medico_specialista) =>
              setV({ ...v, medico_specialista })
            }
          />
          <SelectField
            label="Copertura assicurativa"
            value={v.assicurazione ?? "nessuna"}
            onChange={(assicurazione) => setV({ ...v, assicurazione })}
            options={[
              { value: "nessuna", label: "Nessuna" },
              { value: "privata", label: "Assicurazione privata" },
              { value: "convenzionata", label: "Convenzione diretta" },
            ]}
          />
          {v.assicurazione && v.assicurazione !== "nessuna" && (
            <>
              <TextField
                label="Compagnia"
                value={v.compagnia ?? ""}
                onChange={(compagnia) => setV({ ...v, compagnia })}
              />
              <TextField
                label="Polizza"
                value={v.polizza ?? ""}
                onChange={(polizza) => setV({ ...v, polizza })}
              />
            </>
          )}
          <TextAreaField
            label="Avvertenze per i professionisti curanti"
            value={v.avvertenze ?? ""}
            onChange={(avvertenze) => setV({ ...v, avvertenze })}
          />
          <Button type="submit" variant="primary" disabled={a.busy}>
            Salva disponibilità e riferimenti
          </Button>
        </form>
      ) : (
        <p className="text-sm text-ink-2">
          La segreteria gestisce le disponibilità.
        </p>
      )}
    </Section>
  );
}
