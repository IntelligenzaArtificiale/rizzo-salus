import { useState } from "react";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { useLoad, useAction, name } from "./common";
export function WaitlistForm({ onSaved }: { onSaved: () => void }) {
  const { catalog } = useClinic();
  const [q, setQ] = useState(""),
    [v, setV] = useState<Data>({
      patient_id: "",
      therapy_type_id: "",
      professional_id: "",
      nota: "",
    });
  const a = useAction();
  const patients = useLoad(
    () => api("/pazienti/cerca", { q, limite: 50 }),
    [q],
  );
  return (
    <Section title="Inserisci richiesta in attesa">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          a.act(async () => {
            await api("/prenotazioni/attesa-salva", {
              ...v,
              professional_id: v.professional_id || null,
            });
            onSaved();
          }, "Richiesta inserita");
        }}
      >
        <TextField label="Cerca paziente" value={q} onChange={setQ} />
        <SelectField
          label="Paziente in attesa"
          value={v.patient_id}
          onChange={(patient_id) => setV({ ...v, patient_id })}
          options={[
            { value: "", label: "Scegli paziente" },
            ...(patients.data?.risultati ?? []).map((p: Data) => ({
              value: p.id,
              label: name(p),
            })),
          ]}
        />
        <SelectField
          label="Servizio richiesto"
          value={v.therapy_type_id}
          onChange={(therapy_type_id) => setV({ ...v, therapy_type_id })}
          options={[
            { value: "", label: "Scegli visita" },
            ...catalog.terapie
              .filter((t: Data) => t.categoria === "visita")
              .map((t: Data) => ({ value: t.id, label: t.nome })),
          ]}
        />
        <SelectField
          label="Professionista richiesto"
          value={v.professional_id}
          onChange={(professional_id) => setV({ ...v, professional_id })}
          options={[
            { value: "", label: "Qualsiasi medico disponibile" },
            ...catalog.professionisti
              .filter((p: Data) => p.tipo === "medico")
              .map((p: Data) => ({ value: p.id, label: name(p) })),
          ]}
        />
        <TextField
          label="Nota per il ricontatto"
          value={v.nota}
          onChange={(nota) => setV({ ...v, nota })}
        />
        <Button
          type="submit"
          disabled={a.busy || !v.patient_id || !v.therapy_type_id}
        >
          Inserisci in attesa
        </Button>
      </form>
    </Section>
  );
}
