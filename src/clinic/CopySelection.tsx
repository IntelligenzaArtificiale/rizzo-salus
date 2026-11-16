import { useState } from "react";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/form/Checkbox";
import { api, type Data } from "./api";
import { useAction, date } from "./common";
export function CopySelection({
  data,
  week,
  onDone,
}: {
  data: Data;
  week: string;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(
    data.copiati.map((c: Data) => c.source_id),
  );
  const a = useAction();
  const days = [
    ...new Set<string>(data.copiati.map((c: Data) => c.start.slice(0, 10))),
  ];
  return (
    <Section title="Scegli cosa copiare">
      <p className="text-sm text-ink-2">
        Puoi selezionare giornate intere o singoli appuntamenti e gruppi. Le
        sedute esaurite restano escluse.
      </p>
      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <Button
            key={day}
            onClick={() =>
              setSelected(
                data.copiati
                  .filter((c: Data) => c.start.startsWith(day))
                  .map((c: Data) => c.source_id),
              )
            }
          >
            Solo {date(day)}
          </Button>
        ))}
        <Button
          onClick={() =>
            setSelected(data.copiati.map((c: Data) => c.source_id))
          }
        >
          Tutta la settimana
        </Button>
        <Button onClick={() => setSelected([])}>Deseleziona</Button>
      </div>
      {data.copiati.map((c: Data) => (
        <Checkbox
          key={c.source_id}
          label={
            date(c.start) +
            " · " +
            c.start.slice(11, 16) +
            " · " +
            (c.tipo === "gruppo"
              ? "Gruppo · " + c.pazienti.length + " partecipanti"
              : "Appuntamento")
          }
          checked={selected.includes(c.source_id)}
          onChange={(v) =>
            setSelected(
              v
                ? [...selected, c.source_id]
                : selected.filter((id) => id !== c.source_id),
            )
          }
        />
      ))}
      <Button
        variant="primary"
        disabled={a.busy || !selected.length}
        onClick={() =>
          a.act(async () => {
            await api("/agenda/copia-applica", {
              settimana: week,
              selezionati: selected,
            });
            onDone();
          }, "Selezione copiata")
        }
      >
        Copia i {selected.length} appuntamenti selezionati
      </Button>
    </Section>
  );
}
