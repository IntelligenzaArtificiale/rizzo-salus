/*
 * Editor di un articolo su pagina dedicata: titolo e indirizzo (creato dal titolo finché
 * non lo cambi a mano), estratto, copertina (upload), testo con risorse incorporate,
 * campi SEO con i limiti consigliati, pubblicazione. Eliminare chiede conferma.
 */
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ExternalLink, Trash2 } from "lucide-react";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Section } from "@/components/app/Section";
import { PageError, PageLoading } from "@/components/app/PageState";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { FileUpload } from "@/components/form/FileUpload";
import { SwitchRow } from "@/components/form/SwitchRow";
import { FormActions } from "@/components/form/FormActions";
import { EmbedField } from "@/components/content/EmbedField";
import { Feature } from "@/components/app/RequireAuth";
import { useToast } from "@/components/feedback/toast-context";
import { deletePost, getPost, savePost, type BlogPost } from "@/api/blog";
import { useLoad } from "@/lib/data/useLoad";
import { slugify } from "@/lib/markdown";

export function BlogEditorPage() {
  const { id } = useParams();
  const existing = useLoad(() => (id ? getPost(id) : Promise.resolve({ ok: true as const, data: undefined })), [id]);
  if (id && existing.loading && !existing.data) return <Page><PageLoading /></Page>;
  if (id && (existing.error || !existing.data)) return <Page><PageError onRetry={existing.reload} /></Page>;
  return <Editor post={existing.data} />;
}

function Editor({ post }: { post?: BlogPost }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [v, setV] = useState({
    titolo: post?.titolo ?? "", slug: post?.slug ?? "", estratto: post?.estratto ?? "", corpo: post?.corpo ?? "",
    copertina: post?.copertina ?? "", seoTitolo: post?.seoTitolo ?? "", seoDescrizione: post?.seoDescrizione ?? "", pubblicato: post?.pubblicato ?? false,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [slugTaken, setSlugTaken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const set = (k: keyof typeof v) => (value: string | boolean) => setV((s) => ({ ...s, [k]: value }));
  const valid = v.titolo.trim() && v.slug && v.corpo.trim();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const r = await savePost(v, post?.id);
    setSaving(false);
    if (!r.ok) return r.error === "slug_esistente" ? setSlugTaken(true) : toast.show({ tone: "error", title: "Salvataggio non riuscito" });
    toast.show({ tone: "success", title: v.pubblicato ? "Articolo pubblicato" : "Bozza salvata" });
    navigate("/admin/blog");
  }

  async function remove() {
    await deletePost(post!.id);
    toast.show({ tone: "success", title: "Articolo eliminato" });
    navigate("/admin/blog");
  }

  return (
    <Page>
      <PageHeader
        back={{ to: "/admin/blog", label: "Blog" }}
        title={post ? "Modifica articolo" : "Nuovo articolo"}
        actions={post && (
          <>
            {post.pubblicato && <IconButton label="Apri l'articolo" icon={<ExternalLink size={15} />} to={`/blog/${post.slug}`} />}
            <IconButton label="Elimina" icon={<Trash2 size={15} />} tone="danger" onClick={() => setConfirm(true)} />
          </>
        )}
      />
      <form onSubmit={submit} noValidate className="flex max-w-[640px] flex-col gap-8">
        <Section title="Contenuto">
          <div className="flex flex-col gap-1">
            <TextField label="Titolo" value={v.titolo} autoFocus={!post} maxLength={120}
              onChange={(t) => { set("titolo")(t); if (!slugTouched) set("slug")(slugify(t)); }} />
            <TextField label="Indirizzo" value={v.slug} hint={`/blog/${v.slug || "…"}`} error={slugTaken ? "Esiste già un articolo con questo indirizzo." : null}
              onChange={(t) => { setSlugTouched(true); setSlugTaken(false); set("slug")(slugify(t)); }} />
            <TextAreaField label="Estratto" value={v.estratto} onChange={set("estratto")} maxLength={200} rows={2} placeholder="Una o due frasi che invogliano a leggere" />
            <Feature name="upload">
              <FileUpload label="Copertina" accept="image/*" maxMb={5} hint="JPG, PNG o WebP fino a 5 MB." onChange={(files) => set("copertina")(files[0]?.url ?? "")} />
            </Feature>
            <TextAreaField label="Testo" value={v.corpo} onChange={set("corpo")} rows={10} placeholder={"Paragrafi separati da una riga vuota.\n## Titolo di sezione\n- punto elenco"} />
            <EmbedField onInsert={(url) => set("corpo")(`${v.corpo.trimEnd()}\n\n@embed ${url}\n`)} />
          </div>
        </Section>
        <Section title="Motori di ricerca">
          <div className="flex flex-col gap-1">
            <TextField label="Titolo per Google" value={v.seoTitolo} onChange={set("seoTitolo")} placeholder={v.titolo} maxLength={60} hint={`${(v.seoTitolo || v.titolo).length}/60 caratteri. Vuoto: usa il titolo.`} />
            <TextAreaField label="Descrizione per Google" value={v.seoDescrizione} onChange={set("seoDescrizione")} maxLength={160} rows={2} placeholder={v.estratto} />
          </div>
        </Section>
        <SwitchRow title="Pubblicato" description="Visibile a tutti nel blog. Spento: resta una bozza." checked={v.pubblicato} onChange={set("pubblicato")} />
        <FormActions cancelTo="/admin/blog" submitLabel={v.pubblicato ? "Pubblica" : "Salva bozza"} busy={saving} disabled={!valid || slugTaken} />
      </form>
      {post && (
        <ConfirmDialog open={confirm} title="Eliminare l'articolo?" actionLabel="Elimina" onConfirm={remove} onClose={() => setConfirm(false)}>
          L'indirizzo /blog/{post.slug} non funzionerà più.
        </ConfirmDialog>
      )}
    </Page>
  );
}
