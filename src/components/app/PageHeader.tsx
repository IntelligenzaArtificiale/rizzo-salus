/*
 * Intestazione di pagina: eventuale "indietro", titolo (h1, 24px), una riga di contesto
 * e le azioni a destra. Le azioni restano poche: una principale, il resto icone.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSeo } from "@/lib/seo";

type PageHeaderProps = { title: string; subtitle?: ReactNode; back?: { to: string; label: string }; actions?: ReactNode };

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  /* area riservata: titolo nella scheda del browser, mai indicizzata */
  useSeo(title, undefined, undefined, true);
  return (
    <header className="flex flex-col gap-2">
      {back && (
        <Link to={back.to} className="-ml-1 inline-flex w-fit items-center gap-1.5 rounded-[7px] px-1 py-0.5 text-[13px] font-medium text-ink-2 hover:text-ink">
          <ArrowLeft size={15} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate text-[24px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {subtitle && <p className="text-[14px] text-ink-2">{subtitle}</p>}
    </header>
  );
}
