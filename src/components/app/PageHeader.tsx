/*
 * Intestazione di pagina: eventuale "indietro", titolo (h1, 24px), una riga di contesto
 * e le azioni a destra. Le azioni restano poche: una principale, il resto icone.
 */
import { useEffect, type ReactNode } from "react";
import { BREADCRUMB_EVENT, type Crumb } from "./Breadcrumbs";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSeo } from "@/lib/seo";

type PageHeaderProps = { title: string; subtitle?: ReactNode; back?: { to: string; label: string }; actions?: ReactNode; breadcrumbs?: Crumb[]; compact?: boolean };

export function PageHeader({ title, subtitle, back, actions, breadcrumbs, compact = false }: PageHeaderProps) {
  /* area riservata: titolo nella scheda del browser, mai indicizzata */
  useSeo(title, undefined, undefined, true);
  const { pathname } = useLocation();
  const crumbsKey = JSON.stringify(breadcrumbs || [...(back ? [{ label: back.label, to: back.to }] : []), { label: title }]);
  useEffect(() => { window.dispatchEvent(new CustomEvent(BREADCRUMB_EVENT, { detail: { path: pathname, items: JSON.parse(crumbsKey) } })); }, [pathname, crumbsKey]);
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {back && <Link to={back.to} aria-label={`Torna a ${back.label}`} title={`Torna a ${back.label}`} className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 hover:bg-hover"><ArrowLeft size={16} /></Link>}
        <h1 className={`min-w-0 flex-1 truncate ${compact || back ? "text-[20px]" : "text-[24px]"} font-semibold tracking-[-0.02em] text-ink`}>{title}</h1>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {subtitle && <p className="text-[14px] text-ink-2">{subtitle}</p>}
    </header>
  );
}
