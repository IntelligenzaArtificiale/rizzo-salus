/*
 * Stato della cronologia dell'assistente: elenco, creazione, rinomina ed eliminazione.
 * - Rinomina ottimistica: il nuovo nome compare subito; se il server rifiuta torna il
 *   nome precedente e un avviso spiega cosa fare.
 * - Eliminazione: solo dopo conferma (pagina) e solo a risposta positiva del server.
 *   Se era la conversazione aperta si passa alla successiva o a una nuova chat.
 * - Un'operazione per volta sulla stessa conversazione.
 * Contratto completo: docs/assistente-cronologia.md.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/feedback/toast-context";
import { createChat, deleteChat, listChats, renameChat, TITLE_MAX, type ChatThread } from "@/api/assistant";

export function useConversations(activeId: string | undefined) {
  const navigate = useNavigate();
  const toast = useToast();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loaded, setLoaded] = useState(false);
  const pending = useRef(new Set<string>());

  useEffect(() => {
    listChats().then((r) => {
      if (r.ok) setThreads(r.data);
      else toast.show({ tone: "error", title: "Cronologia non disponibile", body: "Le conversazioni precedenti torneranno appena possibile." });
      setLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(async (prompt: string) => {
    const r = await createChat(prompt);
    if (!r.ok) { toast.show({ tone: "error", title: "Conversazione non avviata", body: "Riprova tra qualche istante." }); return null; }
    setThreads((t) => [r.data, ...t]);
    return r.data;
  }, [toast]);

  const rename = useCallback(async (id: string, title: string) => {
    const clean = title.trim().slice(0, TITLE_MAX);
    const before = threads.find((t) => t.id === id);
    if (!before || !clean || clean === before.titolo || pending.current.has(id)) return;
    pending.current.add(id);
    setThreads((t) => t.map((c) => (c.id === id ? { ...c, titolo: clean } : c)));
    const r = await renameChat(id, clean);
    pending.current.delete(id);
    if (!r.ok) {
      setThreads((t) => t.map((c) => (c.id === id ? { ...c, titolo: before.titolo } : c)));
      toast.show({ tone: "error", title: "Nome non salvato", body: "Usa un nome più breve o riprova." });
    }
  }, [threads, toast]);

  const remove = useCallback(async (id: string) => {
    if (pending.current.has(id)) return false;
    pending.current.add(id);
    const r = await deleteChat(id);
    pending.current.delete(id);
    if (!r.ok) { toast.show({ tone: "error", title: "Conversazione non eliminata", body: "Riprova tra qualche istante." }); return false; }
    const index = threads.findIndex((t) => t.id === id);
    const rest = threads.filter((t) => t.id !== id);
    setThreads(rest);
    toast.show({ tone: "success", title: "Conversazione eliminata" });
    if (id === activeId) {
      const next = rest[Math.min(index, rest.length - 1)];
      navigate(next ? `/assistente/${next.id}` : "/assistente", { replace: true });
    }
    return true;
  }, [threads, activeId, navigate, toast]);

  return { threads, loaded, create, rename, remove };
}
