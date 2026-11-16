import { useState } from "react";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { SelectField } from "@/components/form/SelectField";
import { TextField } from "@/components/form/TextField";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { useLoad, useAction, name } from "./common";
export function GroupParticipants({
  appointment,
  onSaved,
}: {
  appointment: Data;
  onSaved: () => void;
}) {
  const { can } = useClinic();
  const [q, setQ] = useState(""),
    [pid, setPid] = useState(""),
    [line, setLine] = useState("");
  const load = useLoad(() => api("/pazienti/cerca", { q, limite: 50 }), [q]);
  const patient = useLoad(
    () =>
      pid ? api("/pazienti/dettaglio", { id: pid }) : Promise.resolve(null),
    [pid],
  );
  const a = useAction();
  const lines: Data[] = (patient.data?.episodi ?? [])
    .filter((e: Data) => e.stato === "aperto")
    .flatMap((e: Data) =>
      e.therapies
        .filter((l: Data) => l.therapy_type_id === appointment.therapy_type_id)
        .map((l: Data) => ({ ...l, episode_id: e.id, titolo: e.titolo })),
    );
  return (
    <Section
      title={
        "Partecipanti · " +
        (appointment.participants ?? []).length +
        " / " +
        Math.min(6, appointment.capienza ?? 6)
      }
    >
      <RowList
        rows={(appointment.participants ?? []).map((p: Data) => ({
          key: p.patient_id,
          title: appointment.pazienti_nomi?.[p.patient_id] ?? "Paziente",
          actions: (
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={p.stato === "eseguito" ? "green" : "neutral"}>
                {p.stato}
              </StatusPill>
              {can("agenda.modifica") && (
                <>
                  {["eseguito", "assente"].map((stato) => (
                    <Button
                      key={stato}
                      onClick={() =>
                        a.act(async () => {
                          await api("/agenda/stato", {
                            id: appointment.id,
                            patient_id: p.patient_id,
                            stato,
                          });
                          onSaved();
                        })
                      }
                    >
                      {stato === "eseguito" ? "Eseguita" : "Assente"}
                    </Button>
                  ))}
                  <Button
                    variant="quiet"
                    onClick={() =>
                      a.act(async () => {
                        await api("/agenda/annulla", {
                          id: appointment.id,
                          patient_id: p.patient_id,
                        });
                        onSaved();
                      })
                    }
                  >
                    Rimuovi dal gruppo
                  </Button>
                </>
              )}
            </div>
          ),
        }))}
      />
      {can("agenda.modifica") && (
        <>
          <TextField
            label="Cerca paziente da aggiungere"
            value={q}
            onChange={setQ}
          />
          <SelectField
            label="Paziente da aggiungere"
            value={pid}
            onChange={(v) => {
              setPid(v);
              setLine("");
            }}
            options={[
              { value: "", label: "Scegli paziente" },
              ...(load.data?.risultati ?? [])
                .filter(
                  (p: Data) =>
                    !appointment.participants?.some(
                      (x: Data) => x.patient_id === p.id,
                    ),
                )
                .map((p: Data) => ({ value: p.id, label: name(p) })),
            ]}
          />
          <SelectField
            label="Percorso e terapia"
            value={line}
            onChange={setLine}
            options={[
              { value: "", label: "Scegli riga prescritta" },
              ...lines.map((l) => ({
                value: l.line_id,
                label: l.titolo + " · " + l.sedute_previste + " prescritte",
              })),
            ]}
          />
          <Button
            disabled={!pid || !line || a.busy}
            onClick={() =>
              a.act(async () => {
                const l = lines.find((x) => x.line_id === line);
                await api("/agenda/gruppo-aggiungi", {
                  id: appointment.id,
                  partecipante: {
                    patient_id: pid,
                    episode_id: l?.episode_id,
                    line_id: line,
                  },
                });
                setPid("");
                onSaved();
              }, "Partecipante aggiunto")
            }
          >
            Verifica e aggiungi al gruppo
          </Button>
        </>
      )}
    </Section>
  );
}
