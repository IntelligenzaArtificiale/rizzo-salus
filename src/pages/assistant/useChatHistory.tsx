/*
 * Cronologia nella sidebar: collega useConversations alla SidebarNav.
 * Ogni conversazione ha il menu ⋯ (Rinomina, Elimina). Rinomina sul posto, Elimina con conferma.
 * Restituisce la configurazione per AppLayout e la finestra di conferma da mettere nella pagina.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/app/ActionMenu";
import { InlineRename } from "@/components/app/InlineRename";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { TITLE_MAX } from "@/api/assistant";
import { useConversations } from "@/pages/assistant/useConversations";

const focusRow = (id: string) => requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-recent-id="${id}"] button`)?.focus());

export function useChatHistory(activeId: string | undefined) {
  const navigate = useNavigate();
  const conv = useConversations(activeId);
  const [editing, setEditing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; titolo: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const thread = conv.threads.find((t) => t.id === activeId);

  const chats = useMemo(() => ({
    recents: conv.threads.map((t) => ({ id: t.id, label: t.titolo })),
    activeTitle: thread?.titolo ?? null,
    onPick: (id: string) => navigate(`/assistente/${id}`),
    onNewChat: () => navigate("/assistente"),
    editingRecentId: editing,
    recentAction: (item: { id: string; label: string }, active: boolean) => (
      <ActionMenu
        label={`Azioni per ${item.label}`}
        visible={active}
        actions={[
          { label: "Rinomina", icon: <Pencil size={15} />, onSelect: () => setEditing(item.id) },
          { label: "Elimina", icon: <Trash2 size={15} />, danger: true, onSelect: () => setToDelete({ id: item.id, titolo: item.label }) },
        ]}
      />
    ),
    renderRecentEditor: (item: { id: string; label: string }) => (
      <InlineRename value={item.label} label="Nome della conversazione" maxLength={TITLE_MAX}
        onSave={(v) => void conv.rename(item.id, v)} onDone={() => { setEditing(null); focusRow(item.id); }} />
    ),
  }), [conv, thread, editing, navigate]);

  const dialog = (
    <ConfirmDialog
      open={Boolean(toDelete)}
      title="Eliminare la conversazione?"
      actionLabel="Elimina"
      busy={deleting}
      onClose={() => !deleting && setToDelete(null)}
      onConfirm={async () => {
        if (!toDelete) return;
        setDeleting(true);
        await conv.remove(toDelete.id);
        setDeleting(false);
        setToDelete(null);
      }}
    >
      «{toDelete?.titolo}» sparirà dalla cronologia. Non si può recuperare.
    </ConfirmDialog>
  );

  return { threads: conv.threads, loaded: conv.loaded, thread, create: conv.create, chats, dialog };
}
