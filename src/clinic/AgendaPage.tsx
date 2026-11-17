import { CollapsiblePanel } from "@/components/app/CollapsiblePanel";
// Tre viste della stessa agenda. Su telefono parte dalla giornata, con esiti rapidi.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PageTabs } from "@/components/app/PageTabs";
import { IconButton, PrimaryAction } from "@/components/app/IconButton";
import { EmptyState } from "@/components/app/PageState";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/form/Checkbox";
import { SelectField } from "@/components/form/SelectField";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import {
  LoadState,
  useLoad,
  today,
  monday,
  addDays,
  date,
  name,
} from "./common";
import { CalendarWeek } from "./CalendarWeek";
import { AppointmentList } from "./AppointmentList";
import { AgendaNotes, CycleAlertsPanel } from "./AgendaNotes";
import { endedWithoutOutcome } from "./schedule";
export function AgendaPage() {
  const { catalog, can, user } = useClinic();
  const [calendarTools, setCalendarTools] = useState<HTMLDivElement | null>(null);
  const [params, setParams] = useSearchParams();
  const [compact] = useState(() => matchMedia("(max-width:767px)").matches);
  const view = params.get("vista") || (compact ? "Giorno" : "Settimana");
  const week =
    params.get("settimana") || monday(params.get("giorno") || today());
  const requested = params.get("giorno") || today();
  const day = monday(requested) === week ? requested : week;
  const area = params.get("area") || "Fisioterapia",
    grouping =
      params.get("raggruppa") ||
      (view === "Giorno" ? "prestazione" : "categoria"),
    family = params.get("famiglia") || "",
    therapy = params.get("terapia") || "";
  const settings = useLoad(() => api("/impostazioni/leggi"));
  const pro = params.get("professionista") || "";
  const onlyOutcomes = params.get("esiti") === "1";
  const professionals = catalog.professionisti.filter(
    (p: Data) => can("agenda.vedi_tutto") || p.id === user?.professional_id,
  );
  const load = useLoad(
    () =>
      api("/agenda/vista", {
        da: week,
        a: addDays(week, 7),
        annullati: true,
        ...(pro ? { professional_id: pro } : {}),
      }),
    [week, pro],
  );
  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };
  const selectDay = (dt: string) => set({ giorno: dt, settimana: monday(dt) });
  const move = (direction: number) =>
    ["Giorno", "Due giorni"].includes(view)
      ? selectDay(addDays(day, direction * (view === "Due giorni" ? 2 : 1)))
      : set({
          settimana: addDays(week, 7 * direction),
          giorno: addDays(day, 7 * direction),
        });
  const all: Data[] = (load.data?.appuntamenti || []).filter((a: Data) => {
    const t = catalog.terapie.find((t: Data) => t.id === a.therapy_type_id);
    return (
      (a.tipo === "nota" ||
        (area === "Poliambulatorio") === (a.categoria === "visita") ||
        (area === "Fisioterapia" &&
          a.tipo === "visita" &&
          catalog.professionisti.find((p: Data) => p.id === a.professional_id)
            ?.titolare)) &&
      (!family || t?.famiglia === family) &&
      (!therapy || a.therapy_type_id === therapy)
    );
  });
  const selected = (
    view === "Giorno" ? all.filter((a) => a.start.startsWith(day)) : all
  ).filter((a) => a.tipo !== "nota" && (!onlyOutcomes || endedWithoutOutcome(a)));
  const subtitle =
    view === "Giorno"
      ? new Date(day + "T12:00:00").toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : `${date(week)} – ${date(addDays(week, 5))}`;
  return (
    <LoadState load={{ ...load, loading: load.loading && !load.data }} wide>
      <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Agenda"
        subtitle={subtitle}
        actions={
          can("agenda.modifica") ? (
            <div className="flex gap-2">
              <PrimaryAction
                label="Nuovo appuntamento"
                icon={<Plus size={16} />}
                to="/agenda/nuovo"
              />

            </div>
          ) : undefined
        }
      />
      <CollapsiblePanel title="Controlli agenda" description={`${area} · ${view} · ${pro ? name(professionals.find((p: Data) => p.id === pro) || {}) : "Tutti i professionisti"}`} >
      <PageTabs
        options={["Fisioterapia", "Poliambulatorio"]}
        value={area}
        label="Area clinica"
        onChange={(area) => set({ area, terapia: "", famiglia: "" })}
      />
      <div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <SelectField
          label="Famiglia terapia"
          value={family}
          onChange={(famiglia) => set({ famiglia })}
          options={[
            { value: "", label: "Tutte le famiglie" },
            ...["TS", "TSF", "palestra", "piscina", "visite", "altro"].map(
              (v) => ({ value: v, label: v }),
            ),
          ]}
        />
        <SelectField
          label="Prestazione"
          value={therapy}
          onChange={(terapia) => set({ terapia })}
          options={[
            { value: "", label: "Tutte le prestazioni" },
            ...catalog.terapie
              .filter(
                (t: Data) =>
                  (area === "Poliambulatorio") === (t.categoria === "visita"),
              )
              .map((t: Data) => ({ value: t.id, label: t.nome })),
          ]}
        />
      <SelectField
        label="Raggruppamento colonne"
        value={grouping}
        onChange={(raggruppa) => set({ raggruppa })}
        options={[
          { value: "categoria", label: "Categorie di terapia" },
          { value: "prestazione", label: "Singole prestazioni e attrezzature" },
          { value: "professionista", label: "Fisioterapisti e medici" },
        ]}
      />
      </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-80">
          <PageTabs
            options={["Settimana", "Due giorni", "Giorno", "Elenco"]}
            value={view}
            onChange={(v) => set({ vista: v, esiti: "" })}
            label="Vista agenda"
          />
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label={
              view === "Giorno" ? "Giorno precedente" : "Settimana precedente"
            }
            icon={<ChevronLeft size={16} />}
            onClick={() => move(-1)}
          />
          <Button
            variant="secondary"
            onClick={() => set({ settimana: monday(today()), giorno: today() })}
          >
            Settimana corrente
          </Button>
          <IconButton
            label={
              view === "Giorno" ? "Giorno successivo" : "Settimana successiva"
            }
            icon={<ChevronRight size={16} />}
            onClick={() => move(1)}
          />
        </div>
        <div className="min-w-40 flex-1 sm:ml-auto sm:max-w-64">
          <SelectField
            compact
            label="Professionista"
            value={pro}
            onChange={(v) => set({ professionista: v })}
            options={[
              {
                value: "",
                label: can("agenda.vedi_tutto")
                  ? "Tutti i professionisti"
                  : "La mia agenda",
              },
              ...professionals.map((p: Data) => ({
                value: p.id,
                label: name(p),
              })),
            ]}
          />
        </div>
      </div>
      {view === "Giorno" && (
        <div className="flex gap-1.5" aria-label="Giorni della settimana">
          {Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((dt) => (
            <Button
              key={dt}
              variant={dt === day ? "primary" : "secondary"}
              aria-pressed={dt === day}
              aria-label={new Date(dt + "T12:00:00").toLocaleDateString(
                "it-IT",
                { weekday: "long", day: "numeric", month: "long" },
              )}
              className="h-auto min-w-0 flex-1 flex-col gap-0.5 px-1 py-2"
              onClick={() => selectDay(dt)}
            >
              <span className="text-[11px] font-normal capitalize">
                {new Date(dt + "T12:00:00").toLocaleDateString("it-IT", {
                  weekday: "short",
                })}
              </span>
              <span className="text-[16px]">{Number(dt.slice(8))}</span>
            </Button>
          ))}
        </div>
      )}
      <div className="border-t border-line pt-4">
        <AgendaNotes week={week} />
      </div>
      {can("agenda.modifica") && <div><PrimaryAction variant="secondary" label="Copia settimana" icon={<Copy size={16} />} to={`/agenda/copia?settimana=${week}`} /></div>}
      <div ref={setCalendarTools} />
      <Checkbox label="Mostra anche le categorie senza appuntamenti" checked={params.get("colonne_vuote") === "1"} onChange={(v) => set({ colonne_vuote: v ? "1" : "" })} />
      </CollapsiblePanel>
      {view !== "Elenco" && (
        <>
          <CalendarWeek
            week={["Due giorni", "Giorno"].includes(view) ? day : week}
            count={view === "Giorno" ? 1 : view === "Due giorni" ? 2 : 5}
            group={grouping}
            showEmpty={params.get("colonne_vuote") === "1"}
            toolbarContainer={calendarTools}
            onCurrentWeek={() => set({ settimana: monday(today()), giorno: today() })}
            colors={settings.data?.valori?.agenda?.colori}
            appointments={all}
            catalog={catalog}
          />
        </>
      )}
      {!["Settimana", "Due giorni"].includes(view) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-ink-2">
              {selected.length}{" "}
              {selected.length === 1 ? "appuntamento" : "appuntamenti"}
            </span>
            {can("agenda.segna_eseguita") && (
              <Button
                variant={onlyOutcomes ? "primary" : "quiet"}
                size="sm"
                onClick={() => set({ esiti: onlyOutcomes ? "" : "1" })}
              >
                {onlyOutcomes ? "Mostra tutti" : "Esiti da registrare"}
              </Button>
            )}
          </div>
          {selected.length ? (
            <AppointmentList
              items={selected}
              onChanged={load.reload}
              showDate={view === "Elenco"}
            />
          ) : (
            <EmptyState
              title={
                onlyOutcomes
                  ? "Nessun esito da registrare"
                  : "Nessun appuntamento in questa giornata"
              }
              description={
                onlyOutcomes
                  ? "Le sedute terminate hanno già un esito."
                  : "Scegli un altro giorno per consultare gli appuntamenti."
              }
            />
          )}
        </>
      )}
      {can("agenda.vedi_tutto") && <CycleAlertsPanel week={week} />}
      </div>
    </LoadState>
  );
}
