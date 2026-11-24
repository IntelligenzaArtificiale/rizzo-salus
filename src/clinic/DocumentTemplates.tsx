import { useState } from "react";
import { SettingsSection } from "@/components/app/SettingsSection";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { Button } from "@/components/atoms/Button";
import { api, type Data } from "./api";
import { useLoad, useAction } from "./common";
const empty = {
  nome: "",
  tipo: "privacy",
  testo: "",
  versione: "1",
  attivo: false,
};
export function DocumentTemplates() {
  const load = useLoad(() => api("/documenti/modelli"));
  const [v, setV] = useState<Data>(empty);
  const a = useAction();
  return (
    <SettingsSection
      title="Modelli di consenso e referto"
      description="Inserisci i testi approvati per la struttura. Le copie già generate conservano testo e versione originali. L’accettazione con codice monouso registra le evidenze di una firma semplice."
    >
      <SelectField
        label="Modello"
        value={v.id ?? ""}
        onChange={(id) =>
          setV(id ? load.data?.modelli.find((r: Data) => r.id === id) : empty)
        }
        options={[
          { value: "", label: "Crea modello" },
          ...(load.data?.modelli ?? []).map((r: Data) => ({
            value: r.id,
            label: r.nome + " · " + r.versione,
          })),
        ]}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.act(async () => {
            setV(await api("/documenti/modello-salva", v));
            load.reload();
          }, "Modello salvato");
        }}
        className="flex flex-col gap-3"
      >
        <TextField
          label="Nome del modello"
          value={v.nome}
          onChange={(nome) => setV({ ...v, nome })}
        />
        <SelectField
          label="Finalità"
          value={v.tipo}
          onChange={(tipo) => setV({ ...v, tipo })}
          options={[
            "privacy",
            "trattamento",
            "marketing",
            "whatsapp",
            "referto",
            "altro",
          ].map((t) => ({ value: t, label: t }))}
        />
        <TextField
          label="Versione"
          value={v.versione}
          onChange={(versione) => setV({ ...v, versione })}
        />
        <TextAreaField
          label="Testo del documento"
          value={v.testo}
          onChange={(testo) => setV({ ...v, testo })}
          rows={14}
          hint="Campi disponibili: {{nome}}, {{cognome}}, {{codice_fiscale}}, {{data_nascita}}, {{indirizzo}}, {{data}}, {{struttura}}."
        />
        <Checkbox
          label="Modello attivo e pronto per l’utilizzo"
          checked={v.attivo}
          onChange={(attivo) => setV({ ...v, attivo })}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={a.busy || !v.nome || !v.testo}
        >
          Salva modello
        </Button>
      </form>
    </SettingsSection>
  );
}
