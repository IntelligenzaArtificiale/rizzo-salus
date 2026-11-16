/*
 * Creazione e modifica di una richiesta su pagina dedicata (mai in una modal o nell'elenco).
 * Stessa pagina, due rotte: /richieste/nuova e /richieste/:id/modifica.
 */
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PageError, PageLoading } from "@/components/app/PageState";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { FormActions } from "@/components/form/FormActions";
import { FileUpload } from "@/components/form/FileUpload";
import { Feature } from "@/components/app/RequireAuth";
import { fieldLabel } from "@/components/form/fieldStyles";
import { useToast } from "@/components/feedback/toast-context";
import { CATEGORIES, getRequest, saveRequest, type RequestItem } from "@/api/requests";
import { useFormFields } from "@/lib/forms/useFormFields";
import { useLoad } from "@/lib/data/useLoad";
import { useSubmit } from "@/lib/forms/useSubmit";
import { useUnsavedChanges } from "@/lib/forms/useUnsavedChanges";

const PRIORITIES = ["Bassa", "Media", "Alta"] as const;
const toKey = (p: (typeof PRIORITIES)[number]) => p.toLowerCase() as RequestItem["priorita"];

export function RequestFormPage() {
  const { id } = useParams();
  const existing = useLoad(() => (id ? getRequest(id) : Promise.resolve({ ok: true as const, data: undefined })), [id]);
  if (id && existing.loading && !existing.data) return <Page><PageLoading /></Page>;
  if (id && (existing.error || !existing.data)) return <Page><PageError onRetry={existing.reload} /></Page>;
  return <RequestForm item={existing.data} />;
}

function RequestForm({ item }: { item?: RequestItem }) {
  const navigate = useNavigate();
  const toast = useToast();
  const form = useFormFields({
    titolo: { initial: item?.titolo, rules: [] },
    cliente: { initial: item?.cliente, rules: [] },
    descrizione: { initial: item?.descrizione, rules: [] },
  });
  const [categoria, setCategoria] = useState(item?.categoria ?? "");
  const [priorita, setPriorita] = useState<(typeof PRIORITIES)[number]>(item ? (PRIORITIES.find((p) => toKey(p) === item.priorita) ?? "Media") : "Media");
  const { busy: saving, run } = useSubmit();
  const initialPriority = item ? (PRIORITIES.find((p) => toKey(p) === item.priorita) ?? "Media") : "Media";
  const dirty = form.dirty || categoria !== (item?.categoria ?? "") || priorita !== initialPriority;
  const guard = useUnsavedChanges(dirty);
  const backTo = item ? `/richieste/${item.id}` : "/richieste";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid || !categoria) return;
    const v = form.values;
    const result = await run(() => saveRequest({ titolo: v.titolo.trim(), cliente: v.cliente.trim(), descrizione: v.descrizione.trim(), categoria, priorita: toKey(priorita) }, item?.id));
    if (!result) return;
    if (!result.ok) return toast.show({ tone: "error", title: "Salvataggio non riuscito", body: "Riprova tra qualche istante." });
    toast.show({ tone: "success", title: item ? "Modifiche salvate" : `${result.data.id} creata` });
    guard.allowNext();
    navigate(`/richieste/${result.data.id}`);
  }

  return (
    <Page>
      <PageHeader back={{ to: backTo, label: item ? item.id : "Richieste" }} title={item ? "Modifica richiesta" : "Nuova richiesta"} />
      <form onSubmit={submit} noValidate className="flex max-w-[560px] flex-col gap-1">
        <TextField {...form.field("titolo")} label="Titolo" placeholder="Fornitura adesivo per piastrelle" autoFocus={!item} maxLength={120} />
        <TextField {...form.field("cliente")} label="Cliente" placeholder="Ragione sociale" autoComplete="organization" />
        <SelectField label="Categoria" value={categoria} onChange={setCategoria} placeholder="Scegli" options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <div className="flex flex-col gap-1.5 pb-[18px]">
          <span className={fieldLabel}>Priorità</span>
          <SegmentedControl options={PRIORITIES} value={priorita} onChange={setPriorita} className="w-fit" />
        </div>
        <TextAreaField {...form.field("descrizione")} error={null} label="Descrizione" placeholder="Cosa serve, quanto e per quando" maxLength={1000} />
        <Feature name="upload">
          <FileUpload label="Allegati" accept=".pdf,.xlsx,.jpg,.jpeg,.png" maxMb={20} multiple hint="PDF, Excel o foto, fino a 20 MB ciascuno." />
        </Feature>
        <FormActions cancelTo={backTo} submitLabel={item ? "Salva" : "Crea"} busy={saving} disabled={!form.isValid || !categoria || (Boolean(item) && !dirty)} />
      </form>
      {guard.dialog}
    </Page>
  );
}
