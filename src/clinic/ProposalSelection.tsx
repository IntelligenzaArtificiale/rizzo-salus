import { useState } from "react";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { ProposalCalendar } from "./ProposalCalendar";

import { Checkbox } from "@/components/form/Checkbox";

import { api, type Data } from "./api";
import { useAction, monday } from "./common";
export function ProposalSelection({
  proposal,
  onDone,
}: {
  proposal: Data;
  onDone: (day: string) => void;
}) {
  const [focus, setFocus] = useState(0);
  const [week, setWeek] = useState(monday((proposal.nuove[0]?.start ?? proposal.dal).slice(0,10)));
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
      {proposal.nuove.length ? <>
        <ProposalCalendar {...{proposal, focus, week, edits, selected, setWeek}}
          onFocus={i => { setFocus(i); setWeek(monday((edits[i]?.start ?? proposal.nuove[i].start).slice(0,10))); }}
          onSlot={slot => { patch(focus, {start:slot.start, professional_id:slot.professional_id}); setWeek(monday(slot.start.slice(0,10))); }} />
        <Checkbox label="Includi questa seduta nella conferma" checked={selected.includes(focus)}
          onChange={on => setSelected(s => on ? [...s, focus] : s.filter(i => i !== focus))} />
      </> : <p>Nessuna seduta disponibile per il periodo e i vincoli scelti.</p>}
      {proposal.spostamenti.length > 0 && (
        <>
          <p className="text-sm text-ink-2">
            La proposta richiede {proposal.spostamenti.length} spostamenti già
            elencati nel riepilogo. Se non li approvi, rigenera con un periodo
            diverso.
          </p>
          <ul>{proposal.spostamenti.map((m:Data) => <li key={m.appointment_id}>{m.da.slice(0,16).replace("T"," ")} → {m.a.slice(0,16).replace("T"," ")}</li>)}</ul>
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
            onDone((edits[selected[0]]?.start ?? proposal.nuove[selected[0]].start).slice(0,10));
          }, "Sedute selezionate inserite in agenda")
        }
      >
        Approva le {selected.length} sedute selezionate
      </Button>
    </Section>
  );
}
