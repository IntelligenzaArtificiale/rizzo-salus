/* SEO: titolo e descrizione predefiniti, immagine per i social, indicizzazione, anteprima su Google. */
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { FileUpload } from "@/components/form/FileUpload";
import { SwitchRow } from "@/components/form/SwitchRow";
import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";
import { Feature } from "@/components/app/RequireAuth";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";

export function SeoTab() {
  const { settings, update } = usePlatform();
  const form = useSettingsForm(settings.seo, (seo) => update({ seo }), "SEO aggiornato");
  const s = form.value;
  return (
    <>
    <form onSubmit={form.submit} noValidate>
      <SettingsSection title="Titoli e descrizione" description="Valgono per tutte le pagine che non ne hanno uno proprio.">
        <TextField label="Modello del titolo" value={s.titolo} onChange={(v) => form.patch({ titolo: v })} hint="%s diventa il titolo della pagina." />
        <TextAreaField label="Descrizione predefinita" value={s.descrizione} onChange={(v) => form.patch({ descrizione: v })} maxLength={160} rows={2} />
      </SettingsSection>
      <Feature name="upload">
        <SettingsSection title="Condivisione" description="L'immagine che compare quando qualcuno condivide un link.">
          <FileUpload label="Immagine per i social" accept="image/png,image/jpeg" maxMb={1} hint="1200×630, JPG o PNG, fino a 1 MB." onChange={(f) => f[0]?.url && form.patch({ immagine: f[0].url })} />
          {s.immagine && <img src={s.immagine} alt="Immagine per i social attuale" className="aspect-[1200/630] w-full max-w-[360px] rounded-[10px] object-cover shadow-hairline" />}
        </SettingsSection>
      </Feature>
      <SettingsSection title="Motori di ricerca" description="Spegni durante le prove o per una piattaforma solo interna.">
        <SwitchRow title="Fai trovare il sito ai motori di ricerca" description="Spento: le pagine chiedono di non essere indicizzate." checked={s.indicizza} onChange={(v) => form.patch({ indicizza: v })} />
        <div className="mt-4 rounded-card border border-line p-4" aria-label="Anteprima su Google">
          <p className="text-[12.5px] text-ink-3">{location.host}/blog</p>
          <p className="mt-0.5 text-[18px] text-accent-ink">{s.titolo.replace("%s", "Blog")}</p>
          <p className="mt-1 text-[13.5px] leading-[1.5] text-ink-2">{s.descrizione}</p>
        </div>
      </SettingsSection>
      <SaveBar dirty={form.dirty} busy={form.busy} onReset={form.reset} />
    </form>
    {form.dialog}
    </>
  );
}
