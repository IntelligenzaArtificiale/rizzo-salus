/*
 * Notifiche: da leggere e tutte. Aprire una notifica la segna come letta e porta alla pagina collegata.
 * "Segna tutte come lette" è un bottone solo icona.
 */
import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { PageTabs } from "@/components/app/PageTabs";
import { Page, NOTIFICATIONS_CHANGED } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { IconButton } from "@/components/app/IconButton";
import { RowList } from "@/components/app/RowList";
import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";
import { listNotifications, markNotificationsRead } from "@/api/feed";
import { useLoad } from "@/lib/data/useLoad";

const VIEWS = ["Da leggere", "Tutte"] as const;

export function NotificationsPage() {
  const { data, loading, error, reload } = useLoad(listNotifications);
  const [view, setView] = useState<(typeof VIEWS)[number]>("Da leggere");
  const unread = (data ?? []).filter((n) => !n.letta);
  const rows = view === "Tutte" ? data ?? [] : unread;

  async function markRead(ids: string[]) {
    await markNotificationsRead(ids);
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    await reload();
  }

  return (
    <Page>
      <PageHeader
        title="Notifiche"
        actions={unread.length > 0 && <IconButton label="Segna tutte come lette" icon={<CheckCheck size={16} />} onClick={() => markRead(unread.map((n) => n.id))} />}
      />
      <PageTabs label="Notifiche da mostrare" options={VIEWS} value={view} onChange={setView} />
      {loading && !data && <PageLoading />}
      {error && <PageError onRetry={reload} />}
      {data && rows.length === 0 && <EmptyState title={view === "Tutte" ? "Nessuna notifica." : "Hai letto tutto."} />}
      {rows.length > 0 && (
        <RowList
          rows={rows.map((n) => ({
            key: n.id,
            to: n.link,
            title: n.titolo,
            meta: n.testo,
            aside: n.quando,
            mark: n.letta ? undefined : <span className="size-2 rounded-full bg-accent" aria-label="Da leggere" />,
            onOpen: () => { if (!n.letta) void markRead([n.id]); },
          }))}
        />
      )}
    </Page>
  );
}
