import { useLoad } from "./common";
import { api, type Data } from "./api";
import { SelectField } from "@/components/form/SelectField";
import { TextField } from "@/components/form/TextField";
import { Button } from "@/components/atoms/Button";
export function TherapyConsumption({
  value,
  onChange,
}: {
  value: Data[];
  onChange: (v: Data[]) => void;
}) {
  const load = useLoad(() => api("/gestione/stock"));
  return (
    <fieldset className="rounded-card border border-line p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        Consumi per prestazione eseguita
      </legend>
      {value.map((c, i) => (
        <div key={i} className="mb-3">
          <SelectField
            label="Articolo consumato"
            value={c.articolo_id}
            onChange={(articolo_id) =>
              onChange(
                value.map((x, j) => (i === j ? { ...x, articolo_id } : x)),
              )
            }
            options={[
              { value: "", label: "Scegli articolo" },
              ...(load.data?.articoli ?? []).map((a: Data) => ({
                value: a.id,
                label: a.nome,
              })),
            ]}
          />
          <TextField
            label="Quantità consumata per paziente"
            type="number"
            step="any"
            value={String(c.quantita)}
            onChange={(s) =>
              onChange(
                value.map((x, j) =>
                  i === j ? { ...x, quantita: Number(s) } : x,
                ),
              )
            }
          />
          <Button
            type="button"
            onClick={() => onChange(value.filter((_, j) => i !== j))}
          >
            Rimuovi consumo
          </Button>
        </div>
      ))}
      <Button
        type="button"
        onClick={() => onChange([...value, { articolo_id: "", quantita: 1 }])}
      >
        Aggiungi consumo
      </Button>
    </fieldset>
  );
}
