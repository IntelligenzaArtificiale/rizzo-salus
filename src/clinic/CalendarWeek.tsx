import { createPortal } from "react-dom";
// Geometria del calendario di dominio; controlli e superfici del boilerplate.
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/atoms/Button";
import { useClinic } from "./ClinicContext";
import { addDays, today } from "./common";
import { CalendarEvent } from "./CalendarEvent";
import { channels, channelOf, overlaps } from "./calendar-layout";
import type { Data } from "./api";
export function CalendarWeek({
  week,
  appointments,
  catalog,
  count = 5,
  group = "categoria",
  colors = {},
  onCurrentWeek,
  showEmpty = false,
  toolbarContainer,
}: {
  week: string;
  appointments: Data[];
  catalog: Data;
  count?: number;
  group?: string;
  showEmpty?: boolean;
  toolbarContainer?: HTMLElement | null;
  colors?: Data;
  onCurrentWeek: () => void;
}) {
  const navigate = useNavigate(),
    { can } = useClinic(),
    ref = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => { const update = () => setFull(document.fullscreenElement === ref.current); document.addEventListener("fullscreenchange", update); return () => document.removeEventListener("fullscreenchange", update); }, []);
  const days = Array.from({ length: count }, (_, i) => addDays(week, i));
  const entries = appointments.filter((a) => a.tipo !== "nota");
  const cols = channels(entries.filter((a) => days.some((day) => a.start.startsWith(day))), catalog, group).filter((col: Data) => showEmpty || entries.some((a) => days.some((day) => a.start.startsWith(day)) && channelOf(a, catalog, group) === col.id));
  if (!cols.length)
    cols.push({ id: "vuoto", label: "Nessun appuntamento", short: "Agenda" });
  const min = count === 5 ? 112 : 168;
  const controls = (
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
        <span>
          08:00–20:30 · ● Prima seduta · ▲ Ultima seduta · gruppi con indicatori
          individuali
        </span>
        <Button className="clinic-full-only" variant="secondary" size="sm" onClick={onCurrentWeek}>Settimana corrente</Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { if (full) document.exitFullscreen(); else ref.current?.requestFullscreen?.().catch(() => {}); }}
        >
          {full ? "Esci dallo schermo intero" : "A tutto schermo"}
        </Button>
      </div>
  );
  return (
    <div ref={ref} className="clinic-calendar-shell flex min-w-0 flex-col gap-2">
      {full || !toolbarContainer ? controls : createPortal(controls, toolbarContainer)}
      <div
        className="clinic-calendar"
        role="region"
        aria-label="Agenda settimanale"
        tabIndex={0}
      >
        <div
          className="clinic-calendar-grid"
          style={{
            gridTemplateColumns: `48px repeat(${days.length * cols.length},minmax(${min}px,1fr))`,
            minWidth: 48 + days.length * cols.length * min,
          }}
        >
          <div className="clinic-time-column">
            <div className="clinic-day-heading" />
            {Array.from({ length: 26 }, (_, i) => i * 30 + 480).map((m) => (
              <span
                key={m}
                className="clinic-time"
                style={{ top: 60 + (m - 480) * 1.6 }}
              >
                {String(Math.floor(m / 60)).padStart(2, "0")}:
                {String(m % 60).padStart(2, "0")}
              </span>
            ))}
          </div>
          {days.flatMap((day) =>
            cols.map((col: Data, index: number) => (
              <div
                className={`clinic-day-column ${index === 0 ? "clinic-day-start" : ""}`}
                key={day + col.id}
                onDragOver={(e) => {
                  if (can("agenda.modifica")) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!can("agenda.modifica")) return;
                  const item = entries.find(
                    (a) =>
                      a.id === e.dataTransfer.getData("text/rizzo-appointment"),
                  );
                  if (!item) return;
                  const box = e.currentTarget.getBoundingClientRect();
                  const m = Math.max(
                    480,
                    Math.min(
                      1215,
                      480 +
                        Math.round((e.clientY - box.top - 60) / 1.6 / 15) * 15,
                    ),
                  );
                  navigate(
                    `/agenda/${item.id}/modifica?giorno=${item.start.slice(0, 10)}&inizio=${day}T${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`,
                  );
                }}
              >
                <div
                  className={`clinic-day-heading ${day === today() ? "clinic-today" : ""}`}
                  title={col.label}
                >
                  <span>
                    {index === 0
                      ? new Date(day + "T12:00:00").toLocaleDateString(
                          "it-IT",
                          { weekday: "short", day: "numeric" },
                        )
                      : new Date(day + "T12:00:00").getDate()}
                  </span>
                  <strong
                    className="truncate max-w-full text-center"
                    title={col.label}
                  >
                    {col.label}
                  </strong>
                </div>
                {overlaps(
                  entries.filter(
                    (a) =>
                      a.start.startsWith(day) &&
                      channelOf(a, catalog, group) === col.id,
                  ),
                ).map((x) => (
                  <CalendarEvent
                    key={x.a.id}
                    {...x}
                    day={day}
                    catalog={catalog}
                    colors={colors}
                    canMove={can("agenda.modifica")}
                  />
                ))}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
