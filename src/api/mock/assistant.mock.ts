/*
 * Conversazioni simulate. Restano nel browser (localStorage) così rinomina ed eliminazione
 * sopravvivono al ricaricamento dell'anteprima. Il titolo "errore" simula un rifiuto del server.
 */
import type { ApiResult } from "@/api/client";
import { CHATS, type ChatThread } from "@/api/mock/data/feed.data";

const KEY = "anteprima-conversazioni";

function load(): ChatThread[] {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as ChatThread[]; } catch { /* anteprima senza storage */ }
  return [...CHATS];
}
function store(list: ChatThread[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* anteprima senza storage */ }
}

const ok = <T,>(data: T): ApiResult<T> => ({ ok: true, data });
const fail = (error: string): ApiResult<never> => ({ ok: false, error });

export const assistantMocks: Record<string, (body: unknown) => ApiResult<unknown>> = {
  "/assistente/conversazioni": () => ok(load()),
  "/assistente/crea": (body) => {
    const { prompt } = body as { prompt: string };
    const created: ChatThread = { id: `n${Date.now()}`, titolo: prompt.length > 40 ? `${prompt.slice(0, 40)}…` : prompt, prompt };
    store([created, ...load()]);
    return ok(created);
  },
  "/assistente/rinomina": (body) => {
    const { id, titolo } = body as { id: string; titolo: string };
    const clean = titolo.trim();
    if (!clean || clean.length > 60 || clean.toLowerCase() === "errore") return fail("titolo_non_valido");
    const list = load();
    const found = list.find((c) => c.id === id);
    if (!found) return fail("non_trovato");
    found.titolo = clean;
    store(list);
    return ok(found);
  },
  "/assistente/elimina": (body) => {
    const { id } = body as { id: string };
    const list = load();
    if (!list.some((c) => c.id === id)) return fail("non_trovato");
    store(list.filter((c) => c.id !== id));
    return ok({});
  },
};
