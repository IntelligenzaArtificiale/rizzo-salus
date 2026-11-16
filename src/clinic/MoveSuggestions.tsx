import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { TextField } from "@/components/form/TextField";
import { Button } from "@/components/atoms/Button";
import { RowList } from "@/components/app/RowList";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { api, type Data } from "./api";
import { today, addDays, date, useAction } from "./common";
export function MoveSuggestionsPage() {
  const { id } = useParams(),
    nav = useNavigate(),
    a = useAction();
  const [from, setFrom] = useState(today()),
    [to, setTo] = useState(addDays(today(), 7)),
    [proposal, setProposal] = useState<Data | null>(null),
    [chosen, setChosen] = useState<Data | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Proposte di spostamento"
        subtitle="Alternative separate dalla pianificazione iniziale. Nessuna modifica prima della conferma."
        back={{ to: "/agenda", label: "Agenda" }}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Cerca dal"
          type="date"
          value={from}
          onChange={setFrom}
        />
        <TextField
          label="Cerca fino al"
          type="date"
          value={to}
          onChange={setTo}
        />
      </div>
      <Button
        disabled={a.busy}
        onClick={() =>
          a.act(async () =>
            setProposal(
              await api("/agenda/proposte-spostamento", {
                id,
                da: from,
                a: to,
              }),
            ),
          )
        }
      >
        Cerca orari compatibili
      </Button>
      {proposal && (
        <>
          <p className="text-sm text-ink-2">
            {proposal.alternative.length} alternative compatibili con
            professionista, pazienti e risorse.{" "}
            {proposal.alternative.length === 0
              ? "Amplia il periodo o modifica le disponibilità."
              : ""}
          </p>
          <RowList
            rows={proposal.alternative.map((s: Data) => ({
              key: s.start,
              title:
                date(s.start) +
                " " +
                s.start.slice(11, 16) +
                "–" +
                s.end.slice(11, 16),
              actions: (
                <Button size="sm" onClick={() => setChosen(s)}>
                  Rivedi spostamento
                </Button>
              ),
            }))}
          />
        </>
      )}
      <ConfirmDialog
        open={Boolean(chosen)}
        title="Confermare lo spostamento?"
        actionLabel="Conferma spostamento"
        busy={a.busy}
        onClose={() => setChosen(null)}
        onConfirm={() =>
          a.act(async () => {
            await api("/agenda/sposta", {
              id,
              start: chosen?.start,
              revision: proposal?.revision,
            });
            nav("/agenda");
          }, "Appuntamento spostato")
        }
      >
        <p>
          Tutti i vincoli vengono ricontrollati al salvataggio. Registra poi il
          contatto telefonico richiesto per comunicare la variazione.
        </p>
      </ConfirmDialog>
    </div>
  );
}
