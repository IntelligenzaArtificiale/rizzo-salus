/*
 * Richieste (entità d'esempio). Endpoint PHP attesi:
 * POST /richieste/elenco {}            → RequestItem[]
 * POST /richieste/dettaglio { id }     → RequestItem          errori: non_trovata
 * POST /richieste/salva { id?, dati }  → RequestItem          (senza id crea)
 * POST /richieste/elimina { id }       → {}
 */
import { apiPost } from "@/api/client";
import type { RequestItem } from "@/api/mock/data/requests.data";

export type { RequestItem, RequestStatus } from "@/api/mock/data/requests.data";
export { STATUS_LABEL, CATEGORIES } from "@/api/mock/data/requests.data";

export type RequestInput = Pick<RequestItem, "titolo" | "cliente" | "categoria" | "priorita" | "descrizione"> & { stato?: RequestItem["stato"] };

export const listRequests = () => apiPost<RequestItem[]>("/richieste/elenco", {});
export const getRequest = (id: string) => apiPost<RequestItem>("/richieste/dettaglio", { id });
export const saveRequest = (dati: RequestInput, id?: string) => apiPost<RequestItem>("/richieste/salva", { id, dati });
export const deleteRequest = (id: string) => apiPost<object>("/richieste/elimina", { id });
