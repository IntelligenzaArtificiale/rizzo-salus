"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconArrowBoxLeft } from "@/components/icons/central";
import { IconCheckmark1Small } from "@/components/icons/central";
import { IconChevronDownSmall } from "@/components/icons/central";
import { IconCrossSmall } from "@/components/icons/central";
import { IconEditBig } from "@/components/icons/central";
import { IconHome } from "@/components/icons/central";
import { IconMagnifyingGlass } from "@/components/icons/central";
import { IconPlusMedium } from "@/components/icons/central";
import { IconPopsicle2 } from "@/components/icons/central";
import { IconSettingsGear1 } from "@/components/icons/central";
import { IconSidebarLeftArrow } from "@/components/icons/central";
import { IconUserAdd } from "@/components/icons/central";
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * SIDEBAR NAV
 * Shared by the design-system preview and the harness shell:
 * compact workspace switcher, primary navigation, searchable
 * chat history, and a collapse that preserves icon alignment.
 * ───────────────────────────────────────────────────────── */

const WORKSPACE = { key: "creamery", name: "Creamery Ops", monogram: "C" };

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: <IconHome size={18} /> },
  { key: "invite", label: "Invite users", icon: <IconUserAdd size={18} />, count: "3/10" },
];

/* [boilerplate] voci configurabili, con sottovoci collassabili */
export type SidebarNavItem = {
  key: string;
  label: string;
  icon: ReactNode;
  count?: string;
  children?: { key: string; label: string; count?: string }[];
};

export type SidebarWorkspace = { name: string; monogram: string; logo?: ReactNode };

export type SidebarMenuAction = { label: string; icon: ReactNode; onClick: () => void };

export type SidebarLabels = {
  newChat: string;
  chats: string;
  searchChats: string;
  searchHistory: string;
  closeSearch: string;
  noChats: string;
  collapse: string;
  expand: string;
  navigation: string;
  signOut: string;
};

const DEFAULT_SIDEBAR_LABELS: SidebarLabels = {
  newChat: "New chat",
  chats: "Chats",
  searchChats: "Search chats",
  searchHistory: "Search chat history",
  closeSearch: "Close chat search",
  noChats: "No chats found",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  navigation: "Workspace navigation",
  signOut: "Sign out",
};

export type SidebarRecent = {
  id: string;
  label: string;
  prompt?: string;
};

const DEFAULT_RECENTS: SidebarRecent[] = [
  { id: "suppliers", label: "Supplier records" },
  { id: "todos", label: "Urgent to-dos this morning" },
  { id: "flavor", label: "Flavor page ticket" },
  { id: "workload", label: "Workload summary" },
  { id: "offboarding", label: "Off-board a supplier" },
  { id: "restock", label: "Batch restock function" },
  { id: "edits", label: "Propose flavor edits" },
  { id: "subway", label: "Subway surfing" },
];

type SidebarNavProps = {
  activeTitle?: string | null;
  className?: string;
  fill?: boolean;
  onNewChat?: () => void;
  onPick?: (id: string, label: string, prompt?: string) => void;
  /** controlled primary-nav selection (e.g. "home" | "invite") */
  activeNav?: string;
  onNavigate?: (key: string) => void;
  /** footer call-to-action — defaults to the demo "Upgrade" button */
  footerLabel?: string;
  footerIcon?: ReactNode;
  onFooterClick?: () => void;
  recents?: SidebarRecent[];
  variant?: string;
  /* [boilerplate] */
  workspace?: SidebarWorkspace;
  workspaceMenu?: SidebarMenuAction[];
  onSignOut?: () => void;
  navItems?: SidebarNavItem[];
  /** false nasconde "New chat" e la cronologia */
  showChats?: boolean;
  /** [boilerplate] azione a destra di ogni conversazione (es. menu ⋯); sempre raggiungibile da tastiera e touch */
  recentAction?: (item: SidebarRecent, active: boolean) => ReactNode;
  /** [boilerplate] conversazione in rinomina: al posto della riga compare renderRecentEditor */
  editingRecentId?: string | null;
  renderRecentEditor?: (item: SidebarRecent) => ReactNode;
  labels?: Partial<SidebarLabels>;
  /** null nasconde il bottone in fondo */
  footer?: ReactNode | null;
};

