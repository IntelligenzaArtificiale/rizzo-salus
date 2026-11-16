/* Cornice delle guide di anteprima (componenti, email): non è una superficie del prodotto. */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useSeo } from "@/lib/seo";

export function DevLayout({ title, intro, children, aside }: { title: string; intro: ReactNode; children: ReactNode; aside?: ReactNode }) {
  useSeo(title, undefined, undefined, true);
  return (
    <div className="flex min-h-svh flex-col bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-8">
          <Link to="/anteprima" className="motion-state flex items-center gap-1.5 rounded-control px-2 py-1.5 text-[13.5px] text-ink-2 hover:bg-hover hover:text-ink"><ArrowLeft size={15} /> Anteprima</Link>
          <span className="ml-auto"><ThemeToggle /></span>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-8 px-4 py-8 sm:px-8 lg:flex-row lg:gap-10">
        {aside && <aside className="shrink-0 lg:sticky lg:top-20 lg:h-[calc(100svh-6rem)] lg:w-56 lg:overflow-y-auto">{aside}</aside>}
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <header className="flex max-w-[720px] flex-col gap-2">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
            <div className="text-[14.5px] leading-relaxed text-ink-2">{intro}</div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
