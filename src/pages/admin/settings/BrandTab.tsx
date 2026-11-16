/*
 * Marchio (white label): nome, colore principale, file del marchio (simbolo e logotipo con varianti
 * scure), contatti. Il colore è controllato: con contrasto basso i testi dei bottoni si leggono male.
 */
import { TextField } from "@/components/form/TextField";
import { fieldLabel } from "@/components/form/fieldStyles";
import { Feature } from "@/components/app/RequireAuth";
import { SaveBar, SettingsSection } from "@/components/app/SettingsSection";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { isHex, whiteContrast } from "@/lib/platform/brandColors";
import { email } from "@/lib/validation";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";
import { BrandAssetsFields } from "@/pages/admin/settings/BrandAssetsFields";
import type { Brand } from "@/lib/platform/defaults";

export function BrandTab() {
  const { settings, update } = usePlatform();
  const form = useSettingsForm(settings.brand, (brand) => update({ brand: { ...brand, nome: brand.nome.trim() } }), "Marchio aggiornato");
  const b = form.value;
  const set = (k: keyof Brand) => (v: string) => form.patch({ [k]: v } as Partial<Brand>);
  const contrast = isHex(b.colore) ? whiteContrast(b.colore) : 0;
  const valid = Boolean(b.nome.trim()) && isHex(b.colore) && !email(b.email);

  return (
    <>
    <form onSubmit={(e) => (valid ? form.submit(e) : e.preventDefault())} noValidate>
      <SettingsSection title="Identità" description="Il nome compare nella sidebar, nelle email e nei titoli delle pagine.">
        <TextField label="Nome della piattaforma" value={b.nome} onChange={set("nome")} maxLength={40} />
        <div className="flex flex-col gap-1.5 pb-[18px]">
          <span className={fieldLabel}>Colore principale</span>
          <div className="flex flex-wrap items-center gap-3">
            <input type="color" value={isHex(b.colore) ? b.colore : "#000000"} onChange={(e) => set("colore")(e.target.value)} aria-label="Scegli il colore" className="h-10 w-12 cursor-pointer rounded-control border border-line-strong bg-surface p-1" />
            <TextField label="" aria-label="Codice colore" value={b.colore} onChange={set("colore")} className="w-32 pb-0 [&>p]:hidden" />
            {/* colore scelto dall'utente: unico valore dinamico in linea */}
            <span className="flex h-9 items-center rounded-full px-3.5 text-[14px] font-semibold text-white" style={{ background: isHex(b.colore) ? b.colore : undefined }}>Anteprima</span>
          </div>
          <p className={`text-[12.5px] ${contrast && contrast < 4.5 ? "text-red" : "text-ink-3"}`}>
            {contrast && contrast < 4.5 ? `Contrasto ${contrast.toFixed(1)}:1: il testo bianco si legge male. Scegli un colore più scuro.` : contrast ? `Contrasto ${contrast.toFixed(1)}:1, leggibile.` : "Formato #RRGGBB."}
          </p>
        </div>
      </SettingsSection>
      <Feature name="upload">
        <SettingsSection title="File del marchio" description="Simbolo quadrato per la sidebar e la favicon, logotipo orizzontale per sito e accesso. Sfondo trasparente.">
          <BrandAssetsFields brand={b} onChange={(k, v) => set(k)(v)} />
        </SettingsSection>
      </Feature>
      <SettingsSection title="Contatti" description="Compaiono nel footer del sito e nelle email.">
        <TextField label="Email di contatto" type="email" value={b.email} onChange={set("email")} error={email(b.email)} />
        <TextField label="Telefono" value={b.telefono} onChange={set("telefono")} />
        <TextField label="Indirizzo" value={b.indirizzo} onChange={set("indirizzo")} />
      </SettingsSection>
      <SaveBar dirty={form.dirty} busy={form.busy} onReset={form.reset} />
    </form>
    {form.dialog}
    </>
  );
}