const SIDEBAR_MOTION = {
  expandedWidth: 224,
  collapsedWidth: 52,
  duration: 280,
  copyDuration: 180,
  copyOffset: 8,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

/* ─────────────────────────────────────────────────────────
 * CHAT SEARCH STORYBOARD
 *
 *   0ms   search is triggered; Chats label begins fading
 *   0ms   field grows right → left from the search control
 * 180ms   field fills the row; cursor is focused and ready
 * ───────────────────────────────────────────────────────── */
const CHAT_SEARCH_MOTION = {
  duration: 180,
  closedWidth: 28,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

function GlideGroup({ children }: { children: ReactNode }) {
  return (
    <GlideMenu
      rowSelector="[data-row]"
      highlightClassName="sidebar-glide-highlight rounded-[7px] bg-hover-2"
      className="group/glide flex flex-col gap-px"
    >
      {children}
    </GlideMenu>
  );
}

function RailButton({
  icon,
  label,
  active = false,
  count,
  onClick,
  expanded,
  indent = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  count?: string;
  onClick?: () => void;
  /* [boilerplate] gruppo collassabile e sottovoce */
  expanded?: boolean;
  indent?: boolean;
}) {
  return (
    <button
      data-row
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-current={active ? "page" : undefined}
      title={label}
      className={`sidebar-row relative z-10 mx-2 flex h-8 items-center rounded-[8px] px-2 text-left ${indent ? "sidebar-copy" : ""}
        transition-[width,background-color,color,transform] duration-150 active:scale-[0.98]
        ${active ? "bg-hover-2 group-hover/glide:bg-transparent" : ""}`}
    >
      <span className={`flex size-5 shrink-0 items-center justify-center ${active ? "text-ink" : "text-ink-2"}`}>
        {indent ? null : icon}
      </span>
      <span className={`sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium ${active ? "text-ink" : "text-ink-2"}`}>
        {label}
      </span>
      {count && (
        <span className="sidebar-copy mr-2 shrink-0 text-[12px] font-medium tabular-nums text-ink-3">
          {count}
        </span>
      )}
      {expanded !== undefined && (
        <span className="sidebar-copy flex shrink-0 text-ink-3 transition-transform duration-200" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
          <IconChevronDownSmall size={16} />
        </span>
      )}
    </button>
  );
}

function WorkspaceMenu({
  position,
  onClose,
  workspace = WORKSPACE,
  actions,
  signOutLabel = "Sign out",
  onSignOut,
}: {
  position: { top: number; left: number };
  onClose: () => void;
  workspace?: SidebarWorkspace;
  actions?: SidebarMenuAction[];
  signOutLabel?: string;
  onSignOut?: () => void;
}) {
  const items = actions ?? [
    { label: "New workspace", icon: <IconPlusMedium size={16} />, onClick: () => {} },
    { label: "Workspace settings", icon: <IconSettingsGear1 size={16} />, onClick: () => {} },
    { label: "Invite team members", icon: <IconUserAdd size={16} />, onClick: () => {} },
  ];
  return createPortal(
    <div
      data-workspace-menu
      className="fixed z-50 w-64 rounded-[14px] bg-surface p-1.5 shadow-overlay"
      style={{
        top: position.top,
        left: position.left,
        animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "top left",
      }}
    >
      <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[8px] bg-hover-2">
        <button
          data-menu-row
          type="button"
          onClick={onClose}
          className="relative z-10 flex h-10 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-ink text-[11px] font-semibold text-surface">
            {workspace.monogram}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{workspace.name}</span>
          <span className="shrink-0 text-ink"><IconCheckmark1Small size={18} /></span>
        </button>
        <div className="my-1 h-px bg-line" />
        {items.map((item) => (
          <button
            key={item.label}
            data-menu-row
            type="button"
            onClick={() => { item.onClick(); onClose(); }}
            className="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
          >
            <span className="flex size-5 shrink-0 items-center justify-center text-ink-2">{item.icon}</span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{item.label}</span>
          </button>
        ))}
        <div className="my-1 h-px bg-line" />
        <button
          data-menu-row
          type="button"
          onClick={() => { onSignOut?.(); onClose(); }}
          className="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-ink-2"><IconArrowBoxLeft size={16} /></span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{signOutLabel}</span>
        </button>
      </GlideMenu>
    </div>,
    document.body,
  );
}

export default function SidebarNav({
  activeTitle,
  className = "",
  fill = false,
  onNewChat,
  onPick,
  activeNav,
  onNavigate,
  footerLabel = "Upgrade",
  footerIcon,
  onFooterClick,
  recents = DEFAULT_RECENTS,
  workspace = WORKSPACE,
  workspaceMenu,
  onSignOut,
  navItems,
  showChats = true,
  recentAction,
  editingRecentId = null,
  renderRecentEditor,
  labels: labelsProp,
  footer,
}: SidebarNavProps) {
  const labels = { ...DEFAULT_SIDEBAR_LABELS, ...labelsProp };
  const items: SidebarNavItem[] = navItems ?? NAV_ITEMS;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [internalNav, setInternalNav] = useState("chats");
  const currentNav = activeNav ?? internalNav;
  const selectNav = (key: string) => {
    setInternalNav(key);
    onNavigate?.(key);
  };
  const [demoActiveTitle, setDemoActiveTitle] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspacePosition, setWorkspacePosition] = useState({ top: 0, left: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedTitle = activeTitle === undefined ? demoActiveTitle : activeTitle;
  const visibleRecents = recents.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!workspaceOpen) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-workspace-trigger]") && !target.closest("[data-workspace-menu]")) {
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [workspaceOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const collapse = () => {
    setCollapsed(true);
    setWorkspaceOpen(false);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <aside
      data-sidebar-collapsed={collapsed}
      aria-label={labels.navigation}
      className={`relative flex shrink-0 overflow-hidden transition-[width] ${fill ? "h-full" : "h-[600px]"} ${className}`}
      style={{
        width: collapsed ? SIDEBAR_MOTION.collapsedWidth : SIDEBAR_MOTION.expandedWidth,
        transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
        transitionTimingFunction: SIDEBAR_MOTION.easing,
        "--sidebar-copy-duration": `${SIDEBAR_MOTION.copyDuration}ms`,
        "--sidebar-copy-offset": `${SIDEBAR_MOTION.copyOffset}px`,
        "--sidebar-easing": SIDEBAR_MOTION.easing,
      } as CSSProperties}
    >
      <div className="flex min-h-0 w-[224px] shrink-0 flex-col">
        <div className="relative mb-2.5 h-10 shrink-0">
          <button
            ref={workspaceButtonRef}
            data-workspace-trigger
            type="button"
            aria-expanded={workspaceOpen}
            aria-hidden={collapsed}
            tabIndex={collapsed ? -1 : 0}
            onClick={() => {
              if (!workspaceOpen && workspaceButtonRef.current) {
                const rect = workspaceButtonRef.current.getBoundingClientRect();
                setWorkspacePosition({ top: rect.bottom + 6, left: rect.left });
              }
              setWorkspaceOpen((open) => !open);
            }}
            className="sidebar-workspace-control absolute left-2 top-1 flex h-8 w-[164px] items-center rounded-[8px] px-2 text-left transition-[background-color,transform] duration-100 hover:bg-hover-2 active:scale-[0.99]"
          >
            <span className="sidebar-logo flex size-5 shrink-0 items-center justify-center text-ink">
              {workspace.logo ?? <IconPopsicle2 size={18} />}
            </span>
            <span className="sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium text-ink-2">
              {workspace.name}
            </span>
            <span className="sidebar-copy ml-1 flex shrink-0 text-ink-3">
              <IconChevronDownSmall size={16} />
            </span>
          </button>

          {workspaceOpen && (
            <WorkspaceMenu
              position={workspacePosition}
              onClose={() => setWorkspaceOpen(false)}
              workspace={workspace}
              actions={workspaceMenu}
              signOutLabel={labels.signOut}
              onSignOut={onSignOut}
            />
          )}

          <button
            type="button"
            aria-label={labels.collapse}
            title={labels.collapse}
            aria-hidden={collapsed}
            tabIndex={collapsed ? -1 : 0}
            onClick={collapse}
            className="sidebar-collapse-control absolute right-2 top-1 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
          >
            <IconSidebarLeftArrow size={18} />
          </button>
          <button
            type="button"
            aria-label={labels.expand}
            title={labels.expand}
            aria-hidden={!collapsed}
            tabIndex={collapsed ? 0 : -1}
            onClick={() => setCollapsed(false)}
            className="sidebar-expand-control absolute left-2 top-0.5 flex size-9 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
          >
            <IconSidebarLeftArrow size={18} className="rotate-180" />
          </button>
        </div>

        <GlideGroup>
          {showChats && (
            <RailButton
              icon={<IconEditBig size={18} />}
              label={labels.newChat}
              onClick={() => {
                if (activeTitle === undefined) setDemoActiveTitle(null);
                selectNav("chats");
                onNewChat?.();
              }}
            />
          )}
          {items.map((item) => {
            if (!item.children) {
              return (
                <RailButton
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  count={item.count}
                  active={currentNav === item.key}
                  onClick={() => selectNav(item.key)}
                />
              );
            }
            const childActive = item.children.some((c) => c.key === currentNav);
            const open = openGroups[item.key] ?? childActive;
            return (
              <div key={item.key} className="flex flex-col gap-px">
                <RailButton
                  icon={item.icon}
                  label={item.label}
                  active={childActive && (collapsed || !open)}
                  expanded={open}
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setOpenGroups((g) => ({ ...g, [item.key]: true }));
                      return;
                    }
                    setOpenGroups((g) => ({ ...g, [item.key]: !open }));
                  }}
                />
                {open && !collapsed && item.children.map((child) => (
                  <RailButton
                    key={child.key}
                    indent
                    icon={null}
                    label={child.label}
                    count={child.count}
                    active={currentNav === child.key}
                    onClick={() => selectNav(child.key)}
                  />
                ))}
              </div>
            );
          })}
        </GlideGroup>

        {/* [boilerplate] mai scorrimento orizzontale: con la barra verticale classica le righe da 208 px non ci stanno */}
        <div className={`mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${showChats ? "" : "invisible"}`} aria-hidden={!showChats}>
          <div className="sidebar-copy relative mx-2 mb-1 h-8">
            <div
              aria-hidden={searchOpen}
              className={`absolute inset-0 flex items-center gap-1.5 px-2 text-[12.5px] font-medium text-ink-3 transition-[opacity,transform] ${searchOpen ? "pointer-events-none -translate-x-1 opacity-0" : "translate-x-0 opacity-100"}`}
              style={{ transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`, transitionTimingFunction: CHAT_SEARCH_MOTION.easing }}
            >
              <IconChevronDownSmall size={16} />
              <span>{labels.chats}</span>
            </div>

            <button
              type="button"
              aria-label={labels.searchChats}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
              className={`absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color,transform] hover:bg-hover-2 hover:text-ink active:scale-[0.96] ${searchOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}
              style={{ transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms` }}
            >
              <IconMagnifyingGlass size={16} />
            </button>

            <div
              className={`absolute right-0 top-0 z-20 flex h-8 items-center overflow-hidden rounded-[8px] bg-field text-ink-3 shadow-hairline transition-[width,opacity] focus-within:text-ink-2 ${searchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
              style={{
                width: searchOpen ? "100%" : CHAT_SEARCH_MOTION.closedWidth,
                transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: CHAT_SEARCH_MOTION.easing,
              }}
            >
              <span className="ml-2 flex shrink-0 items-center justify-center">
                <IconMagnifyingGlass size={15} />
              </span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    setQuery("");
                  }
                }}
                placeholder={labels.searchChats}
                aria-label={labels.searchHistory}
                className="ml-1.5 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-ink-3"
              />
              <button
                type="button"
                aria-label={labels.closeSearch}
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-hover-2 hover:text-ink active:scale-[0.96]"
              >
                <IconCrossSmall size={16} />
              </button>
            </div>
          </div>

          <GlideGroup>
            {visibleRecents.map((item) => {
              const active = item.label === selectedTitle;
              /* [boilerplate] riga in rinomina: l'editor prende il posto del bottone */
              if (editingRecentId === item.id && renderRecentEditor) {
                return <div key={item.id} className="relative z-10 mx-2 flex h-8 items-center">{renderRecentEditor(item)}</div>;
              }
              return (
                <div
                  key={item.id}
                  data-row
                  data-recent-id={item.id}
                  className={`sidebar-row group/recent relative z-10 mx-2 flex h-8 items-center rounded-[8px] transition-[width,background-color,color,transform] duration-150 ${
                    active ? "bg-hover-2 group-hover/glide:bg-transparent" : ""
                  }`}
                >
                  <button
                    type="button"
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      selectNav("chats");
                      if (activeTitle === undefined) setDemoActiveTitle(item.label);
                      onPick?.(item.id, item.label, item.prompt);
                    }}
                    className="flex h-full min-w-0 flex-1 items-center rounded-[8px] px-2 text-left active:scale-[0.98]"
                  >
                    <span className={`sidebar-copy min-w-0 flex-1 truncate text-[14px] font-medium ${active ? "text-ink" : "text-ink-2"}`}>
                      {item.label}
                    </span>
                  </button>
                  {recentAction && <span className="sidebar-copy flex shrink-0 pr-0.5">{recentAction(item, active)}</span>}
                </div>
              );
            })}
            {query && visibleRecents.length === 0 && (
              <div className="sidebar-copy mx-2 px-2 py-2 text-[12.5px] text-ink-3">{labels.noChats}</div>
            )}
          </GlideGroup>
        </div>

        {footer !== null && <div className="sidebar-copy mx-2 mt-3 w-[208px] border-t border-line pt-3">
          {footer ?? <button
            type="button"
            onClick={onFooterClick ?? onNewChat}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-control bg-hover-2 text-[12.5px] font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-line-strong active:scale-[0.98]"
          >
            {footerIcon}
            {footerLabel}
          </button>}
        </div>}
      </div>
    </aside>
  );
}
