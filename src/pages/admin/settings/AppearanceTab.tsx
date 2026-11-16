/*
 * Aspetto per tutta la piattaforma: tema iniziale, angoli, densità, movimento, carattere.
 * L'anteprima (sotto il titolo su desktop, in fondo su mobile) applica subito le scelte non salvate (attributi data-* sul riquadro);
 * dopo il salvataggio valgono per tutti (applyAppearance sulla radice).
 */
import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { StatusPill } from "@/components/atoms/StatusPill";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SwitchRow } from "@/components/form/SwitchRow";
import { fieldLabel } from "@/components/form/fieldStyles";
import { EntityCard } from "@/components/app/EntityCard";
import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { applyAppearance } from "@/lib/platform/appearance";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";
import { statusOf } from "@/lib/status";
import type { Appearance } from "@/lib/platform/defaults";

type Choice<K extends keyof Appearance> = { key: K; label: string; hint: string; options: [Appearance[K], string][] };

const CHOICES = [
  { key: "tema", label: "Tema iniziale", hint: "Chi non ha scelto un tema vede questo; «Automatico» segue il dispositivo. Ognuno può cambiarlo dal comando in alto.", options: [["sistema", "Automatico"], ["chiaro", "Chiaro"], ["scuro", "Scuro"]] },
  { key: "angoli", label: "Angoli", hint: "Raggio di card, campi, finestre e bottoni.", options: [["netti", "Netti"], ["standard", "Standard"], ["morbidi", "Morbidi"]] },
  { key: "densita", label: "Densità", hint: "Spazio fra i blocchi e altezza delle righe.", options: [["compatta", "Compatta"], ["standard", "Standard"], ["ariosa", "Ariosa"]] },
  { key: "movimento", label: "Movimento", hint: "«Automatico» rispetta la preferenza «riduci movimento» di ciascun dispositivo; «Ridotto» spegne le animazioni per tutti.", options: [["dispositivo", "Automatico"], ["ridotto", "Ridotto"]] },
  { key: "carattere", label: "Carattere", hint: "Inter è incluso nella piattaforma; quello di sistema è il predefinito del dispositivo.", options: [["inter", "Inter"], ["sistema", "Del sistema"]] },
] satisfies Choice<keyof Appearance>[];

function Picker<K extends keyof Appearance>({ c, value, onChange }: { c: Choice<K>; value: Appearance[K]; onChange: (v: Appearance[K]) => void }) {
  const labels = c.options.map(([, l]) => l);
  const current = c.options.find(([v]) => v === value)?.[1] ?? labels[0];
  return (
    <div className="flex flex-col gap-1.5 pb-[18px]">
      <span className={fieldLabel}>{c.label}</span>
      <SegmentedControl options={labels} value={current} onChange={(l) => onChange(c.options.find(([, x]) => x === l)![0])} className="w-full" />
      <p className="text-[12.5px] text-ink-3">{c.hint}</p>
    </div>
  );
}

function Preview({ a }: { a: Appearance }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) applyAppearance(ref.current, a); }, [a]);
  return (
    <div ref={ref} aria-label="Anteprima dell'aspetto" className={`rounded-window bg-page p-4 shadow-hairline ${a.tema === "scuro" ? "dark" : ""}`}>
      <div className="page-shell flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[17px] font-semibold text-ink">Richieste</span>
          <Button variant="primary" size="sm" className="gap-1"><Plus size={14} />Nuova</Button>
        </div>
        <EntityCard layout="horizontal" title="Fornitura adesivo per piastrelle" eyebrow="Impresa Edile Rossi" status={statusOf("in_lavorazione")} meta={["12 sacchi", "Ritiro dal 6 novembre"]} />
        <div className="rounded-card bg-surface px-3 shadow-card">
          <SwitchRow title="Avvisami per email" description="Quando cambia lo stato." checked onChange={() => {}} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="green">Completata</StatusPill><StatusPill tone="orange">In attesa</StatusPill>
        </div>
        <TextField label="Cerca" value="" onChange={() => {}} placeholder="Nome o cliente" className="pb-0 [&>p]:hidden" />
      </div>
    </div>
  );
}

export function AppearanceTab() {
  const { settings, update } = usePlatform();
  const form = useSettingsForm(settings.aspetto, (aspetto) => update({ aspetto }), "Aspetto aggiornato");
  const a = form.value;
  return (
    <>
    <form onSubmit={form.submit} noValidate>
      <SettingsSection title="Stile" description="Vale per tutte le persone e tutte le pagine. L'anteprima mostra il risultato prima di salvare."
        aside={<div className="mt-3 hidden md:block"><Preview a={a} /></div>}>
        {CHOICES.map((c) => (
          <Picker key={c.key} c={c as Choice<typeof c.key>} value={a[c.key]} onChange={(v) => form.patch({ [c.key]: v } as Partial<Appearance>)} />
        ))}
        <div className="md:hidden"><Preview a={a} /></div>
      </SettingsSection>
      <SaveBar dirty={form.dirty} busy={form.busy} onReset={form.reset} />
    </form>
    {form.dialog}
    </>
  );
}
