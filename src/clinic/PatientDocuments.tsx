import { useState } from "react";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { StatusPill } from "@/components/atoms/StatusPill";
import { EmptyState } from "@/components/app/PageState";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { ClinicFileField } from "./ClinicFileField";
import { useClinic } from "./ClinicContext";
import { api, download, type Data } from "./api";
import { useLoad, useAction } from "./common";
export function PatientDocuments({ patient }: { patient: Data }) {
  const { can } = useClinic();
  const load = useLoad(() =>
    api("/documenti/elenco", { patient_id: patient.id }),
  );
  const templates = useLoad(() => api("/documenti/modelli"));
  const [v, setV] = useState<Data>({
      titolo: "",
      tipo: "altro",
      episode_id: "",
      clinico: false,
      condiviso: false,
      firmato_cartaceo: false,
    }),
    [link, setLink] = useState("");
  const preview = useLoad(async () => {
    if (!v.modello_id || !can("pazienti.anagrafica")) return null;
    return api("/documenti/anteprima-modello", { patient_id:patient.id, modello_id:v.modello_id });
  }, [v.modello_id, patient.id, can("pazienti.anagrafica")]);
  const a = useAction();
  return (
    <>
      <Section
        title="Archivio documenti"
        aside={
          <StatusPill
            tone={load.data?.rilascio_consentito ? "green" : "orange"}
          >
            {load.data?.rilascio_consentito
              ? "Consensi completi"
              : "Consensi da completare"}
          </StatusPill>
        }
      >
        <p className="text-[13px] text-ink-2">
          Il rilascio del calendario richiede privacy e consenso al trattamento
          documentati. Le spunte anagrafiche da sole non sostituiscono i
          documenti.
        </p>
        {load.error && (
          <p role="alert" className="text-red">
            {load.error}
          </p>
        )}
        {load.data?.documenti.length ? (
          <RowList
            rows={load.data.documenti.map((d: Data) => ({
              key: d.id,
              title: d.titolo,
              meta:
                (d.episode_id
                  ? "Documento del percorso"
                  : "Documento del paziente") +
                " · " +
                d.tipo,
              actions: (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    tone={d.stato === "firmato" ? "green" : "neutral"}
                  >
                    {d.stato === "firmato"
                      ? "Firmato"
                      : d.stato === "da_firmare"
                        ? "Da firmare"
                        : "Archiviato"}
                  </StatusPill>
                  <Button
                    size="sm"
                    onClick={() =>
                      a.act(() => download("/documenti/scarica", { id: d.id }))
                    }
                  >
                    Scarica
                  </Button>
                  {d.stato === "da_firmare" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        a.act(async () => {
                          const r = await api("/documenti/link", { id: d.id });
                          setLink(location.origin + r.percorso);
                        })
                      }
                    >
                      Apri firma
                    </Button>
                  )}
                </div>
              ),
            }))}
          />
        ) : (
          <EmptyState
            title="Nessun documento"
            description="Carica i documenti del paziente oppure genera una copia da un modello."
          />
        )}
        {link && (
          <div className="rounded-card border border-line p-4">
            <a
              className={buttonVariants({ variant: "secondary", size: "sm" })}
              href={link}
              target="_blank"
              rel="noreferrer"
            >
              Apri pagina di lettura e accettazione
            </a>
            <TextField
              label="Link personale da consegnare al paziente"
              value={link}
              readOnly
              onChange={() => {}}
            />
          </div>
        )}
      </Section>
      {can("documenti.moduli") && (
        <Section title="Aggiungi documento">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              a.act(async () => {
                await api("/documenti/salva", {
                  ...v,
                  patient_id: patient.id,
                  episode_id: v.episode_id || null,
                });
                load.reload();
              }, "Documento archiviato");
            }}
          >
            <TextField
              label="Titolo"
              value={v.titolo}
              onChange={(titolo) => setV({ ...v, titolo })}
            />
            <SelectField
              label="Collega a"
              value={v.episode_id}
              onChange={(episode_id) => setV({ ...v, episode_id })}
              options={[
                { value: "", label: "Documenti generali del paziente" },
                ...(patient.episodi ?? []).map((e: Data) => ({
                  value: e.id,
                  label: e.titolo,
                })),
              ]}
            />
            <SelectField
              label="Genera da modello"
              value={v.modello_id ?? ""}
              onChange={(modello_id) => {
                const t = templates.data?.modelli.find(
                  (x: Data) => x.id === modello_id,
                );
                setV({
                  ...v,
                  modello_id,
                  tipo: t?.tipo ?? "altro",
                  titolo: t?.nome ?? v.titolo,
                });
              }}
              options={[
                { value: "", label: "Carica allegato o scrivi referto" },
                ...(templates.data?.modelli ?? [])
                  .filter((t: Data) => t.attivo)
                  .map((t: Data) => ({ value: t.id, label: t.nome })),
              ]}
            />
            {v.modello_id && can("pazienti.anagrafica") && <Section title="Anteprima del modulo">
              {preview.loading ? <p role="status">Preparazione del modulo…</p> : preview.error ? <p role="alert">{preview.error}</p> : <p className="whitespace-pre-wrap rounded-card border border-line p-4 text-sm">{preview.data?.contenuto}</p>}
            </Section>}
            {can("documenti.referti_crea") && (
              <Button
                type="button"
                disabled={!v.episode_id || a.busy}
                onClick={() =>
                  a.act(async () => {
                    const draft = await api("/documenti/bozza", {
                      episode_id: v.episode_id,
                    });
                    setV({ ...v, ...draft, modello_id: "", base64: null });
                  }, "Bozza locale pronta: completa e verifica il testo prima di archiviare")
                }
              >
                Prepara bozza dai dati del percorso
              </Button>
            )}
            {!v.modello_id && (
              <>
                <SelectField
                  label="Tipo documento"
                  value={v.tipo}
                  onChange={(tipo) => setV({ ...v, tipo })}
                  options={[
                    "altro",
                    "privacy",
                    "trattamento",
                    "marketing",
                    "whatsapp",
                    ...(can("documenti.referti_crea") ? ["referto"] : []),
                  ].map((t) => ({ value: t, label: t }))}
                />
                <ClinicFileField
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(file) => setV({ ...v, ...file })}
                />
                {can("documenti.referti_crea") && (
                  <TextAreaField
                    label="Testo del referto"
                    value={v.contenuto ?? ""}
                    onChange={(contenuto) =>
                      setV({ ...v, contenuto, tipo: "referto", clinico: true })
                    }
                  />
                )}
                <Checkbox
                  label="Consenso cartaceo già firmato dal paziente"
                  checked={v.firmato_cartaceo}
                  onChange={(firmato_cartaceo) =>
                    setV({ ...v, firmato_cartaceo })
                  }
                />
              </>
            )}
            {can("pazienti.clinica") && (
              <Checkbox
                label="Allegato clinico riservato"
                checked={v.clinico}
                onChange={(clinico) => setV({ ...v, clinico })}
              />
            )}
            <Checkbox
              label="Condividi nel portale del paziente"
              checked={v.condiviso}
              onChange={(condiviso) => setV({ ...v, condiviso })}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={
                a.busy ||
                !v.titolo ||
                (!v.base64 && !v.modello_id && !v.contenuto)
              }
            >
              Archivia documento
            </Button>
          </form>
        </Section>
      )}
    </>
  );
}
