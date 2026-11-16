/*
 * Conversazioni dell'assistente (contratto in docs/assistente-cronologia.md). Endpoint PHP attesi:
 * POST /assistente/conversazioni {}                     → ChatThread[] (più recenti prima)
 * POST /assistente/crea { prompt }                      → ChatThread
 * POST /assistente/rinomina { id, titolo }              → ChatThread     errori: non_trovato, titolo_non_valido
 * POST /assistente/elimina { id }                       → {}             errori: non_trovato
 * Il backend controlla che la conversazione appartenga all'utente collegato.
 */
import { apiPost } from "@/api/client";
import type { ChatThread } from "@/api/mock/data/feed.data";

export type { ChatThread };
export const TITLE_MAX = 60;

export const listChats = () => apiPost<ChatThread[]>("/assistente/conversazioni", {});
export const createChat = (prompt: string) => apiPost<ChatThread>("/assistente/crea", { prompt });
export const renameChat = (id: string, titolo: string) => apiPost<ChatThread>("/assistente/rinomina", { id, titolo });
export const deleteChat = (id: string) => apiPost<object>("/assistente/elimina", { id });
