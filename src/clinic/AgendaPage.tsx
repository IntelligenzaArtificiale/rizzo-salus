// Agenda a tutta altezza: un solo scorrimento e strumenti sovrapposti al calendario.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton, PrimaryAction } from "@/components/app/IconButton";
import { EmptyState } from "@/components/app/PageState";
import { SelectField } from "@/components/form/SelectField";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { LoadState, useLoad, today, monday, addDays } from "./common";
import { CalendarWeek } from "./CalendarWeek";
import { AppointmentList } from "./AppointmentList";
import { AgendaControls } from "./AgendaControls";
export function AgendaPage() {
  const { catalog, can } = useClinic();
  const [params, setParams] = useSearchParams();
  const [compact] = useState(() => matchMedia("(max-width:767px)").matches);
  const view = params.get("vista") || (compact ? "Giorno" : "Settimana");
  const week = params.get("settimana") || monday(params.get("giorno") || today());
  const requested = params.get("giorno") || today(), day = monday(requested) === week ? requested : week;
  const area = params.get("area") || "Fisioterapia", grouping = params.get("raggruppa") || (view === "Giorno" ? "prestazione" : "giorno"), family = params.get("famiglia") || "", therapy = params.get("terapia") || "", pro = params.get("professionista") || "";
  const settings = useLoad(() => api("/impostazioni/leggi"));
  const load = useLoad(() => api("/agenda/vista", { da: week, a: addDays(week, 7), annullati: true, ...(pro ? { professional_id: pro } : {}) }), [week, pro]);
  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) { if (value) next.set(key, value); else next.delete(key); }
    setParams(next);
  };
  const move = (n: number) => {
    const target = addDays(day, n * (view === "Giorno" ? 1 : view === "Due giorni" ? 2 : 7));
    set({ giorno: target, settimana: monday(target) });
  };
  const all: Data[] = (load.data?.appuntamenti || []).filter((a: Data) => {
    const t = catalog.terapie.find((t: Data) => t.id === a.therapy_type_id);
    return (a.tipo === "nota" || (area === "Poliambulatorio") === (a.categoria === "visita")) && (!family || t?.famiglia === family) && (!therapy || a.therapy_type_id === therapy);
  });
  const current = () => set({ settimana: monday(today()), giorno: today() });

  return <LoadState load={{ ...load, loading: load.loading && !load.data }} wide>
    <div className={`agenda-workspace ${view === "Elenco" ? "agenda-list-workspace" : ""}`}>
      <PageHeader title="Agenda" actions={can("agenda.modifica") ? <PrimaryAction label="Nuovo appuntamento" icon={<Plus size={16} />} to="/agenda/nuovo" /> : undefined} />
      <div className="agenda-toolbar">
        <div className="agenda-period-navigation"><IconButton label="Periodo precedente" icon={<ChevronLeft size={17} />} onClick={() => move(-1)} /><SelectField compact label="Vista agenda" value={view} onChange={vista => set({ vista })} options={["Settimana", "Due giorni", "Giorno", "Elenco"].map(value => ({ value, label: value }))} /><IconButton label="Periodo successivo" icon={<ChevronRight size={17} />} onClick={() => move(1)} /></div>
        <AgendaControls {...{ area, view, grouping, family, therapy, pro, week, set, onNotesChanged:load.reload }} showEmpty={params.get("colonne_vuote") === "1"} />
      </div>
      {view !== "Elenco" ? <CalendarWeek week={["Due giorni", "Giorno"].includes(view) ? day : week} count={view === "Giorno" ? 1 : view === "Due giorni" ? 2 : all.some(a=>a.start.startsWith(addDays(week,5))) ? 6 : 5} group={grouping} showEmpty={params.get("colonne_vuote") === "1"} onCurrentWeek={current} colors={settings.data?.valori?.agenda?.colori} appointments={all} catalog={catalog} /> : <div className="min-h-0 flex-1 overflow-auto">{all.length > 0 ? <AppointmentList items={all} onChanged={load.reload} showDate /> : <EmptyState title="Nessun appuntamento" description="Scegli un altro periodo o modifica i filtri." />}</div>}
    </div>
  </LoadState>;
}
