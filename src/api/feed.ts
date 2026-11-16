/*
 * Notifiche, registro attività, account dell'utente collegato. Endpoint PHP attesi:
 * POST /notifiche/elenco {}            → NotificationItem[]
 * POST /notifiche/lette { ids }        → {}
 * POST /audit/elenco {}                → AuditItem[]
 * POST /audit/dettaglio { id }         → AuditItem
 * POST /account/salva { dati }         → {}
 * POST /account/password { attuale, nuova } → {}   errori: password_errata
 * POST /account/elimina { password }   → {}         errori: password_errata
 */
import { apiPost } from "@/api/client";
import type { AuditItem, NotificationItem } from "@/api/mock/data/feed.data";

export type { AuditItem, NotificationItem, ChatThread } from "@/api/mock/data/feed.data";
export { CHATS } from "@/api/mock/data/feed.data";

export const listNotifications = () => apiPost<NotificationItem[]>("/notifiche/elenco", {});
export const markNotificationsRead = (ids: string[]) => apiPost<object>("/notifiche/lette", { ids });
export const listAudit = () => apiPost<AuditItem[]>("/audit/elenco", {});
export const getAudit = (id: string) => apiPost<AuditItem>("/audit/dettaglio", { id });
export const saveAccount = (dati: Record<string, string>) => apiPost<object>("/account/salva", { dati });
export const changePassword = (attuale: string, nuova: string) => apiPost<object>("/account/password", { attuale, nuova });
export const deleteAccount = (password: string) => apiPost<object>("/account/elimina", { password });
