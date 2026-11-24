import { useState } from "react";
import { PageTabs } from "@/components/app/PageTabs";
import { Section } from "@/components/app/Section";
import { Checkbox } from "@/components/form/Checkbox";
import "./body-regions.css";

import { points, regionLabel, type Face } from "./anatomical-regions";

export function BodyRegions({value,onChange}:{value:string[];onChange:(value:string[])=>void}) {
  const [face,setFace]=useState<Face>("anteriore");
  const shown=points(face);
  const toggle=(code:string)=>onChange(value.includes(code)?value.filter(v=>v!==code):[...value,code]);
  return <Section title="Distretti interessati">
    <PageTabs options={["Anteriore","Posteriore"]} value={face==="anteriore"?"Anteriore":"Posteriore"} label="Lato della figura" onChange={v=>setFace(v==="Anteriore"?"anteriore":"posteriore")}/>
    <div className="region-editor">
      <div className="region-figure" aria-label={"Mappa anatomica "+face}>
        <svg viewBox="0 0 100 200" aria-hidden="true" preserveAspectRatio="none">
          <ellipse cx="50" cy="16" rx="9" ry="12"/>
          <path d="M44 26 44 33 Q37 34 30 38 Q25 40 23 50 L17 74 12 97 Q12 104 16 105 Q20 106 21 97 L28 76 34 59 Q37 72 34 86 Q30 98 33 114 L37 143 36 180 32 192 Q31 196 40 194 L44 190 46 150 50 113 54 150 56 190 60 194 Q69 196 68 192 L64 180 63 143 67 114 Q70 98 66 86 Q63 72 66 59 L72 76 79 97 Q80 106 84 105 Q88 104 88 97 L83 74 77 50 Q75 40 70 38 Q63 34 56 33 L56 26 Z"/>
          {face==="posteriore" && <path className="region-spine" d="M50 36 50 86"/>}
        </svg>
        {shown.map(p=>{const code=face+"_"+p.key;return <button key={code} type="button" className="region-point" style={{left:p.x+"%",top:p.y/2+"%"}} title={p.label} aria-label={p.label+" · "+face} aria-pressed={value.includes(code)} onClick={()=>toggle(code)}/>;})}
      </div>
      <div><p className="mb-3 text-sm text-ink-2">Tocca la figura o seleziona i distretti. Destra e sinistra si riferiscono al paziente.</p>
        <div className="grid grid-cols-2 gap-3">{shown.map(p=><Checkbox key={p.key} label={p.label} checked={value.includes(face+"_"+p.key)} onChange={()=>toggle(face+"_"+p.key)} />)}</div>
      </div>
    </div>
    <p className="text-sm text-ink-2" aria-live="polite">{value.length ? value.map(regionLabel).join("  /  ") : "Nessun distretto selezionato."}</p>
  </Section>;
}
