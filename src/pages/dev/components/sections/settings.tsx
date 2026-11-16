/* Sezione Impostazioni: SettingsSection, SaveBar, useSettingsForm; FineTuneCard per regolazioni numeriche. */
import { useState } from "react";
import FineTuneCard from "@/components/primitives/FineTuneCard";
import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";
import { SwitchRow } from "@/components/form/SwitchRow";
import { TextField } from "@/components/form/TextField";
import type { GuideSection } from "@/pages/dev/components/types";

function SettingsDemo() {
  const base = { nome: "Studio Riva", promemoria: true };
  const [v, setV] = useState(base);
  const [saved, setSaved] = useState(base);
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSaved(v); }} className="rounded-card bg-surface px-4 shadow-card sm:px-6">
      <SettingsSection title="Studio" description="Nome mostrato a pazienti ed email.">
        <TextField label="Nome dello studio" value={v.nome} onChange={(nome) => setV({ ...v, nome })} />
      </SettingsSection>
      <SettingsSection title="Promemoria" description="Messaggi automatici prima degli appuntamenti.">
        <SwitchRow title="Promemoria il giorno prima" description="SMS ed email alle 18:00." checked={v.promemoria} onChange={(promemoria) => setV({ ...v, promemoria })} />
      </SettingsSection>
      <SaveBar dirty={dirty} busy={false} onReset={() => setV(saved)} />
    </form>
  );
}

export const settings: GuideSection = {
  id: "impostazioni",
  title: "Impostazioni",
  intro: "Pagine di configurazione a schede. Stessa griglia in tutte le schede, salvataggio esplicito con la barra in basso o interruttori che si salvano da soli: mai i due modi nella stessa sezione.",
  docs: [
    {
      id: "settings-section",
      name: "SettingsSection e SaveBar",
      importPath: 'import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";\nimport { useSettingsForm } from "@/lib/forms/useSettingsForm";',
      origin: "Composizione del boilerplate",
      purpose: "Sezione con titolo e descrizione a sinistra e controlli a destra (una colonna su mobile). SaveBar compare solo con modifiche: «Annulla modifiche» e «Salva». useSettingsForm aggiunge dirty, invio unico, toast e avviso di uscita, anche cambiando scheda.",
      demos: [{ label: "Studio medico", render: () => <SettingsDemo /> }],
      props: [["SettingsSection title / description / aside", "string / ReactNode / ReactNode", "aside: contenuto sotto la descrizione (es. anteprima)"], ["SaveBar dirty / busy / onReset", "boolean / boolean / fn", "Dentro il <form>; fissa in basso"], ["useSettingsForm(saved, save, titolo)", "→ value, patch, dirty, busy, reset, submit, dialog", "dialog va fuori dal <form>"]],
      use: ["Ogni scheda di impostazioni con salvataggio esplicito", "Profilo e preferenze con più gruppi"],
      avoid: ["Form stretti allineati a sinistra in una pagina larga", "Bottone Salva sempre visibile e disattivo", "Finestre di conferma dentro il <form> (form annidati)"],
      wiring: `const form = useSettingsForm(settings.seo, (seo) => update({ seo }), "SEO aggiornato");
return (<>
  <form onSubmit={form.submit} noValidate>
    <SettingsSection title="Titoli" description="…"><TextField … onChange={(v) => form.patch({ titolo: v })} /></SettingsSection>
    <SaveBar dirty={form.dirty} busy={form.busy} onReset={form.reset} />
  </form>
  {form.dialog}
</>);`,
      responsive: "Due colonne da 768 px (titolo 15 rem); sotto, titolo sopra i controlli. SaveBar a tutta larghezza.",
      a11y: "SaveBar è una regione con nome «Modifiche da salvare»; Salva con aria-busy; Esc nella conferma d'uscita resta sulla pagina.",
      customize: ["Testi", "aside per anteprime"],
      mistakes: [{ wrong: "Form di 560 px allineati a sinistra sotto schede larghe 700 px in una pagina da 880.", right: "Schede a tutta larghezza e sezioni sulla stessa griglia." }],
    },
    {
      id: "fine-tune",
      name: "FineTuneCard",
      importPath: 'import FineTuneCard from "@/components/primitives/FineTuneCard";',
      origin: "Beautiful UI",
      purpose: "Regolazione di valori numerici trascinando (raggi, spaziature, dimensioni) con un selettore di tipo. Non controllata: comunica i valori con onChange.",
      demos: [{ label: "Etichette di stampa", render: () => (
        <FineTuneCard labels={{ title: "Etichetta", layout: "Formato", type: "Carta", placeholder: "Scegli", adjust: "Regola", edited: "Modificato" }}
          options={["Adesiva", "Cartoncino", "Termica"]}
          fields={[{ key: "larghezza", label: "Larghezza", value: 62, min: 30, max: 100, suffix: "mm" }, { key: "altezza", label: "Altezza", value: 29, min: 15, max: 60, suffix: "mm" }, { key: "margine", label: "Margine", value: 3, min: 0, max: 10, suffix: "mm" }, { key: "testo", label: "Testo", value: 9, min: 6, max: 14, suffix: "pt" }]} />
      ) }],
      props: [["fields", "FineTuneField[]", "{ key, label, value, min, max, suffix }"], ["options / labels", "string[] / object", "Voci del menu tipo e testi"], ["onChange", "(state) => void", "segment, values, type"]],
      use: ["Valori numerici che si regolano guardando il risultato (formati, misure)"],
      avoid: ["Scelte fra poche opzioni: SegmentedControl", "Impostazioni globali dell'aspetto: Impostazioni › Aspetto"],
      wiring: `<FineTuneCard fields={FIELDS} options={TYPES} labels={LABELS} onChange={(s) => setDraft(s.values)} />`,
      responsive: "Larghezza fissa del vendor; su mobile occupa la riga.",
      a11y: "Valori modificabili anche da tastiera nei campi del vendor.",
      customize: ["Campi, opzioni, testi"],
      mistakes: [{ wrong: "Usarla come decorazione con valori che non cambiano nulla.", right: "Collegarla con onChange a un'anteprima vera o non usarla." }],
    },
  ],
};
