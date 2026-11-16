/** Footer condiviso: identità e tema nella prima riga, link leggibili e contatti a seguire. */
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { usePlatform } from "@/lib/platform/PlatformContext";

const YEAR = new Date().getFullYear();

export function SiteFooter({ contacts = false }: { contacts?: boolean }) {
  const { settings, on } = usePlatform();
  const { brand } = settings;
  return (
    <footer className="border-t border-line px-4 py-5 text-[12.5px] text-ink-2 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
        <div className="flex min-w-0 items-center justify-between gap-4 sm:contents">
          <span className="min-w-0 break-words leading-5">© {YEAR} {brand.nome}</span>
          {on("temaScuro") && <div className="shrink-0 sm:order-last sm:ml-auto"><ThemeToggle /></div>}
        </div>
        <nav aria-label="Link nel footer" className="-ml-2 flex flex-wrap items-center gap-x-1">
          <Link to="/privacy" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-control px-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent">Privacy e termini</Link>
          {on("blog") && <Link to="/blog" className="inline-flex min-h-11 items-center rounded-control px-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent">Blog</Link>}
        </nav>
        {contacts && <div className="flex min-w-0 flex-col gap-2 leading-5 sm:flex-row sm:flex-wrap sm:gap-x-5">
          {brand.indirizzo && <span>{brand.indirizzo}</span>}
          {brand.email && <a href={`mailto:${brand.email}`} className="break-all hover:text-ink">{brand.email}</a>}
          {brand.telefono && <a href={`tel:${brand.telefono.replace(/\s/g, "")}`} className="hover:text-ink">{brand.telefono}</a>}
        </div>}
      </div>
    </footer>
  );
}
