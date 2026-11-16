/*
 * Cronologia verticale: storico di una pratica, passaggi di stato, scambio domanda/risposta,
 * eventi di un registro attività visti da un singolo elemento.
 * Ogni evento: quando (leggibile), chi, cosa è successo, dettaglio facoltativo, stato facoltativo.
 * Per cercare e filtrare molti eventi usare la tabella del registro, non questa lista.
 */
import type { ReactNode } from "react";
import { StatusPill } from "@/components/atoms/StatusPill";
import type { StatusInfo } from "@/lib/status";

export type TimelineEvent = { key: string; when: string; title: ReactNode; who?: string; detail?: ReactNode; status?: StatusInfo };

export function Timeline({ events, label = "Cronologia" }: { events: TimelineEvent[]; label?: string }) {
  return (
    <ol aria-label={label} className="relative flex flex-col gap-5 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-line">
      {events.map((e, i) => (
        <li key={e.key} className="relative flex flex-col gap-1">
          <span aria-hidden className={`absolute top-[5px] -left-6 size-[15px] rounded-full border-[3px] border-surface ${i === 0 ? "bg-accent" : "bg-line-strong"}`} />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14px] font-medium text-ink">{e.title}</span>
            {e.status && <StatusPill tone={e.status.tone}>{e.status.label}</StatusPill>}
          </div>
          <span className="text-[12.5px] text-ink-3">{e.who ? `${e.when} · ${e.who}` : e.when}</span>
          {e.detail && <div className="mt-1 rounded-[10px] bg-inset px-3 py-2 text-[13.5px] leading-relaxed text-ink-2">{e.detail}</div>}
        </li>
      ))}
    </ol>
  );
}
