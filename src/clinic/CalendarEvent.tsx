import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { eventColor } from "./calendar-layout";
import type { Data } from "./api";
export function CalendarEvent({
  a,
  lane,
  of,
  day,
  catalog,
  colors,
  canMove,
}: {
  a: Data;
  lane: number;
  of: number;
  day: string;
  catalog: Data;
  colors: Data;
  canMove: boolean;
}) {
  const minutes = (s: string) =>
    Number(s.slice(11, 13)) * 60 + Number(s.slice(14, 16));
  const signals = a.segnali || [],
    names = Object.values(a.pazienti_nomi || {}).join(", ") || "Appuntamento";
  const t = catalog.terapie.find((t: Data) => t.id === a.therapy_type_id);
  const pro = catalog.professionisti.find(
    (p: Data) => p.id === a.professional_id,
  );
  const marker = signals.some((s: Data) => s.prima) ? "Prima seduta" : "";
  const last = signals.some((s: Data) => s.ultima) ? "Ultima seduta" : "";
  return (
    <Link
      draggable={canMove && !["annullato", "eseguito"].includes(a.stato)}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/rizzo-appointment", a.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      to={`/agenda/${a.id}?giorno=${day}`}
      className={`clinic-event ${a.tipo === "gruppo" ? "clinic-group" : ""} ${a.stato === "annullato" ? "clinic-cancelled" : ""}`}
      aria-label={`${names}, ${a.start.slice(11, 16)}, ${t?.nome || "Prestazione"}, ${marker} ${last}`}
      title={`${names} · ${pro?.nome || ""} ${pro?.cognome || ""} · ${a.start.slice(11, 16)}–${a.end.slice(11, 16)} · ${t?.nome || ""} · ${marker} ${last}`}
      style={
        {
          top: 84 + (minutes(a.start) - 480) * 1.6,
          height: Math.max(22, (minutes(a.end) - minutes(a.start)) * 1.6 - 2),
          left: `calc(${(lane * 100) / of}% + 6px)`,
          width: `calc(${100 / of}% - 12px)`,
          "--event-color": eventColor(a, catalog, colors),
        } as CSSProperties
      }
    >
      {a.tipo === "gruppo" ? (
        Object.entries(a.pazienti_nomi || {}).map(([id, name]) => (
          <b key={id} title={String(name)} className={(a.participants || []).find((p: Data) => p.patient_id === id)?.stato === "assente" ? "line-through opacity-50" : ""}>
            {signals.find((s: Data) => s.patient_id === id)?.ultima ? (
              <span aria-label="Fine ciclo" style={{ color: colors.ultima || "#B91C1C" }}>▲ </span>
            ) : signals.find((s: Data) => s.patient_id === id)?.prima ? (
              <span aria-label="Prima seduta" style={{ color: colors.prima || "#15803D" }}>● </span>
            ) : (
              ""
            )}
            {String(name)}
          </b>
        ))
      ) : (
        <b>
          {last ? "▲ " : marker ? "● " : ""}
          {names}
        </b>
      )}
      {minutes(a.end) - minutes(a.start) >= 30 && (
        <span>
          {a.start.slice(11, 16)}–{a.end.slice(11, 16)} · {t?.nome}
        </span>
      )}
      {a.tipo === "gruppo" && (
        <span>
          {(a.participants || []).filter((p: Data) => !["assente", "annullato"].includes(p.stato)).length}/
          {a.limiti_gruppo?.capienza ?? a.capienza} pazienti
        </span>
      )}
    </Link>
  );
}
