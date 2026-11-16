/*
 * Anteprima dei template email con il marchio attuale: desktop/mobile, chiaro/scuro, HTML/testo.
 * Non esiste un comando di invio: la pagina compone l'email nel browser e la mostra in un iframe
 * isolato (sandbox senza script). L'invio reale è compito del backend. Guida: docs/email.md.
 */
import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/atoms/SegmentedControl";
import { PageTabs } from "@/components/app/PageTabs";
import { DevLayout } from "@/pages/dev/DevLayout";
import { EMAIL_TEMPLATES } from "@/email/catalog";
import { renderEmail } from "@/email/render";
import { usePlatform } from "@/lib/platform/PlatformContext";

const DEVICES = ["Desktop", "Mobile"] as const;
const THEMES = ["Chiaro", "Scuro"] as const;
const VIEWS = ["Email", "Solo testo"] as const;

export function EmailPreviewPage() {
  const { brand } = usePlatform().settings;
  const [key, setKey] = useState(EMAIL_TEMPLATES[0].label);
  const [device, setDevice] = useState<(typeof DEVICES)[number]>("Desktop");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("Chiaro");
  const [view, setView] = useState<(typeof VIEWS)[number]>("Email");
  const template = EMAIL_TEMPLATES.find((t) => t.label === key) ?? EMAIL_TEMPLATES[0];
  const mail = useMemo(() => renderEmail(template, brand, theme === "Scuro"), [template, brand, theme]);

  return (
    <DevLayout title="Email" intro={<>Le email della piattaforma con il marchio attuale. Da qui non parte nessun messaggio: l'invio lo fa il backend con gli stessi file di <code className="text-[13px]">src/email</code>.</>}>
      <div className="flex flex-col gap-3">
        <PageTabs label="Email" options={EMAIL_TEMPLATES.map((t) => t.label)} value={template.label} onChange={setKey} />
        <div className="flex flex-wrap gap-2">
          <SegmentedControl options={DEVICES} value={device} onChange={setDevice} />
          <SegmentedControl options={THEMES} value={theme} onChange={setTheme} />
          <SegmentedControl options={VIEWS} value={view} onChange={setView} />
        </div>
      </div>
      <dl className="grid max-w-[720px] grid-cols-[110px_1fr] gap-x-4 gap-y-1.5 text-[13.5px]">
        <dt className="text-ink-3">Oggetto</dt><dd className="font-medium text-ink">{mail.subject}</dd>
        <dt className="text-ink-3">Anteprima</dt><dd className="text-ink-2">{template.preheader}</dd>
      </dl>
      <div className="flex justify-center rounded-window bg-inset p-3 sm:p-6">
        {view === "Email" ? (
          <iframe key={`${template.key}-${theme}`} title={`Anteprima: ${template.label}`} sandbox="" srcDoc={mail.html}
            className={`anim-swap h-[640px] rounded-[12px] bg-white shadow-card ${device === "Mobile" ? "w-[375px]" : "w-full max-w-[640px]"}`} />
        ) : (
          <pre className="anim-swap w-full max-w-[640px] overflow-x-auto rounded-[12px] bg-surface p-5 text-[13px] leading-relaxed whitespace-pre-wrap text-ink shadow-card">{mail.text}</pre>
        )}
      </div>
    </DevLayout>
  );
}
