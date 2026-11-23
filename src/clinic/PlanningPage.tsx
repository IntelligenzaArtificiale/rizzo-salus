import { ProposalSelection } from "./ProposalSelection";
// Proposta di pianificazione e approvazione esplicita sul motore originale.
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { SelectField } from "@/components/form/SelectField";
import { TextField } from "@/components/form/TextField";
import { CollapsiblePanel } from "@/components/app/CollapsiblePanel";
import { Button } from "@/components/atoms/Button";
import { api, type Data } from "./api";
import { LoadState, useLoad, useAction, today, addDays, monday } from "./common";
export function PlanningPage() {
  const { id } = useParams(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    a = useAction();
  const pid = params.get("paziente"),
    episode = params.get("episodio");
  // Generazione solo su azione esplicita: gli effetti React non creano due proposte.
  const [proposal, setProposal] = useState<Data | null>(null);
  const load = useLoad(
    async () =>
      id && id !== "nuova" ? api("/pianificazione/proposta", { id }) : null,
    [id],
  );
  const [from, setFrom] = useState(today()),
    [to, setTo] = useState(addDays(today(), 56));
  const [priority, setPriority] = useState("paziente");
  const d = proposal || load.data;
  return (
    <LoadState load={load} wide>
      <PageHeader
        title="Pianificazione sedute"
        subtitle="Controlla la proposta prima di inserirla in agenda."
        back={{
          to: pid ? `/pazienti/${pid}?scheda=Percorsi` : "/pazienti",
          label: "Percorsi",
        }}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField label="Priorità proposta" value={priority} onChange={setPriority} options={[{value:"paziente",label:"Preferenze del paziente"},{value:"continuita",label:"Ravvicina gli impegni del professionista"}]} />
        <TextField
          label="Pianifica dal"
          type="date"
          value={from}
          onChange={setFrom}
        />
        <TextField
          label="Pianifica fino al"
          type="date"
          value={to}
          onChange={setTo}
        />
      </div>
      {!d ? (
        <>
          <div>
            <Button
              variant="primary"
              disabled={a.busy || !episode}
              onClick={() =>
                a.act(async () =>
                  setProposal(
                    await api("/pianificazione/proponi", {
                      episodi: [episode],
                      da: from,
                      a: to, priorita: priority,
                    }),
                  ),
                )
              }
            >
              {a.busy ? "Calcolo della proposta" : "Genera proposta"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <CollapsiblePanel title="Dettagli del calcolo" description={d.riepilogo.sedute_nuove+" sedute proposte · "+d.riepilogo.non_pianificate+" da riprogrammare"}>
            <p className="text-[14px] leading-relaxed text-ink">
              {d.spiegazione.testo}
            </p>
            <ul className="list-inside list-disc space-y-2 text-[13px] text-ink-2">
              {d.spiegazione.righe.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </CollapsiblePanel>
          {d.stato === "proposta" && (
            <ProposalSelection
              key={d.id}
              proposal={d}
              onDone={day => navigate("/agenda?giorno="+day+"&settimana="+monday(day)+"&vista=Giorno")}
            />
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              disabled={a.busy}
              onClick={() =>
                a.act(async () => {
                  await api("/pianificazione/scarta", { id: d.id });
                  navigate(
                    pid ? `/pazienti/${pid}?scheda=Percorsi` : "/pazienti",
                  );
                })
              }
            >
              Scarta proposta
            </Button>
            <Button
              disabled={a.busy}
              onClick={() =>
                a.act(async () =>
                  setProposal(
                    await api("/pianificazione/proponi", {
                      episodi: d.episodi,
                      da: from,
                      a: to, priorita: priority,
                    }),
                  ),
                )
              }
            >
              Rigenera per il periodo selezionato
            </Button>
          </div>
        </>
      )}
    </LoadState>
  );
}
