import { useState } from "react";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { useClinic } from "./ClinicContext";
import { api, type Data } from "./api";
import { useAction, name, date } from "./common";
export function ProposalSelection({
  proposal,
  onDone,
}: {
  proposal: Data;
  onDone: () => void;
}) {
  const { catalog } = useClinic();
  const [selected, setSelected] = useState<number[]>(
      proposal.nuove.map((_: Data, i: number) => i),
    ),
    [edits, setEdits] = useState<Data>({}),
    [moves, setMoves] = useState(false);
  const a = useAction();
  const patch = (i: number, p: Data) =>
    setEdits({ ...edits, [i]: { ...edits[i], ...p } });
  return (
    <Section title="Sedute proposte da approvare">
      <p className="text-sm text-ink-2">
        Seleziona le sedute, modifica gli orari oppure rigenera una proposta.
        Nessuna modifica è automatica.
      </p>
      {proposal.nuove.map((n: Data, i: number) => (
        <div key={i} className="rounded-card border border-line p-4">
          <Checkbox
            label={
              (catalog.terapie.find((t: Data) => t.id === n.therapy_type_id)
                ?.nome ?? "Terapia") +
              " · " +
              date(n.start)
            }
            checked={selected.includes(i)}
            onChange={(v) =>
              setSelected(
                v ? [...selected, i] : selected.filter((x) => x !== i),
              )
            }
          />
          <TextField
            label="Orario proposto"
            type="datetime-local"
            value={(edits[i]?.start ?? n.start).slice(0, 16)}
            onChange={(start) => patch(i, { start: start + ":00" })}
          />
          <SelectField
            label="Professionista proposto"
            value={edits[i]?.professional_id ?? n.professional_id}
            onChange={(professional_id) => patch(i, { professional_id })}
            options={catalog.professionisti
              .filter(
                (p: Data) =>
                  p.attivo && ["medico", "fisioterapista"].includes(p.tipo),
              )
              .map((p: Data) => ({
                value: p.id,
                label: name(p),
              }))}
          />
          {n.alternative?.length > 0 && (
            <Button onClick={() => patch(i, n.alternative[0])}>
              Usa prima alternativa
            </Button>
          )}
        </div>
      ))}
      {proposal.spostamenti.length > 0 && (
        <>
          <p className="text-sm text-ink-2">
            La proposta richiede {proposal.spostamenti.length} spostamenti già
            elencati nel riepilogo. Se non li approvi, rigenera con un periodo
            diverso.
          </p>
          <Checkbox
            label="Approvo anche gli spostamenti degli appuntamenti esistenti"
            checked={moves}
            onChange={setMoves}
          />
        </>
      )}
      <Button
        variant="primary"
        disabled={
          a.busy ||
          !selected.length ||
          (proposal.spostamenti.length > 0 && !moves)
        }
        onClick={() =>
          a.act(async () => {
            await api("/pianificazione/approva", {
              id: proposal.id,
              selezionate: selected,
              modifiche: edits,
              approva_spostamenti: moves,
            });
            onDone();
          }, "Sedute selezionate inserite in agenda")
        }
      >
        Approva le {selected.length} sedute selezionate
      </Button>
    </Section>
  );
}
