import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { api, ApiError, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { useLoad, useAction, LoadState, today, name } from "./common";
export function AppointmentFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const day = params.get("giorno") ?? today();
  const load = useLoad(async () => {
    if (!id)
      return {
        start: params.get("inizio") ?? day + "T09:00:00",
        tipo: "terapia",
        professional_id: "",
        therapy_type_id: "",
        patient_id: "",
        resource_id: "",
      };
    const r = await api("/agenda/vista", { da: day, a: day, annullati: true });
    const a = r.appuntamenti.find((a: Data) => a.id === id);
    if (!a) throw new Error("Appuntamento non trovato. Torna all’agenda.");
    return { ...a, start: params.get("inizio") ?? a.start };
  }, [id, day]);
  return (
    <LoadState load={load}>
      {load.data && <AppointmentForm initial={load.data} />}
    </LoadState>
  );
}
function AppointmentForm({ initial }: { initial: Data }) {
  const { catalog } = useClinic();
  const a = useAction(),
    navigate = useNavigate();
  const [v, setV] = useState<Data>(initial),
    [query, setQuery] = useState(""),
    [patient, setPatient] = useState<Data | null>(null),
    [warning, setWarning] = useState<Data | null>(null);
  const patients = useLoad(
    () => api("/pazienti/cerca", { q: query, limite: 50 }),
    [query],
  );
  const details = useLoad(
    () =>
      v.patient_id
        ? api("/pazienti/dettaglio", { id: v.patient_id })
        : Promise.resolve(null),
    [v.patient_id],
  );
  const type = catalog.terapie.find((t: Data) => t.id === v.therapy_type_id);
  const episodes: Data[] = details.data?.episodi ?? [];
  const episode = episodes.find((e) => e.id === v.episode_id);
  const lines = episode?.therapies ?? [];
  const save = async (confirm = false) => {
    try {
      const payload: Data = {
        ...v,
        start: v.start.length === 16 ? v.start + ":00" : v.start,
        resource_id: v.resource_id || null,
        episode_id: v.episode_id || null,
        line_id: v.line_id || null,
        conferma_avvisi: confirm,
      };
      if (!v.id && type?.di_gruppo) {
        payload.tipo = "gruppo";
        payload.participants = [
          {
            patient_id: v.patient_id,
            episode_id: payload.episode_id,
            line_id: payload.line_id,
          },
        ];
      }
      const r = await api(v.id ? "/agenda/sposta" : "/agenda/crea", payload);
      navigate("/agenda/" + r.id + "?giorno=" + r.start.slice(0, 10));
    } catch (e) {
      if (e instanceof ApiError && e.code === "avvisi") setWarning(e.payload);
      else throw e;
    }
  };
  return (
    <>
      <PageHeader
        title={v.id ? "Sposta appuntamento" : "Nuovo appuntamento"}
        back={{ to: "/agenda", label: "Agenda" }}
      />
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          a.act(() => save());
        }}
      >
        <Section title="Orario e professionista">
          <TextField
            label="Data e ora"
            type="datetime-local"
            value={v.start.slice(0, 16)}
            onChange={(start) => setV({ ...v, start })}
          />
          <SelectField
            label="Professionista"
            value={v.professional_id}
            onChange={(professional_id) => setV({ ...v, professional_id })}
            options={[
              { value: "", label: "Scegli professionista" },
              ...catalog.professionisti
                .filter(
                  (p: Data) =>
                    p.attivo && ["medico", "fisioterapista"].includes(p.tipo),
                )
                .map((p: Data) => ({ value: p.id, label: name(p) })),
            ]}
          />
        </Section>
        {!v.id && (
          <>
            <SelectField
              label="Tipo appuntamento"
              value={v.tipo}
              onChange={(tipo) =>
                setV({
                  ...v,
                  tipo,
                  therapy_type_id: "",
                  episode_id: "",
                  line_id: "",
                })
              }
              options={[
                { value: "terapia", label: "Terapia individuale o di gruppo" },
                { value: "visita", label: "Visita medica" },
                { value: "nota", label: "Nota in agenda" },
              ]}
            />
            {v.tipo === "nota" ? (
              <TextField
                label="Titolo nota"
                value={v.titolo ?? ""}
                onChange={(titolo) => setV({ ...v, titolo })}
              />
            ) : (
              <>
                <SelectField
                  label="Prestazione"
                  value={v.therapy_type_id}
                  onChange={(therapy_type_id) =>
                    setV({ ...v, therapy_type_id, episode_id: "", line_id: "" })
                  }
                  options={[
                    { value: "", label: "Scegli prestazione" },
                    ...catalog.terapie
                      .filter(
                        (t: Data) =>
                          t.attivo &&
                          (v.tipo === "visita") === (t.categoria === "visita"),
                      )
                      .map((t: Data) => ({
                        value: t.id,
                        label:
                          t.nome + (t.di_gruppo ? " · gruppo massimo 6" : ""),
                      })),
                  ]}
                />
                <TextField
                  label="Cerca paziente"
                  value={query}
                  onChange={setQuery}
                />
                <SelectField
                  label="Paziente"
                  value={v.patient_id ?? ""}
                  onChange={(patient_id) => {
                    setV({ ...v, patient_id, episode_id: "", line_id: "" });
                    setPatient(
                      patients.data?.risultati.find(
                        (p: Data) => p.id === patient_id,
                      ) ?? null,
                    );
                  }}
                  options={[
                    { value: "", label: "Scegli paziente" },
                    ...(patients.data?.risultati ?? []).map((p: Data) => ({
                      value: p.id,
                      label: name(p),
                    })),
                    ...(patient &&
                    !patients.data?.risultati.some(
                      (p: Data) => p.id === patient.id,
                    )
                      ? [{ value: patient.id, label: name(patient) }]
                      : []),
                  ]}
                />
                {v.tipo === "terapia" && (
                  <>
                    <SelectField
                      label="Percorso"
                      value={v.episode_id ?? ""}
                      onChange={(episode_id) =>
                        setV({ ...v, episode_id, line_id: "" })
                      }
                      options={[
                        { value: "", label: "Senza percorso" },
                        ...episodes
                          .filter((e) => e.stato === "aperto")
                          .map((e) => ({ value: e.id, label: e.titolo })),
                      ]}
                    />
                    {v.episode_id && (
                      <SelectField
                        label="Riga prescritta"
                        value={v.line_id ?? ""}
                        onChange={(line_id) => setV({ ...v, line_id })}
                        options={[
                          { value: "", label: "Scegli riga terapia" },
                          ...lines
                            .filter(
                              (l: Data) =>
                                l.therapy_type_id === v.therapy_type_id,
                            )
                            .map((l: Data) => ({
                              value: l.line_id,
                              label:
                                (type?.nome ?? "Terapia") +
                                " · " +
                                l.sedute_previste +
                                " prescritte",
                            })),
                        ]}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
        <p className="text-sm text-ink-2">
          Il salvataggio controlla sovrapposizioni, capienza, risorse e
          disponibilità. Le variazioni vengono preparate per il contatto della
          segreteria.
        </p>
        <Button
          variant="primary"
          type="submit"
          disabled={
            a.busy ||
            (!v.id &&
              v.tipo !== "nota" &&
              (!v.patient_id || !v.therapy_type_id))
          }
        >
          Verifica e salva
        </Button>
      </form>
      <ConfirmDialog
        open={Boolean(warning)}
        title="Controlla gli avvisi"
        actionLabel="Conferma eccezione e salva"
        busy={a.busy}
        onClose={() => setWarning(null)}
        onConfirm={() => a.act(() => save(true))}
      >
        <ul className="list-inside list-disc">
          {(warning?.avvisi ?? []).map((w: Data, i: number) => (
            <li key={i}>{String(w.codice).replaceAll("_", " ")}</li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
