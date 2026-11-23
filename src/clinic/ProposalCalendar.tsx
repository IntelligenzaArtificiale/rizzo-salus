import { useEffect, useRef } from "react";
import { CollapsiblePanel } from "@/components/app/CollapsiblePanel";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { useClinic } from "./ClinicContext";
import { addDays, date, monday, name, useLoad } from "./common";
import { api, type Data } from "./api";
import { overlaps } from "./calendar-layout";
import "./proposal-calendar.css";

export const minutes = (stamp: string) => Number(stamp.slice(11,13)) * 60 + Number(stamp.slice(14,16));
const time = (m: number) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
type Props = {
  proposal: Data; focus: number; week: string; selected: number[]; edits: Data;
  setWeek: (w: string) => void; onFocus: (i: number) => void; onSlot: (slot: Data) => void;
};
export function ProposalCalendar({proposal, focus, week, selected, edits, setWeek, onFocus, onSlot}: Props) {
  const {catalog} = useClinic();
  const current = proposal.nuove[focus], slot = {...current, ...edits[focus]};
  const weekly = useLoad(async () => {
    const [agenda, windows] = await Promise.all([
      api("/agenda/vista", {da:week, a:addDays(week,6), professional_id:slot.professional_id}),
      api("/pianificazione/fasce", {da:week, episodio:current.episode_id, professionista:slot.professional_id})
    ]);
    return {agenda:agenda.appuntamenti as Data[], windows};
  }, [week, slot.professional_id, current.episode_id]);
  const therapy = (r: Data) => catalog.terapie.find((t: Data) => t.id === r.therapy_type_id)?.nome || "Appuntamento";
  const clinician = catalog.professionisti.find((p: Data) => p.id === slot.professional_id);
  const duration = minutes(current.end) - minutes(current.start);
  const finish = (r: Data, len: number) => r.start.slice(0,11) + time(minutes(r.start) + len) + ":00";
  const proposed = proposal.nuove.map((n: Data, i: number) => {
    const row = {...n, ...edits[i]};
    return {...row, index:i, kind:"proposta", end:finish(row, minutes(n.end)-minutes(n.start))};
  });
  const choices = [current, ...(current.alternative || [])].filter((a: Data) => {
    if (a.start === slot.start && a.professional_id === slot.professional_id) return false;
    return !proposed.some((r:Data) => r.index !== focus && selected.includes(r.index) && r.patient_id === current.patient_id && r.start < finish(a,duration) && a.start < r.end);
  });
  const others = choices.filter((a: Data) => a.professional_id === slot.professional_id).map((a: Data) => ({...a, end:finish(a,duration), kind:"alternativa"}));
  const days = Array.from({length:7}, (_,i) => addDays(week,i));
  const existing = (weekly.data?.agenda || []).filter(a => a.stato !== "annullato" && a.tipo !== "nota").map(a => ({...a,kind:"occupato"}));
  const entries = [...existing,...proposed.filter((r: Data) => r.professional_id === slot.professional_id),...others].filter(r=>days.includes(r.start.slice(0,10)));
  const windows = weekly.data?.windows.giorni || {};
  const spans = Object.values(windows).flatMap((d:any) => [...d.turno,...d.paziente] as number[][]);
  const first = Math.floor(Math.min(480,...entries.map(r=>minutes(r.start)),...spans.map(s=>s[0]))/60)*60;
  const last = Math.ceil(Math.max(1200,...entries.map(r=>minutes(r.end)),...spans.map(s=>s[1]))/60)*60;
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if (scroller.current && slot.start.slice(0,10)>=week && slot.start.slice(0,10)<=addDays(week,6))
      scroller.current.scrollTop=Math.max(0,minutes(slot.start)-first-90);
  },[focus,week,slot.start,first,weekly.loading]);
  return <div className="proposal-workspace">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <SelectField label="Seduta da esaminare" value={String(focus)} onChange={v=>onFocus(Number(v))} options={proposed.map((r:Data) => ({value:String(r.index),label:(r.index+1)+". "+therapy(r)+" · "+date(r.start)+" "+r.start.slice(11,16)}))}/>
      <div className="flex items-center gap-2"><Button size="sm" aria-label="Settimana precedente" disabled={week<=monday(proposal.dal)} onClick={()=>setWeek(addDays(week,-7))}>‹</Button><strong>{date(week)} – {date(days[6])}</strong><Button size="sm" aria-label="Settimana successiva" disabled={week>=monday(proposal.al)} onClick={()=>setWeek(addDays(week,7))}>›</Button></div>
    </div>
    <p className="text-sm">{clinician ? name(clinician) : "Professionista"} · <span className="proposal-legend">Proposta</span> · Alternativa tratteggiata · Già in agenda in grigio</p>
    <p className="text-xs text-ink-2">Fascia verde a sinistra per il paziente, blu a destra per il turno.{weekly.data && !weekly.data.windows.preferenze_indicate && " Il paziente non ha indicato preferenze."}</p>
    {weekly.loading ? <p role="status">Caricamento agenda…</p> : weekly.error ? <p role="alert">{weekly.error} <Button onClick={weekly.reload}>Riprova</Button></p> :
    <div ref={scroller} className="proposal-scroll" role="region" aria-label="Simulazione settimanale" tabIndex={0}><div className="proposal-grid">
      <span className="proposal-heading">Ora</span>{days.map(d=><strong key={d} className="proposal-heading">{new Date(d+"T12:00").toLocaleDateString("it-IT",{weekday:"short",day:"numeric"})}</strong>)}
      <div className="proposal-day" style={{height:last-first}}>{Array.from({length:(last-first)/60},(_,i)=><small key={i} style={{top:i*60}}>{time(first+i*60)}</small>)}</div>
      {days.map(day=><div key={day} className="proposal-day" style={{height:last-first}}>
        {["paziente","turno"].flatMap(k=>(windows[day]?.[k] || []).map(([a,b]:number[],i:number)=><span key={k+i} className={"proposal-window "+k} title={(k==="turno"?"Turno":"Disponibilità paziente")+" "+time(a)+"–"+time(b)} style={{top:a-first,height:b-a}}/>))}
        {overlaps(entries.filter(r=>r.start.startsWith(day))).map(({a,lane,of},i)=>{
          const style={top:minutes(a.start)-first,height:Math.max(14,minutes(a.end)-minutes(a.start)-1),left:"calc("+lane*100/of+"% + 2px)",width:"calc("+100/of+"% - 4px)"};
          const label=a.start.slice(11,16)+" · "+(a.kind==="alternativa"?"Alternativa":therapy(a));
          if(a.kind==="occupato") return <span key={i} className="proposal-block occupato" style={style} title={label}>{label}</span>;
          return <button key={i} type="button" className={"proposal-block "+a.kind+(a.index===focus?" focus":"")+(a.kind==="proposta"&&!selected.includes(a.index)?" skipped":"")} style={style} title={label} aria-label={label} onClick={()=>a.kind==="alternativa"?onSlot(a):onFocus(a.index)}>{label}</button>;
        })}
      </div>)}
    </div></div>}
    <CollapsiblePanel title="Modifica manualmente la seduta"><div className="grid gap-3 pt-3 sm:grid-cols-2">
      <TextField label="Data e ora della seduta" type="datetime-local" value={slot.start.slice(0,16)} onChange={v=>{if(v.length===16) onSlot({...slot,start:v+":00"});}} />
      <SelectField label="Professionista della seduta" value={slot.professional_id} onChange={id=>onSlot({...slot,professional_id:id})} options={catalog.professionisti.filter((p:Data)=>p.attivo && ["medico","fisioterapista"].includes(p.tipo)).map((p:Data)=>({value:p.id,label:name(p)}))}/>
    </div></CollapsiblePanel>
    {choices.length>0 && <div className="flex flex-wrap items-center gap-2"><span className="text-sm">Sposta la seduta</span>{choices.map((r:Data)=><Button size="sm" variant="secondary" key={r.start+r.professional_id} onClick={()=>onSlot(r)}>{date(r.start)} · {r.start.slice(11,16)} · {name(catalog.professionisti.find((p:Data)=>p.id===r.professional_id)||{})}</Button>)}</div>}
  </div>;
}
