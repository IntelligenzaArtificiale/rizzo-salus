/*
 * Voci della sidebar. Ogni voce dichiara il permesso (RBAC) e il modulo che servono:
 * se mancano, la voce non compare. La chiave è la rotta.
 */
import { createElement } from "react";
import { Bell, ClipboardList, House, Newspaper, Settings, Shield, Sparkles } from "lucide-react";
import type { SidebarNavItem } from "@/components/primitives/SidebarNav";
import type { FeatureKey, Permission } from "@/lib/platform/defaults";

const icon = (Component: typeof House) => createElement(Component, { size: 18 });

type Entry = { key: string; label: string; icon?: typeof House; perm?: Permission; feature?: FeatureKey; children?: Entry[] };

const MENU: Entry[] = [
  { key: "/richieste", label: "Richieste", icon: ClipboardList },
  { key: "/assistente", label: "Assistente", icon: Sparkles, perm: "assistente.usa", feature: "assistente" },
  { key: "/notifiche", label: "Notifiche", icon: Bell, feature: "notifiche" },
  {
    key: "amministrazione", label: "Amministrazione", icon: Shield,
    children: [
      { key: "/admin/utenti", label: "Utenti", perm: "utenti.gestisci" },
      { key: "/admin/statistiche", label: "Statistiche", perm: "statistiche.vedi" },
      { key: "/admin/registro", label: "Registro attività", perm: "registro.vedi" },
    ],
  },
  { key: "/admin/blog", label: "Blog", icon: Newspaper, perm: "blog.gestisci", feature: "blog" },
  { key: "/admin/impostazioni", label: "Impostazioni", icon: Settings, perm: "impostazioni.gestisci" },
];

type Access = { can: (p: Permission) => boolean; on: (f: FeatureKey) => boolean };

export function navigationFor({ can, on }: Access, unread: number): SidebarNavItem[] {
  const allowed = (e: Entry) => (!e.perm || can(e.perm)) && (!e.feature || on(e.feature));
  const items: SidebarNavItem[] = [{ key: can("dashboard.admin") ? "/admin" : "/area", label: "Dashboard", icon: icon(House) }];
  for (const e of MENU.filter(allowed)) {
    if (e.children) {
      const children = e.children.filter(allowed).map((c) => ({ key: c.key, label: c.label }));
      if (children.length) items.push({ key: e.key, label: e.label, icon: icon(e.icon!), children });
      continue;
    }
    const label = e.key === "/richieste" && !can("richieste.tutte") ? "Le mie richieste" : e.label;
    items.push({ key: e.key, label, icon: icon(e.icon!), count: e.key === "/notifiche" && unread > 0 ? String(unread) : undefined });
  }
  return items;
}

/** voce attiva: la chiave più lunga che è prefisso della rotta aperta */
export function activeKey(items: SidebarNavItem[], path: string): string {
  const keys = items.flatMap((i) => (i.children ? i.children.map((c) => c.key) : [i.key])).filter((k) => k.startsWith("/"));
  return keys.filter((k) => path === k || path.startsWith(`${k}/`)).sort((a, b) => b.length - a.length)[0] ?? "";
}
