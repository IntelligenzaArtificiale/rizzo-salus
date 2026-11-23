import { buttonVariants } from "@/components/atoms/Button";
import { Link } from "react-router-dom";
// Scheda paziente: percorsi al centro, anagrafica e agenda su schede distinte.
import { PatientDocuments } from "./PatientDocuments";
import { PatientAvailability } from "./PatientAvailability";
import { useParams, useSearchParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { PageTabs } from "@/components/app/PageTabs";
import { DetailList, Section } from "@/components/app/Section";
import { StatusPill } from "@/components/atoms/StatusPill";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { LoadState, useLoad, name, date } from "./common";
import { PatientEpisodes, PatientAppointments } from "./PatientCare";
import { PatientInvoices } from "./PatientInvoices";
export function PatientPage() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams();
  const { can } = useClinic();
  const load = useLoad(() => api("/pazienti/dettaglio", { id }), [id]);
  const p = load.data;
  const tab =
    params.get("scheda") || (p?.episodi?.length ? "Percorsi" : "Anagrafica");
  const tabs =
    can("agenda.vedi_tutto") || can("agenda.vedi_propria")
      ? ["Percorsi", "Anagrafica", "Disponibilità", "Documenti", "Appuntamenti"]
      : ["Percorsi", "Anagrafica"];
  if (can("fatture.gestisci")) tabs.push("Fatture");
  return (
    <LoadState load={load}>
      {p && (
        <>
          <PageHeader
            title={name(p)}
            subtitle={p.telefono || undefined}
            back={{ to: "/pazienti", label: "Pazienti" }}
            actions={
              can("pazienti.anagrafica") ? (
                <IconButton
                  label="Modifica paziente"
                  icon={<Pencil size={16} />}
                  to={`/pazienti/${id}/modifica`}
                />
              ) : undefined
            }
          />
          {can("pazienti.anagrafica") && (
            <Link
              to={"/percorsi/nuovo?paziente=" + p.id}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Nuovo percorso
            </Link>
          )}
          {(p.allergie || p.avvertenze) && (
            <Section title="Avvertenze per la cura">
              <p className="whitespace-pre-wrap text-sm font-medium text-red">
                {p.allergie ? "Allergie: " + p.allergie : ""}
                {p.allergie && p.avvertenze ? " · " : ""}
                {p.avvertenze}
              </p>
            </Section>
          )}
          <PageTabs
            options={tabs}
            value={tab}
            onChange={(s) => setParams({ scheda: s })}
            label="Scheda paziente"
          />
          {tab === "Anagrafica" ? (
            <>
              <Section title="Dati personali">
                <DetailList
                  items={[
                    ...("codice_fiscale" in p
                      ? [
                          {
                            label: "Codice fiscale",
                            value: p.codice_fiscale || "—",
                          },
                        ]
                      : []),
                    { label: "Data di nascita", value: date(p.data_nascita) },
                    ...("luogo_nascita" in p
                      ? [
                          {
                            label: "Luogo di nascita",
                            value: p.luogo_nascita || "—",
                          },
                        ]
                      : []),
                    { label: "Sesso", value: p.sesso || "—" },
                    ...("medico_curante" in p
                      ? [
                          {
                            label: "Medico curante",
                            value: p.medico_curante || "—",
                          },
                        ]
                      : []),
                  ]}
                />
              </Section>
              {("telefono" in p || "email" in p) && (
                <Section title="Contatti">
                  <DetailList
                    items={[
                      {
                        label: "Telefono",
                        value: p.telefono ? (
                          <a href={`tel:${p.telefono}`}>{p.telefono}</a>
                        ) : (
                          "—"
                        ),
                      },
                      {
                        label: "Email",
                        value: p.email ? (
                          <a href={`mailto:${p.email}`}>{p.email}</a>
                        ) : (
                          "—"
                        ),
                      },
                      {
                        label: "Canale preferito",
                        value:
                          (
                            {
                              whatsapp: "WhatsApp",
                              email: "Email",
                              sms: "SMS",
                              nessuno: "Nessuno",
                            } as Data
                          )[p.canale_preferito] || "—",
                      },
                      {
                        label: "Indirizzo",
                        value:
                          [p.indirizzo, p.cap, p.citta, p.provincia]
                            .filter(Boolean)
                            .join(" ") || "—",
                      },
                    ]}
                  />
                </Section>
              )}
              {"consensi" in p && (
                <Section title="Consensi">
                  <DetailList
                    items={[
                      ["privacy", "Privacy"],
                      ["whatsapp", "WhatsApp"],
                      ["marketing", "Comunicazioni promozionali"],
                      ["sts_opposizione", "Opposizione Sistema TS"],
                    ].map(([k, label]) => ({
                      label,
                      value: (
                        <span className="flex flex-wrap items-center gap-2">
                          <StatusPill
                            tone={p.consensi?.[k]?.valore ? "green" : "neutral"}
                          >
                            {p.consensi?.[k]?.valore ? "Sì" : "No"}
                          </StatusPill>
                          {p.consensi?.[k]?.data && (
                            <span className="text-[12px] text-ink-3">
                              {date(p.consensi[k].data)}
                            </span>
                          )}
                        </span>
                      ),
                    }))}
                  />
                </Section>
              )}
              {p.anamnesi !== undefined && (
                <Section title="Dati clinici">
                  <DetailList
                    items={[
                      { label: "Anamnesi", value: p.anamnesi || "—" },
                      { label: "Allergie", value: p.allergie || "—" },
                    ]}
                  />
                </Section>
              )}
              {p.note_amministrative && (
                <Section title="Note amministrative">
                  <p className="whitespace-pre-wrap text-[14px] text-ink-2">
                    {p.note_amministrative}
                  </p>
                </Section>
              )}
            </>
          ) : tab === "Fatture" && can("fatture.gestisci") ? <PatientInvoices id={p.id} /> : tab === "Documenti" ? (
            <PatientDocuments patient={p} />
          ) : tab === "Disponibilità" ? (
            <PatientAvailability patient={p} onSaved={load.reload} />
          ) : tab === "Appuntamenti" ? (
            <PatientAppointments patientId={p.id} />
          ) : (
            <PatientEpisodes episodes={p.episodi || []} patientId={p.id} />
          )}
        </>
      )}
    </LoadState>
  );
}
