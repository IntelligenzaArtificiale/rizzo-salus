/*
 * Cornice dell'area riservata, come l'esempio chat di Beautiful UI: Sidebar Nav sul fondo,
 * contenuto su un foglio bianco con bordo sottile. Su mobile la sidebar diventa un pannello
 * che si apre dal pulsante menu. La cronologia chat compare solo se passata (Assistente).
 * Solo superficie APP: il sito pubblico usa SiteLayout, l'accesso AuthLayout (docs/superfici.md).
 * L'header non mostra testi d'ambiente, nomi di account di prova o etichette generiche.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import SidebarNav, {
  type SidebarRecent,
} from "@/components/primitives/SidebarNav";
import { ThemeToggle } from "@/components/site/ThemeToggle";

import { activeKey } from "@/config/navigation";

import { useAction } from "@/clinic/actions";
import { useClinic } from "@/clinic/ClinicContext";
import { clinicNavigation } from "@/clinic/navigation";
import {
  CircleUser,
  LogOut,
  Map,
  ListChecks,
  ChevronRight,
} from "lucide-react";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { BrandLogo } from "@/components/brand/BrandMark";

export const NOTIFICATIONS_CHANGED = "notifiche-aggiornate";

type ChatsConfig = {
  recents: SidebarRecent[];
  activeTitle: string | null;
  onPick: (id: string) => void;
  onNewChat: () => void;
  /** menu ⋯ e rinomina sul posto (assistente): vedi docs/assistente-cronologia.md */
  recentAction?: (item: SidebarRecent, active: boolean) => ReactNode;
  editingRecentId?: string | null;
  renderRecentEditor?: (item: SidebarRecent) => ReactNode;
};

export function AppLayout({
  children,
  chats,
}: {
  children: ReactNode;
  chats?: ChatsConfig;
}) {
  const platform = usePlatform();
  const brand = platform.settings.brand;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const clinic = useClinic();
  const action = useAction();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const items = clinicNavigation(clinic.can);
  const current = items
    .flatMap((i) => i.children || [i])
    .find((i) => pathname === i.key || pathname.startsWith(i.key + "/"));
  const signOut = () =>
    action.act(async () => {
      await clinic.logout();
      navigate("/accedi");
    });

  const sidebar = (
    <SidebarNav
      fill
      /* slot quadrato da 20 px: solo il simbolo (docs/marchio.md), il nome accanto */
      workspace={{
        name: "Rizzo",
        monogram: brand.nome.charAt(0).toUpperCase(),
        logo: <BrandLogo size={20} />,
      }}
      workspaceMenu={[
        {
          label: "Mappa dei moduli",
          icon: <Map size={16} />,
          onClick: () => navigate("/mappa"),
        },
        {
          label: "Decisioni",
          icon: <ListChecks size={16} />,
          onClick: () => navigate("/decisioni"),
        },
        {
          label: "Profilo",
          icon: <CircleUser size={16} />,
          onClick: () => navigate("/profilo"),
        },
      ]}
      onSignOut={signOut}
      navItems={items}
      activeNav={activeKey(items, pathname)}
      onNavigate={(key) => key.startsWith("/") && navigate(key)}
      showChats={Boolean(chats)}
      recents={chats?.recents ?? []}
      activeTitle={chats?.activeTitle ?? null}
      onPick={(id) => chats?.onPick(id)}
      onNewChat={chats?.onNewChat}
      recentAction={chats?.recentAction}
      editingRecentId={chats?.editingRecentId}
      renderRecentEditor={chats?.renderRecentEditor}
      footer={
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => navigate("/profilo")}
            className="flex w-full items-center gap-2 rounded-control px-2 py-2 text-left hover:bg-hover-2"
          >
            <CircleUser size={20} className="shrink-0 text-ink-2" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {clinic.user?.name}
              </span>
              <span className="block text-[11px] capitalize text-ink-3">
                {clinic.user?.role}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-control text-[12px] text-ink-2 hover:bg-hover-2"
          >
            <LogOut size={13} />
            Esci
          </button>
        </div>
      }
      labels={{
        newChat: "Nuova chat",
        chats: "Chat",
        searchChats: "Cerca nelle chat",
        searchHistory: "Cerca nella cronologia",
        closeSearch: "Chiudi ricerca",
        noChats: "Nessuna chat trovata",
        collapse: "Riduci menu",
        expand: "Espandi menu",
        navigation: "Navigazione",
        signOut: "Esci",
      }}
    />
  );

  return (
    <div className="flex h-svh bg-canvas">
      <div className="hidden py-2 pl-1 md:flex">{sidebar}</div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="anim-drawer flex h-full bg-canvas py-2 pl-1 shadow-overlay">
            {sidebar}
          </div>
          <button
            type="button"
            aria-label="Chiudi menu"
            className="flex-1 bg-black/30"
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} className="ml-auto mr-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface shadow-hairline md:rounded-window">
          <div className="flex h-13 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Apri menu"
              className="flex size-8 items-center justify-center rounded-[8px] text-ink-2 hover:bg-hover md:hidden"
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate("/panoramica")}
              className="hidden text-[12px] font-medium text-ink-3 hover:text-ink sm:block"
            >
              Poliambulatorio Rizzo
            </button>
            <ChevronRight
              size={12}
              className="hidden text-ink-3 sm:block"
              aria-hidden
            />
            <span className="truncate text-[12px] text-ink-2">
              {current?.label ||
                (pathname.startsWith("/profilo")
                  ? "Profilo"
                  : pathname.startsWith("/mappa")
                    ? "Mappa dei moduli"
                    : pathname.startsWith("/decisioni")
                      ? "Decisioni"
                      : "")}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {platform.on("temaScuro") && <ThemeToggle />}
            </div>
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Contenitore standard del contenuto: larghezza leggibile, un blocco per riga. */
export function Page({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`page-shell mx-auto flex w-full flex-col px-4 sm:px-8 ${wide ? "max-w-[1180px]" : "max-w-[880px]"}`}
    >
      {children}
    </div>
  );
}
