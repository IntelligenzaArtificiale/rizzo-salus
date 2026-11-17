import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
// Il titolare cura le procedure; gli operatori consultano i documenti pubblicati per il proprio ruolo.
import { useEffect, useState } from "react";
import { Plus, BookOpen, Download, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { TableToolbar, matches } from "@/components/app/TableToolbar";
import { Button, buttonVariants } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { Checkbox } from "@/components/form/Checkbox";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { EmptyState } from "@/components/app/PageState";
import { ClinicFileField, fileBase64 } from "./ClinicFileField";
import { extractDocumentText } from "./document-text";
import { api, downloadUrl, type Data } from "./api";
import { LoadState, useLoad, useAction, date } from "./common";
const roles = ["segreteria", "medico", "fisioterapista", "amministrazione"];
const initial = (): Data => ({ titolo: "", testo: "", ruoli: [...roles], attivo: true });
export function TrainingPage() {
  const navigate = useNavigate(), pathname = useLocation().pathname, [params] = useSearchParams();
  const form = pathname !== "/formazione", editId = params.get("id");
  const load = useLoad(() => api("/formazione/elenco")), action = useAction();
  const [q, setQ] = useState(""), [edit, setEdit] = useState<Data | null>(null), [reading, setReading] = useState(false), [remove, setRemove] = useState<Data | null>(null), [opened, setOpened] = useState<string | null>(null);
  useEffect(() => { if (form && !editId) setEdit(initial()); else if (form && editId && load.data) setEdit(load.data.documenti.find((d: Data) => d.id === editId) || null); else setEdit(null); }, [form, editId, load.data]);
  const patch = (p: Data) => setEdit(v => ({ ...v, ...p }));
  const upload = async (f: File) => {
    setReading(true);
    try {
      const text = await extractDocumentText(f), base64 = await fileBase64(f);
      setEdit(v => ({ ...v, titolo: v?.titolo || f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "), testo: text,
        allegato: { base64, nome_file: f.name, mime: /\.docx$/i.test(f.name) ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : /\.pdf$/i.test(f.name) ? "application/pdf" : "text/plain" } }));
    } finally { setReading(false); }
  };
  return <LoadState load={load} wide>
    <PageHeader title={form ? editId ? "Modifica procedura" : "Nuova procedura" : "Formazione"} back={form ? { to: "/formazione", label: "Formazione" } : undefined} subtitle="Procedure e indicazioni del centro, disponibili anche nell’AI operatore."
      actions={!form && load.data?.gestibile ? <Button variant="primary" onClick={() => navigate("/formazione/nuova")}><Plus size={16} />Nuova procedura</Button> : undefined} />
    {edit && load.data?.gestibile && <form className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5" onSubmit={e => { e.preventDefault(); action.act(async () => { await api("/formazione/salva", edit); setEdit(null); load.reload(); navigate("/formazione"); }, "Procedura salvata"); }}>

      <TextField label="Titolo" value={edit.titolo} onChange={titolo => patch({ titolo })} />
      <ClinicFileField key={edit.id || "new"} label="Documento della procedura" accept=".pdf,.docx,.txt" onFile={upload} disabled={action.busy} />
      <TextAreaField label="Testo della procedura" value={edit.testo} onChange={testo => patch({ testo })} rows={10} placeholder="Carica un documento oppure scrivi qui le indicazioni per gli operatori." />
      <fieldset className="flex flex-wrap gap-4"><legend className="mb-2 text-sm font-medium">Disponibile per</legend>{roles.map(role => <Checkbox key={role} label={role === "medico" ? "Medici" : role === "fisioterapista" ? "Fisioterapisti" : role.charAt(0).toUpperCase() + role.slice(1)} checked={edit.ruoli.includes(role)} onChange={v => patch({ ruoli: v ? [...edit.ruoli, role] : edit.ruoli.filter((x: string) => x !== role) })} />)}</fieldset>
      <Checkbox label="Pubblicata e utilizzabile dall’assistente" checked={edit.attivo} onChange={attivo => patch({ attivo })} />
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={reading || action.busy} onClick={() => navigate("/formazione")}>Annulla</Button><Button type="submit" variant="primary" disabled={reading || action.busy || !edit.titolo.trim() || !edit.testo.trim()}>{reading ? "Lettura…" : action.busy ? "Salvataggio…" : "Salva procedura"}</Button></div>
    </form>}
    {!form && <>
    <TableToolbar query={q} onQuery={setQ} placeholder="Cerca una procedura o un argomento" />
    <div className="flex flex-col gap-3">{(load.data?.documenti || []).filter((r: Data) => matches(q, r.titolo, r.testo)).map((r: Data) => <article key={r.id} className="rounded-card border border-line p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3"><BookOpen size={21} className="mt-1 shrink-0 text-ink-2" /><div className="min-w-0 flex-1"><h2 className="text-base font-semibold text-ink">{r.titolo}</h2><p className="mt-1 text-xs text-ink-2">{r.attivo ? "Pubblicata" : "Bozza"} · Aggiornata {date(r.aggiornato)}{load.data?.gestibile && ` · ${(r.ruoli || []).join(", ") || "Solo titolare"}`}</p></div>
        <Button variant="secondary" size="sm" aria-expanded={opened === r.id} onClick={() => setOpened(opened === r.id ? null : r.id)}>{opened === r.id ? "Chiudi" : "Leggi"}</Button>
        {r.file && <a className={buttonVariants({ variant: "quiet", size: "sm" })} href={downloadUrl("/formazione/scarica", { id: r.id })}><Download size={15} />Documento</a>}
        {load.data?.gestibile && <><Button variant="quiet" size="sm" aria-label={`Modifica ${r.titolo}`} onClick={() => navigate("/formazione/modifica?id=" + r.id)}><Pencil size={15} /></Button><Button variant="quiet" size="sm" aria-label={`Elimina ${r.titolo}`} onClick={() => setRemove(r)}><Trash2 size={15} /></Button></>}
      </div>{opened === r.id ? <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-sm leading-relaxed text-ink">{r.testo}</p> : <p className="mt-3 line-clamp-2 text-sm text-ink-2">{r.testo}</p>}
    </article>)}</div>
    {!load.data?.documenti?.length && <EmptyState title="Le procedure del centro, in un unico posto" description={load.data?.gestibile ? "Aggiungi il primo documento per aiutare gli operatori nelle attività di ogni giorno." : "Le procedure pubblicate per il tuo ruolo compariranno qui."} />}
    </>}
    <ConfirmDialog open={!!remove} title="Eliminare la procedura?" actionLabel="Elimina procedura" busy={action.busy} onClose={() => setRemove(null)} onConfirm={() => action.act(async () => { await api("/formazione/elimina", { id: remove?.id, revision: remove?.revision }); setRemove(null); load.reload(); }, "Procedura eliminata")}>Il documento non sarà più disponibile agli operatori e all’assistente.</ConfirmDialog>
  </LoadState>;
}
