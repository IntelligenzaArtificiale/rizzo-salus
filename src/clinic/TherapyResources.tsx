import { Checkbox } from "@/components/form/Checkbox";
import type { Data } from "./api";
export function TherapyResources({
  value,
  onChange,
  catalog,
}: {
  value: Data;
  onChange: (v: Data) => void;
  catalog: Data;
}) {
  return (
    <fieldset className="rounded-card border border-line p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        Altre risorse necessarie contemporaneamente
      </legend>
      <p className="mb-3 text-sm text-ink-2">
        Associa anche la sala o altre attrezzature. Tutte le risorse vengono
        controllate per sovrapposizioni e orari.
      </p>
      {catalog.risorse
        .filter((r: Data) => r.id !== value.risorsa_id && r.attivo)
        .map((r: Data) => (
          <Checkbox
            key={r.id}
            label={r.nome}
            checked={(value.risorse_aggiuntive || []).includes(r.id)}
            onChange={(checked) =>
              onChange({
                ...value,
                risorse_aggiuntive: checked
                  ? [...(value.risorse_aggiuntive || []), r.id]
                  : (value.risorse_aggiuntive || []).filter(
                      (id: string) => id !== r.id,
                    ),
              })
            }
          />
        ))}
    </fieldset>
  );
}
