import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/form/Checkbox";
import { TextField } from "@/components/form/TextField";
import { DetailList, Section } from "@/components/app/Section";
import { useUnsavedChanges } from "@/lib/forms/useUnsavedChanges";
import { api, type Data } from "./api";
import { date, name, useAction } from "./common";
import "./patient-history.css";

const topics = [
  ["allergie", "Allergie riferite"], ["cardiologia", "Problemi cardiaci riferiti"],
  ["oncologia", "Precedenti oncologici"], ["interventi", "Interventi pregressi"],
  ["esami", "Esami e analisi"], ["farmaci", "Terapie farmacologiche"],
] as const;
type Entries = Record<string, string>;
export function PatientHistory({patient, onSaved}: {patient: Data; onSaved: () => void}) {
  const [params, setParams] = useSearchParams();
  const edit = params.get("modifica") === "1";
  const saved: Entries = patient.anamnesi_voci ?? {};
  const [entries, setEntries] = useState<Entries>(saved);
  const action = useAction();
  const guard = useUnsavedChanges(edit && JSON.stringify(entries) !== JSON.stringify(saved));
  const rows: {label:string; value:string}[] = topics.filter(([key]) => Object.hasOwn(saved,key))
    .map(([key,label]) => ({label, value:saved[key] || "Segnalato"}));
  if (patient.anamnesi) rows.push({label:"Anamnesi in cartella",value:patient.anamnesi});
  if (patient.allergie) rows.push({label:"Allergie in cartella",value:patient.allergie});
  const back = () => setParams({scheda:"Anamnesi"});
  if (edit) return <Section title="Compila anamnesi">
    <p className="text-sm text-ink-2">Seleziona le voci riferite e aggiungi i dettagli che vuoi conservare.</p>
    <div className="grid gap-3 sm:grid-cols-2">{topics.map(([key,label]) => <div key={key} className="grid content-start gap-3 rounded-card border border-line p-4">
      <Checkbox label={label} checked={Object.hasOwn(entries,key)} onChange={checked => setEntries(previous => {
        const next = {...previous};
        if (checked) next[key] = "";
        else delete next[key];
        return next;
      })} />
      {Object.hasOwn(entries,key) && <TextField label={"Dettagli · "+label} value={entries[key]} maxLength={800} onChange={value=>setEntries(previous=>({...previous,[key]:value}))} />}
    </div>)}</div>
    <div className="flex gap-2"><Button variant="primary" disabled={action.busy} onClick={()=>action.act(async()=>{
      await api("/pazienti/anamnesi",{id:patient.id,revision:patient.revision,voci:entries});
      guard.allowNext();back();onSaved();
    },"Anamnesi salvata")}>Salva anamnesi</Button>
    <Button variant="secondary" disabled={action.busy} onClick={back}>Annulla</Button></div>{guard.dialog}
  </Section>;
  return <Section title="Anamnesi">
    <div className="history-report">
      <div className="history-print-heading"><h1>Riepilogo anamnesi</h1><p>{name(patient)}{patient.data_nascita ? " · "+date(patient.data_nascita) : ""}</p></div>
      {rows.length ? <DetailList items={rows}/> : <p className="text-sm text-ink-2">Nessuna voce registrata.</p>}
    </div>
    <div className="flex flex-wrap gap-2"><Button variant="primary" onClick={()=>{setEntries(saved);setParams({scheda:"Anamnesi",modifica:"1"});}}>{rows.length?"Modifica anamnesi":"Compila anamnesi"}</Button>
    {!!rows.length && <Button variant="secondary" onClick={()=>window.print()}>Stampa riepilogo</Button>}</div>
  </Section>;
}
