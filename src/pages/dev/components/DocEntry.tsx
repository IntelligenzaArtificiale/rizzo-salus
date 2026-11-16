/*
 * Una scheda componente: intestazione (nome, origine, import), esempio dal vivo con scelta del dominio,
 * e le domande del mapping in schede (uso, props, dati, responsive e accessibilità, errori comuni).
 */
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { PageTabs } from "@/components/app/PageTabs";
import CodeBlock from "@/components/primitives/CodeBlock";
import type { ComponentDoc } from "@/pages/dev/components/types";
import { DocUsage, DocProps, DocMistakes } from "@/pages/dev/components/DocParts";

const TABS = ["Uso", "Props e slot", "Dati e azioni", "Responsive e accessibilità", "Errori comuni"] as const;

export function DocEntry({ doc }: { doc: ComponentDoc }) {
  const [domain, setDomain] = useState(doc.demos[0]?.label ?? "");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Uso");
  const [copied, setCopied] = useState(false);
  const demo = doc.demos.find((d) => d.label === domain) ?? doc.demos[0];
  const copy = () => { void navigator.clipboard?.writeText(doc.importPath); setCopied(true); setTimeout(() => setCopied(false), 1400); };

  return (
    <article id={doc.id} className="flex scroll-mt-20 flex-col gap-4 border-t border-line pt-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{doc.name}</h3>
          <span className="rounded-full bg-inset px-2 py-0.5 text-[12px] font-medium text-ink-2">{doc.origin}</span>
        </div>
        <p className="max-w-[720px] text-[14.5px] leading-relaxed text-ink-2">{doc.purpose}</p>
        <button type="button" onClick={copy} className="motion-state flex w-fit max-w-full items-center gap-2 rounded-control bg-field px-2.5 py-1.5 font-mono text-[12.5px] text-ink-2 shadow-hairline hover:text-ink" aria-label={`Copia l'import di ${doc.name}`}>
          <span className="truncate">{doc.importPath}</span>{copied ? <Check size={13} className="shrink-0 text-green" /> : <Copy size={13} className="shrink-0" />}
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-window bg-inset p-3 sm:p-5">
        {doc.demos.length > 1 && (
          <PageTabs label="Esempio" options={doc.demos.map((d) => d.label)} value={demo.label} onChange={setDomain} />
        )}
        <div key={demo.label} className="anim-swap min-w-0">{demo.render()}</div>
      </div>

      <PageTabs label="Argomento" options={TABS} value={tab} onChange={setTab} />
      <div key={tab} className="anim-swap">
        {tab === "Uso" && <DocUsage doc={doc} />}
        {tab === "Props e slot" && <DocProps doc={doc} />}
        {tab === "Dati e azioni" && <CodeBlock lines={doc.wiring.split("\n")} filename="esempio.tsx" labels={{ copy: "Copia", copied: "Copiato" }} />}
        {tab === "Responsive e accessibilità" && (
          <dl className="grid max-w-[760px] gap-4 text-[14px] leading-relaxed sm:grid-cols-2">
            <div><dt className="mb-1 font-medium text-ink">Responsive</dt><dd className="text-ink-2">{doc.responsive}</dd></div>
            <div><dt className="mb-1 font-medium text-ink">Accessibilità</dt><dd className="text-ink-2">{doc.a11y}</dd></div>
          </dl>
        )}
        {tab === "Errori comuni" && <DocMistakes doc={doc} />}
      </div>
    </article>
  );
}
