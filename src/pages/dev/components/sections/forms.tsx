/* Sezione Moduli: campi, scelte, caricamento file e logica di validazione/invio. */
import { useRef, useState, type FormEvent } from "react";
import { TextField } from "@/components/form/TextField";
import { PhoneField } from "@/components/form/PhoneField";
import { SelectField } from "@/components/form/SelectField";
import { SwitchRow } from "@/components/form/SwitchRow";
import { Checkbox } from "@/components/form/Checkbox";
import { FileUpload } from "@/components/form/FileUpload";
import { FormActions } from "@/components/form/FormActions";
import { useToast } from "@/components/feedback/toast-context";
import { useFormFields } from "@/lib/forms/useFormFields";
import { useSubmit } from "@/lib/forms/useSubmit";
import { email, phone } from "@/lib/validation";
import type { GuideSection } from "@/pages/dev/components/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function OrderForm() {
  const toast = useToast();
  const prefix = useRef("+39");
  const [pfx, setPfx] = useState("+39");
  const form = useFormFields({
    email: { rules: [email] },
    telefono: { rules: [phone(() => prefix.current)] },
    quantita: { rules: [(v) => (/^\d+$/.test(v) && +v > 0 ? null : "Scrivi un numero intero maggiore di zero.")] },
  });
  const [ritiro, setRitiro] = useState("");
  const [avvisi, setAvvisi] = useState(true);
  const [consenso, setConsenso] = useState(false);
  const { busy, run } = useSubmit();
  const sends = useRef(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.isValid || !ritiro || !consenso) return;
    await run(async () => { sends.current += 1; await wait(900); });
    toast.show({ tone: "success", title: "Richiesta inviata", body: `Invii eseguiti: ${sends.current}. Il doppio clic non ne crea un secondo.` });
  }

  return (
    <form onSubmit={submit} noValidate className="flex max-w-[480px] flex-col gap-1 rounded-card bg-surface p-5 shadow-card">
      <TextField {...form.field("email")} label="Email" type="email" autoComplete="email" placeholder="nome@azienda.it" />
      <PhoneField {...form.field("telefono")} label="Telefono" prefix={pfx} onPrefixChange={(p) => { prefix.current = p; setPfx(p); }} />
      <TextField {...form.field("quantita")} label="Quantità" inputMode="numeric" suffix="sacchi" />
      <SelectField label="Punto di ritiro" value={ritiro} onChange={setRitiro} placeholder="Scegli" options={[{ value: "centro", label: "Magazzino centro" }, { value: "nord", label: "Magazzino nord" }]} />
      <SwitchRow title="Avvisami quando è pronto" description="Email e notifica nell'app." checked={avvisi} onChange={setAvvisi} />
      <div className="py-3"><Checkbox checked={consenso} onChange={setConsenso} label="Ho letto le condizioni di vendita" /></div>
      <FileUpload label="Allegati" accept=".pdf,.jpg,.png" maxMb={20} multiple hint="PDF o foto, fino a 20 MB ciascuno." />
      <FormActions submitLabel="Invia richiesta" busyLabel="Invio" busy={busy} disabled={!form.isValid || !ritiro || !consenso} />
    </form>
  );
}

export const forms: GuideSection = {
  id: "moduli",
  title: "Moduli",
  intro: "Inserire e modificare dati su pagine dedicate. Il modulo decide quando mostrare un errore, impedisce il doppio invio e avvisa prima di perdere modifiche.",
  docs: [
    {
      id: "form-logic",
      name: "Campi e logica del modulo",
      importPath: 'import { useFormFields } from "@/lib/forms/useFormFields";\nimport { useSubmit } from "@/lib/forms/useSubmit";\nimport { useUnsavedChanges } from "@/lib/forms/useUnsavedChanges";',
      origin: "Wrapper del boilerplate",
      purpose: "TextField, PasswordField, PhoneField, SelectField, SwitchRow, Checkbox, FileUpload, FormActions con tre hook: regole di validazione, invio unico, avviso di uscita.",
      demos: [{ label: "Richiesta di materiale", render: () => <OrderForm /> }],
      variants: ["TextField con suffix per unità e valute", "SelectField compact nelle barre dei filtri", "SegmentedControl per 2-4 scelte brevi", "SwitchRow per on/off, Checkbox per consensi e selezioni multiple"],
      states: ["Vuoto: mai rosso, invio disattivo", "Valore non valido: errore all'uscita dal campo, poi in tempo reale", "Invio: «Invio» con indicatore, bottone bloccato", "Modifiche non salvate: conferma prima di uscire"],
      props: [
        ["form.field(nome)", "{ value, onChange, onBlur, error }", "Da spargere su TextField e simili"],
        ["form.isValid / form.dirty", "boolean", "Abilita l'invio / attiva l'avviso di uscita"],
        ["run(task)", "(fn) => Promise", "Esegue un solo invio alla volta"],
        ["useUnsavedChanges(dirty)", "{ allowNext, dialog }", "Conferma su navigazione interna e avviso del browser"],
        ["TextField suffix", "string", "Unità di misura o valuta dentro il campo"],
        ["FormActions", "submitLabel, busy, disabled, cancelTo?", "Annulla solo in creazione/modifica"],
      ],
      use: ["Creazione e modifica su pagina dedicata", "Impostazioni (senza Annulla, con salvataggio attivo solo se cambia qualcosa)"],
      avoid: ["Modali per creare o modificare", "Checkbox per un'impostazione che si accende e spegne", "Input data nativo senza formato italiano esplicito nell'aiuto"],
      wiring: `const form = useFormFields({ titolo: { initial: item?.titolo, rules: [] } });
const { busy, run } = useSubmit();
const guard = useUnsavedChanges(form.dirty);
async function submit(e) {
  e.preventDefault();
  const r = await run(() => saveItem(form.values, item?.id));
  if (!r?.ok) return toast.show({ tone: "error", title: "Salvataggio non riuscito" });
  guard.allowNext(); navigate(\`/elementi/\${r.data.id}\`);
}
// nel JSX: <FormActions cancelTo={back} submitLabel="Salva" busy={busy} disabled={!form.isValid || !form.dirty} /> {guard.dialog}`,
      responsive: "Una colonna, larghezza massima 560 px. I campi occupano tutta la larghezza su mobile; il piede resta allineato a destra.",
      a11y: "Etichetta sempre visibile e collegata; errori in aria-live sotto il campo; aria-invalid; aria-busy sul bottone durante l'invio; tastiera completa sui controlli nativi.",
      customize: ["Regole in lib/validation.ts", "Testi d'aiuto ed errori", "Unità con suffix"],
      mistakes: [
        { wrong: "Checkbox blu nativa per «Mostra collegamenti», «Salva» nero e «Ordina» blu nello stesso progetto.", right: "SwitchRow per on/off; un solo stile per l'azione principale in tutta l'area (primary)." },
        { wrong: "«sacchi» scritto sotto il campo come aiuto.", right: "suffix=\"sacchi\" dentro il campo." },
        { wrong: "«Annulla» nel login e nelle impostazioni senza modifiche.", right: "Nessun Annulla dove non c'è nulla da annullare." },
        { wrong: "Moduli generati da uno schema generico per tutte le entità.", right: "Ogni pagina sceglie i campi giusti; lo schema può aiutare, non decidere i controlli." },
      ],
    },
  ],
};
