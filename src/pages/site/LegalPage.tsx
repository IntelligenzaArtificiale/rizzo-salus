/*
 * Note legali sul SITO. I testi definitivi arrivano dal titolare del trattamento:
 * qui la struttura e i contatti del marchio, senza testi provvisori in vista.
 */
import { SiteLayout } from "@/layouts/SiteLayout";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { useSeo } from "@/lib/seo";
import { LEGAL_SECTIONS } from "@/config/legal";

export function LegalPage() {
  const { brand } = usePlatform().settings;
  useSeo("Privacy e termini");
  return (
    <SiteLayout>
      <article className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-ink">Privacy e termini</h1>
          <p className="text-[15px] leading-relaxed text-ink-2">Come {brand.nome} tratta i dati di chi usa la piattaforma.</p>
        </header>
        {LEGAL_SECTIONS.map((s) => (
          <section key={s.title} className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold text-ink">{s.title}</h2>
            <p className="text-[15px] leading-relaxed text-ink-2">{s.body}</p>
          </section>
        ))}
        {brand.email && (
          <p className="text-[15px] text-ink-2">Per esercitare i tuoi diritti scrivi a <a href={`mailto:${brand.email}`} className="font-medium text-accent-ink hover:underline">{brand.email}</a>.</p>
        )}
      </article>
    </SiteLayout>
  );
}
