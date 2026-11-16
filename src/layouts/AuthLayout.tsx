/*
 * Cornice delle pagine di accesso, ispirata a Stripe: barra in alto con il marchio,
 * card centrata con fascia inferiore, footer con note legali e cambio tema.
 * Per i percorsi a passaggi mostra barra di avanzamento, "Passo X di Y" e Indietro.
 * Card: rounded-window + shadow-raised di Beautiful UI.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { useSeo } from "@/lib/seo";

type AuthLayoutProps = {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** fascia in fondo alla card, es. "Non hai un account? Registrati" */
  aside?: ReactNode;
  /** percorso a passaggi: posizione attuale (1-based) e totale */
  progress?: { current: number; total: number };
  onBack?: () => void;
};

export function AuthLayout({ title, subtitle, children, aside, progress, onBack }: AuthLayoutProps) {
  const { settings } = usePlatform();
  useSeo(title ?? settings.brand.nome);
  return (
    <div className="flex min-h-svh flex-col bg-page">
      <header className="flex h-16 shrink-0 items-center border-b border-line px-4 sm:px-8">
        <Link to="/" className="rounded-[8px] outline-offset-4">
          <BrandMark wordmark />
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-4 pt-10 pb-16 sm:pt-20">
        <section className="relative h-fit w-full max-w-[440px] overflow-hidden rounded-window bg-surface shadow-raised">
          {progress && (
            <div
              className="absolute inset-x-0 top-0 h-1 bg-line"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.current}
              aria-label="Avanzamento"
            >
              <div
                className="h-full bg-accent transition-[width] duration-500"
                style={{ width: `${(progress.current / progress.total) * 100}%`, transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
              />
            </div>
          )}
          <div className="px-6 pt-8 pb-7 sm:px-12 sm:pt-11 sm:pb-9">
            {progress && (
              <div className="-mt-3 mb-4 flex h-7 items-center gap-2 sm:-mt-4">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label="Indietro"
                    title="Indietro"
                    className="-ml-1.5 flex size-7 items-center justify-center rounded-[7px] text-ink-2 hover:bg-hover hover:text-ink"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <span className="text-[12.5px] font-medium tabular-nums text-ink-3">
                  Passo {progress.current} di {progress.total}
                </span>
              </div>
            )}
            {title && <h1 className="text-[22px] font-medium tracking-[-0.02em] text-balance text-ink">{title}</h1>}
            {subtitle && <p className="mt-1.5 text-[14px] leading-[1.5] text-ink-2">{subtitle}</p>}
            <div className={title ? "mt-7" : ""}>{children}</div>
          </div>
          {aside && (
            <div className="border-t border-line bg-inset px-6 py-4 text-center text-[13px] text-ink-2 sm:px-12">
              {aside}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
