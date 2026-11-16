/*
 * Utenti (solo amministratore). Endpoint PHP attesi:
 * POST /utenti/elenco {}                 → UserItem[]
 * POST /utenti/dettaglio { id }          → UserItem    errori: non_trovato
 * POST /utenti/salva { id?, dati }       → UserItem    errori: email_esistente
 * POST /utenti/stato { id, stato }       → UserItem
 * POST /utenti/elimina { id }            → {}
 */
import { apiPost } from "@/api/client";
import type { UserItem, UserState } from "@/api/mock/data/users.data";

export type { UserItem, UserRole, UserState, Activity } from "@/api/mock/data/users.data";
export { ROLE_LABEL, STATE_LABEL, ACTIVITY_LABEL } from "@/api/mock/data/users.data";

export type UserInput = Pick<UserItem, "nome" | "email" | "ruolo" | "azienda" | "telefono">;

export const listUsers = () => apiPost<UserItem[]>("/utenti/elenco", {});
export const getUser = (id: string) => apiPost<UserItem>("/utenti/dettaglio", { id });
export const saveUser = (dati: UserInput, id?: string) => apiPost<UserItem>("/utenti/salva", { id, dati });
export const setUserState = (id: string, stato: UserState) => apiPost<UserItem>("/utenti/stato", { id, stato });
export const deleteUser = (id: string) => apiPost<object>("/utenti/elimina", { id });
