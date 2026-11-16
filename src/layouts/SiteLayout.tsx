/*
 * Superficie SITO: pagine pubbliche (blog, note legali, cataloghi consultabili senza account).
 * Header orizzontale con logotipo, link del sito e ingresso all'area riservata; footer con contatti.
 * Mai SidebarNav o cornici dell'app: regole in docs/superfici.md.
 * La landing di un progetto si progetta a parte (Hallmark / Design Taste) e porta alla CTA di registrazione.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { buttonVariants } from "@/components/atoms/Button";
import { useClinic } from "@/clinic/ClinicContext";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { SITE_LINKS } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteLayout({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const { on } = usePlatform();
  const { user } = useClinic();
  const links = SITE_LINKS.filter((l) => !l.feature || on(l.feature));
  return (
    <div className="flex min-h-svh flex-col bg-page">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center gap-6 px-4 sm:px-8">
          <Link to="/" className="rounded-[8px] outline-offset-4">
            <BrandMark wordmark />
          </Link>
          <nav aria-label="Sito" className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="motion-state rounded-control px-2.5 py-1.5 text-[14px] text-ink-2 hover:bg-hover hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <Link
                to="/"
                className={cn(buttonVariants({ variant: "primary" }), "h-9")}
              >
                Area riservata
              </Link>
            ) : (
              <>
                <Link
                  to="/accedi"
                  className={cn(buttonVariants({ variant: "quiet" }), "h-9")}
                >
                  Accedi
                </Link>
                {on("registrazione") && (
                  <Link
                    to="/registrazione"
                    className={cn(buttonVariants({ variant: "accent" }), "h-9")}
                  >
                    Registrati
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto w-full flex-1 px-4 py-10 sm:px-8 sm:py-14",
          wide ? "max-w-[1180px]" : "max-w-[760px]",
        )}
      >
        {children}
      </main>
      <SiteFooter contacts />
    </div>
  );
}
