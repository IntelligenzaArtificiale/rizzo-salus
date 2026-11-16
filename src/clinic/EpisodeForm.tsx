import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { Button } from "@/components/atoms/Button";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { useLoad, useAction, LoadState, today, name } from "./common";
import { AvailabilityFields } from "./PatientAvailability";
export function EpisodeFormPage() {
  const { id } = useParams();
  const [p] = useSearchParams();
  const load = useLoad(
    () =>
      id && id !== "nuovo"
        ? api("/percorsi/dettaglio", { id })
        : Promise.resolve({
            patient_id: p.get("paziente"),
            titolo: "",
            data_inizio: today(),
            therapies: [],
            availability: [],
            vincoli: {
              max_al_giorno: 2,
              sedute_contigue: true,
              no_giorni_consecutivi: false,
            },
          }),
    [id],
  );
  return (
    <LoadState load={load}>
      {load.data && <EpisodeForm initial={load.data} />}
    </LoadState>
  );
}
function EpisodeForm({ initial }: { initial: Data }) {
  const { catalog, can } = useClinic(),
    a = useAction(),
    navigate = useNavigate();
  const [v, setV] = useState<Data>(structuredClone(initial));
  const lines: Data[] = v.therapies;
  const patch = (i: number, p: Data) =>
    setV({
      ...v,
      therapies: lines.map((l, j) => (i === j ? { ...l, ...p } : l)),
    });
  return (
    <>
      <PageHeader
        title={v.id ? "Modifica percorso" : "Nuovo percorso"}
        back={{ label: "Paziente", to: "/pazienti/" + v.patient_id }}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.act(async () => {
            await api("/percorsi/salva", {
              ...v,
              terapie: lines,
              disponibilita: v.availability,
            });
            navigate("/pazienti/" + v.patient_id);
          }, "Percorso salvato");
        }}
        className="flex flex-col gap-6"
      >
        <Section title="Percorso di cura">
          <TextField
            label="Titolo"
            value={v.titolo}
            onChange={(titolo) => setV({ ...v, titolo })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Data inizio"
              type="date"
              value={v.data_inizio}
              onChange={(data_inizio) => setV({ ...v, data_inizio })}
            />
            <TextField
              label="Fine prevista"
              type="date"
              value={v.data_fine_prevista ?? ""}
              onChange={(data_fine_prevista) =>
                setV({ ...v, data_fine_prevista: data_fine_prevista || null })
              }
            />
          </div>
          <SelectField
            label="Prescrittore"
            value={v.prescrittore_id ?? ""}
            onChange={(prescrittore_id) =>
              setV({ ...v, prescrittore_id: prescrittore_id || null })
            }
            options={[
              { value: "", label: "Non indicato" },
              ...catalog.professionisti.map((p: Data) => ({
                value: p.id,
                label: name(p),
              })),
            ]}
          />
          {can("pazienti.clinica") && (
            <TextAreaField
              label="Diagnosi"
              value={v.diagnosi ?? ""}
              onChange={(diagnosi) => setV({ ...v, diagnosi })}
            />
          )}{" "}
          {can("pazienti.note_terapeutiche") && (
            <TextAreaField
              label="Note terapeutiche"
              value={v.note_terapeutiche ?? ""}
              onChange={(note_terapeutiche) =>
                setV({ ...v, note_terapeutiche })
              }
            />
          )}
        </Section>
        <SelectField
          label="Profilo organizzativo del gruppo"
          value={v.profilo_gruppo || "standard"}
          onChange={(profilo_gruppo) => setV({ ...v, profilo_gruppo })}
          options={[
            { value: "standard", label: "Standard" },
            { value: "complesso", label: "Particolarmente complesso" },
            { value: "neurologico", label: "Neurologico" },
          ]}
        />
        <Section title="Terapie prescritte">
          <p className="text-sm text-ink-2">
            Il ciclo si completa contando le sedute eseguite. Le assenze non
            consumano sedute.
          </p>
          {lines.map((l, i) => (
            <div
              key={l.line_id ?? i}
              className="rounded-card border border-line p-4"
            >
              <SelectField
                label="Prestazione"
                value={l.therapy_type_id}
                onChange={(therapy_type_id) => patch(i, { therapy_type_id })}
                options={[
                  { value: "", label: "Scegli terapia" },
                  ...catalog.terapie
                    .filter((t: Data) => t.attivo && t.categoria !== "visita")
                    .map((t: Data) => ({ value: t.id, label: t.nome })),
                ]}
              />
              <div className="grid gap-x-4 sm:grid-cols-2">
                {[
                  ["sedute_previste", "Sedute prescritte"],
                  ["frequenza_min", "Minimo settimanale"],
                  ["frequenza_max", "Massimo settimanale"],
                  ["intervallo_min_giorni", "Intervallo minimo in giorni"],
                  ["followup_giorni", "Ricontatto dopo giorni"],
                ].map(([k, label]) => (
                  <TextField
                    key={k}
                    label={label}
                    type="number"
                    min={k === "intervallo_min_giorni" ? 0 : 1}
                    value={String(l[k] ?? "")}
                    onChange={(s) => patch(i, { [k]: s ? Number(s) : null })}
                  />
                ))}
              </div>
              <SelectField
                label="Professionista preferito"
                value={l.professional_preferito_id ?? ""}
                onChange={(professional_preferito_id) =>
                  patch(i, {
                    professional_preferito_id:
                      professional_preferito_id || null,
                  })
                }
                options={[
                  { value: "", label: "Qualsiasi professionista abilitato" },
                  ...catalog.professionisti.map((p: Data) => ({
                    value: p.id,
                    label: name(p),
                  })),
                ]}
              />
              <Checkbox
                label="Questo fisioterapista è un vincolo obbligatorio"
                checked={Boolean(l.vincolo_professionista)}
                onChange={(vincolo_professionista) =>
                  patch(i, { vincolo_professionista })
                }
              />
              {!l.line_id && (
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() =>
                    setV({ ...v, therapies: lines.filter((_, j) => i !== j) })
                  }
                >
                  Rimuovi terapia
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            onClick={() =>
              setV({
                ...v,
                therapies: [
                  ...lines,
                  {
                    therapy_type_id: "",
                    sedute_previste: 10,
                    frequenza_min: 1,
                    frequenza_max: 3,
                    intervallo_min_giorni: 0,
                    followup_giorni: 15,
                  },
                ],
              })
            }
          >
            Aggiungi terapia
          </Button>
        </Section>
        <Section title="Vincoli e disponibilità">
          <p className="text-sm text-ink-2">
            Lascia le fasce vuote per utilizzare le disponibilità anagrafiche.
          </p>
          <AvailabilityFields
            value={v.availability}
            onChange={(availability) => setV({ ...v, availability })}
          />
          <TextField
            label="Massimo sedute al giorno"
            type="number"
            min={1}
            max={10}
            value={String(v.vincoli?.max_al_giorno ?? 2)}
            onChange={(s) =>
              setV({
                ...v,
                vincoli: { ...v.vincoli, max_al_giorno: Number(s) },
              })
            }
          />
          <Checkbox
            label="Preferisci sedute contigue"
            checked={v.vincoli?.sedute_contigue ?? true}
            onChange={(sedute_contigue) =>
              setV({ ...v, vincoli: { ...v.vincoli, sedute_contigue } })
            }
          />
          <Checkbox
            label="Evita giorni consecutivi"
            checked={v.vincoli?.no_giorni_consecutivi ?? false}
            onChange={(no_giorni_consecutivi) =>
              setV({ ...v, vincoli: { ...v.vincoli, no_giorni_consecutivi } })
            }
          />
        </Section>
        <Button
          variant="primary"
          type="submit"
          disabled={
            a.busy ||
            !v.titolo ||
            !lines.length ||
            lines.some((l) => !l.therapy_type_id)
          }
        >
          Salva percorso
        </Button>
      </form>
    </>
  );
}
