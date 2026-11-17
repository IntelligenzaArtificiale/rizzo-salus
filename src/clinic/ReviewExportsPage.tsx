import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { api, download } from "./api";
import { useClinic } from "./ClinicContext";
import { useAction, useLoad, LoadState, today, date } from "./common";
export function ReviewExportsPage() {
  const navigate = useNavigate(), form = useLocation().pathname.endsWith("/nuovo");
  const { can } = useClinic();
  const [type, setType] = useState(
      can("fatture.gestisci") ? "commercialista" : "personale",
    ),
    [from, setFrom] = useState(today().slice(0, 7) + "-01"),
    [to, setTo] = useState(today());
  const a = useAction();
  const load = useLoad(() => api("/pacchetti/elenco"));
  return (
    <LoadState load={load}>
      <PageHeader
        title={form ? "Prepara documenti" : "Documenti per i consulenti"}
        back={form ? { to: "/pacchetti", label: "Documenti consulenti" } : undefined}
        actions={!form ? <Button onClick={() => navigate("/pacchetti/nuovo")}>Prepara documenti</Button> : undefined}
        subtitle="Prepara, scarica e verifica i documenti prima di approvare l’invio."
      />
      {form && <Section title="Prepara pacchetto">
        <SelectField
          label="Destinazione"
          value={type}
          onChange={setType}
          options={[
            ...(can("fatture.gestisci")
              ? [
                  {
                    value: "commercialista",
                    label: "Commercialista · PDF, archivio e riepilogo",
                  },
                  {
                    value: "sts",
                    label: "Sistema TS · tracciato cifrato da verificare",
                  },
                ]
              : []),
            ...(can("personale.presenze")
              ? [
                  {
                    value: "personale",
                    label: "Consulente lavoro · presenze mensili",
                  },
                ]
              : []),
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Dal" type="date" value={from} onChange={setFrom} />
          <TextField label="Al" type="date" value={to} onChange={setTo} />
        </div>
        <Button
          disabled={a.busy}
          onClick={() =>
            a.act(async () => {
              await api("/pacchetti/prepara", { tipo: type, da: from, a: to });
              load.reload(); navigate("/pacchetti");
            }, "Pacchetto preparato per la revisione")
          }
        >
          Prepara documenti
        </Button>
      </Section>}
      {!form && <Section title="Pacchetti e approvazioni">
        <RowList
          rows={(load.data?.pacchetti ?? []).map((r: any) => ({
            key: r.id,
            title: r.tipo + " · " + date(r.da) + " – " + date(r.a),
            meta:
              r.conteggio +
              " documenti · " +
              (r.destinatario || "Destinatario da configurare"),
            actions: (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  tone={r.stato === "da_approvare" ? "orange" : "green"}
                >
                  {r.stato.replaceAll("_", " ")}
                </StatusPill>
                <Button
                  onClick={() =>
                    a.act(() => download("/pacchetti/scarica", { id: r.id }))
                  }
                >
                  Scarica per revisione
                </Button>
                {r.stato === "da_approvare" && (
                  <Button
                    disabled={a.busy || !r.destinatario}
                    onClick={() =>
                      a.act(async () => {
                        await api("/pacchetti/approva", { id: r.id });
                        load.reload(); navigate("/pacchetti");
                      }, "Invio approvato e accodato. Verifica l’esito nelle comunicazioni.")
                    }
                  >
                    Ho verificato: approva invio
                  </Button>
                )}
                {r.esito?.protocollo && (
                  <Button
                    onClick={() =>
                      a.act(async () => {
                        await api("/pacchetti/esitoSts", { id: r.id });
                        load.reload(); navigate("/pacchetti");
                      })
                    }
                  >
                    Consulta esito TS
                  </Button>
                )}
                {r.elaborazione && (
                  <span className="text-xs text-ink-2">
                    {r.elaborazione.accolti} accolti · {r.elaborazione.errori}{" "}
                    errori
                  </span>
                )}
              </div>
            ),
          }))}
        />
        <p className="text-sm text-ink-2">
          La preparazione non invia documenti. Il canale email deve supportare
          gli allegati ed essere configurato dal titolare. L’invio TS usa il
          tracciato ufficiale cifrato: occorre prima configurare il profilo,
          verificare i codici prestazione e completare le prove in ambiente TS.
          Un protocollo di accoglienza non equivale all’esito finale di tutte le
          spese.
        </p>
      </Section>}
    </LoadState>
  );
}
