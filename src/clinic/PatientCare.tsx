import { buttonVariants } from "@/components/atoms/Button";
import { regionLabel } from "./anatomical-regions";
import { EpisodeDiary } from "./EpisodeDiary";
import { useState } from "react";
import { PageTabs } from "@/components/app/PageTabs";
// Avanzamento e appuntamenti della scheda, composti con componenti del boilerplate.
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { Section } from "@/components/app/Section";
import { PrimaryAction } from "@/components/app/IconButton";
import { ProgressRing } from "@/components/atoms/ProgressRing";
import { EmptyState, PageLoading, PageError } from "@/components/app/PageState";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { StatePill, useLoad, today, date } from "./common";
import { AppointmentList } from "./AppointmentList";
export function PatientEpisodes({
  episodes,
  patientId,
}: {
  episodes: Data[];
  patientId: string;
}) {
  const { catalog, can } = useClinic();
  if (!episodes.length)
    return (
      <EmptyState
        title="Nessun percorso di cura"
        description="I percorsi del paziente saranno consultabili in questa scheda."
      />
    );
  return (
    <>
      {episodes.map((e) => (
        <Section
          key={e.id}
          title={e.titolo}
          aside={<StatePill value={e.stato} />}
        >
          {can("pazienti.anagrafica") && (
            <Link
              to={"/percorsi/" + e.id}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Modifica percorso
            </Link>
          )}
          {!!e.distretti?.length && <p className="text-sm text-ink-2">Distretti: {e.distretti.map(regionLabel).join(" · ")}</p>}
          {e.diagnosi && <p className="text-[14px] text-ink-2">{e.diagnosi}</p>}
          <div className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card">
            {(e.avanzamento || []).map((line: Data) => {
              const total = line.sedute_previste || 0;
              return (
                <div
                  key={line.line_id || line.id || line.therapy_type_id}
                  className="flex items-center gap-4 p-4"
                >
                  <span
                    className="shrink-0 text-ink"
                    role="img"
                    aria-label={`${line.eseguite} sedute eseguite su ${total}`}
                  >
                    <ProgressRing
                      size={40}
                      tone={line.eseguite === total ? "green" : "accent"}
                      progress={total ? line.eseguite / total : 0}
                    >
                      {line.eseguite}/{total}
                    </ProgressRing>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">
                      {catalog.terapie.find(
                        (t: Data) => t.id === line.therapy_type_id,
                      )?.nome || "Terapia"}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                      {line.da_eseguire ?? Math.max(0, total - line.eseguite)}{" "}
                      da eseguire · {line.assenti} assenze · {line.programmate}{" "}
                      in agenda · {line.residue} da pianificare
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <EpisodeDiary key={e.id} episode={e} />
          {can("ai.pianificazione") &&
            e.avanzamento?.some((l: Data) => l.residue > 0) && (
              <div>
                <PrimaryAction
                  label="Pianifica sedute"
                  icon={<CalendarDays size={16} />}
                  to={`/pianificazione/nuova?episodio=${e.id}&paziente=${patientId}`}
                />
              </div>
            )}
        </Section>
      ))}
    </>
  );
}
export function PatientAppointments({ patientId }: { patientId: string }) {
  const [view, setView] = useState("Prossimi");
  const from = today();
  const load = useLoad(async () => {
    const d = await api("/pazienti/appuntamenti", { id: patientId });
    return d.appuntamenti.filter((a: Data) =>
      view === "Storico"
        ? a.start.slice(0, 10) < from
        : a.start.slice(0, 10) >= from,
    );
  }, [patientId, from, view]);
  if (load.loading && !load.data) return <PageLoading />;
  if (load.error)
    return <PageError message={load.error} onRetry={load.reload} />;
  return (
    <Section title="Appuntamenti e storico">
      <PageTabs
        label="Periodo appuntamenti"
        options={["Prossimi", "Storico"]}
        value={view}
        onChange={setView}
      />
      <p className="text-[13px] text-ink-2">
        {view === "Storico" ? "Appuntamenti precedenti a " : "Appuntamenti da "}
        {date(from)}
      </p>
      {load.data?.length ? (
        <AppointmentList
          items={load.data}
          patientId={patientId}
          patientContext
          showDate
          onChanged={load.reload}
        />
      ) : (
        <EmptyState
          title="Nessun appuntamento in questo periodo"
          description="Le sedute approvate dal pianificatore compariranno qui."
        />
      )}
    </Section>
  );
}
