// Pannello sovrapposto non modale: non sottrae altezza all’agenda e conserva filtri e appunti.
import { useEffect, useRef, useState } from "react";
import { Copy, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { PageTabs } from "@/components/app/PageTabs";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { PrimaryAction } from "@/components/app/IconButton";
import { AgendaNotes, CycleAlertsPanel } from "./AgendaNotes";
import { useClinic } from "./ClinicContext";
import { name } from "./common";
import type { Data } from "./api";
export function AgendaControls({ area, view, grouping, family, therapy, pro, week, showEmpty, set, onNotesChanged }: {
  onNotesChanged:()=>void; area: string; view: string; grouping: string; family: string; therapy: string; pro: string; week: string; showEmpty: boolean; set: (patch: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false), [tab, setTab] = useState("Vista e filtri");
  const root = useRef<HTMLDivElement>(null);
  const { catalog, can, user } = useClinic();
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); root.current?.querySelector("button")?.focus(); } };
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", key); document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  const professionals = catalog.professionisti.filter((p: Data) => can("agenda.vedi_tutto") || p.id === user?.professional_id);
  return <div ref={root} className="agenda-controls-anchor">
    <Button type="button" variant={open ? "primary" : "secondary"} aria-expanded={open} aria-controls="agenda-controls-panel" onClick={() => setOpen(!open)}><SlidersHorizontal size={16} /><span>Controlli agenda</span>{[family, therapy, pro].filter(Boolean).length > 0 && <span>· {[family, therapy, pro].filter(Boolean).length}</span>}</Button>
    <section id="agenda-controls-panel" hidden={!open} className="agenda-controls-panel" aria-label="Controlli agenda">
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-semibold">Personalizza l’agenda</h2><p className="text-xs text-ink-2">{area} · {view}</p></div><Button variant="quiet" size="sm" aria-label="Chiudi controlli agenda" onClick={() => { setOpen(false); root.current?.querySelector("button")?.focus(); }}><X size={18} /></Button></div>
      <div className="p-5"><PageTabs options={["Vista e filtri", "Appunti"]} value={tab} onChange={setTab} label="Strumenti agenda" />
        <div hidden={tab !== "Vista e filtri"} className="mt-5 flex flex-col gap-4">
          <PageTabs options={["Fisioterapia", "Poliambulatorio"]} value={area} label="Area clinica" onChange={area => set({ area, terapia: "", famiglia: "" })} />
          <SelectField label="Professionista" value={pro} onChange={professionista => set({ professionista })} options={[{ value: "", label: can("agenda.vedi_tutto") ? "Tutti i professionisti" : "La mia agenda" }, ...professionals.map((p: Data) => ({ value: p.id, label: name(p) }))]} />
          <div className="grid gap-3 sm:grid-cols-2"><SelectField label="Famiglia terapia" value={family} onChange={famiglia => set({ famiglia, terapia: "" })} options={[{ value: "", label: "Tutte le famiglie" }, ...["TS", "TSF", "palestra", "piscina", "visite", "altro"].map(v => ({ value: v, label: v }))]} />
            <SelectField label="Prestazione" value={therapy} onChange={terapia => set({ terapia })} options={[{ value: "", label: "Tutte le prestazioni" }, ...catalog.terapie.filter((t: Data) => (area === "Poliambulatorio") === (t.categoria === "visita")).map((t: Data) => ({ value: t.id, label: t.nome }))]} /></div>
          <SelectField label="Colonne del calendario" value={grouping} onChange={raggruppa => set({ raggruppa })} options={[{ value: "giorno", label: "Vista compatta per giorno" }, { value: "categoria", label: "Categorie di terapia" }, { value: "prestazione", label: "Prestazioni e attrezzature" }, { value: "professionista", label: "Fisioterapisti e medici" }]} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"><span className="text-xs text-ink-2">● Prima seduta · ▲ Ultima seduta</span><Button variant="secondary" size="sm" onClick={() => { void root.current?.closest(".agenda-workspace")?.requestFullscreen?.(); setOpen(false); }}>Schermo intero</Button></div>
          <Checkbox label="Mostra anche le categorie senza appuntamenti" checked={showEmpty} onChange={v => set({ colonne_vuote: v ? "1" : "" })} />
          <div className="flex flex-wrap gap-2 border-t border-line pt-4"><Button variant="secondary" size="sm" onClick={() => set({ professionista: "", famiglia: "", terapia: "" })}>Azzera filtri</Button>{can("agenda.modifica") && <PrimaryAction variant="secondary" label="Copia settimana" icon={<Copy size={15} />} to={`/agenda/copia?settimana=${week}`} />}</div>
        </div>
        <div hidden={tab !== "Appunti"} className="mt-5 flex flex-col gap-5"><AgendaNotes week={week} onChanged={onNotesChanged} />{can("agenda.vedi_tutto") && <CycleAlertsPanel week={week} />}</div>
      </div>
    </section>
  </div>;
}
