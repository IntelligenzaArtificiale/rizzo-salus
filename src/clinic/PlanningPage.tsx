import { ProposalSelection } from "./ProposalSelection";
// Proposta di pianificazione e approvazione esplicita sul motore originale.
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { TextField } from "@/components/form/TextField";
import { DetailList, Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { api, type Data } from "./api";
import { LoadState, useLoad, useAction, today, addDays, date } from "./common";
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
  const d = proposal || load.data;
  return (
    <LoadState load={load}>
      <PageHeader
        title="Pianificazione sedute"
        subtitle="Controlla la proposta prima di inserirla in agenda."
        back={{
          to: pid ? `/pazienti/${pid}?scheda=Percorsi` : "/pazienti",
          label: "Percorsi",
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2">
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
          <DetailList
            items={[
              { label: "Dal", value: date(from) },
              { label: "Al", value: date(to) },
            ]}
          />
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
                      a: to,
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
          <Section title="Proposta">
            <p className="text-[14px] leading-relaxed text-ink">
              {d.spiegazione.testo}
            </p>
            <ul className="list-inside list-disc space-y-2 text-[13px] text-ink-2">
              {d.spiegazione.righe.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </Section>
          {d.stato === "proposta" && (
            <ProposalSelection
              key={d.id}
              proposal={d}
              onDone={() => navigate("/agenda")}
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
                      a: to,
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
