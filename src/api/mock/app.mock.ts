/*
 * Backend finto dell'area riservata: dati in memoria, le modifiche durano finché la pagina
 * resta aperta. La password attuale di prova è "Password123".
 */
import type { ApiResult } from "@/api/client";
import { REQUESTS, type RequestItem } from "@/api/mock/data/requests.data";
import { USERS, type UserItem } from "@/api/mock/data/users.data";
import { NOTIFICATIONS } from "@/api/mock/data/feed.data";
import { auditLog } from "@/api/mock/audit.mock";

const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data });
const fail = (error: string): ApiResult<never> => ({ ok: false, error });

const db = {
  requests: structuredClone(REQUESTS),
  users: structuredClone(USERS),
  notifications: structuredClone(NOTIFICATIONS),
};

const today = () => new Date().toISOString().slice(0, 10);

function nextRequestId() {
  const max = Math.max(...db.requests.map((r) => Number(r.id.slice(2))));
  return `R-${max + 1}`;
}

type Body = Record<string, unknown>;

export const appMocks: Record<string, (body: unknown) => ApiResult<unknown>> = {
  "/richieste/elenco": () => ok(db.requests),
  "/richieste/dettaglio": (b) => {
    const item = db.requests.find((r) => r.id === (b as Body).id);
    return item ? ok(item) : fail("non_trovata");
  },
  "/richieste/salva": (b) => {
    const { id, dati } = b as { id?: string; dati: Partial<RequestItem> };
    if (id) {
      const item = db.requests.find((r) => r.id === id);
      if (!item) return fail("non_trovata");
      Object.assign(item, dati);
      return ok(item);
    }
    const item = { stato: "todo", ...dati, id: nextRequestId(), creata: today(), assegnata: "—", allegati: [], storico: [] } as RequestItem;
    db.requests.unshift(item);
    return ok(item);
  },
  "/richieste/elimina": (b) => {
    db.requests = db.requests.filter((r) => r.id !== (b as Body).id);
    return ok({});
  },
  "/utenti/elenco": () => ok(db.users),
  "/utenti/dettaglio": (b) => {
    const user = db.users.find((u) => u.id === (b as Body).id);
    return user ? ok(user) : fail("non_trovato");
  },
  "/utenti/salva": (b) => {
    const { id, dati } = b as { id?: string; dati: Partial<UserItem> };
    if (db.users.some((u) => u.email === dati.email && u.id !== id)) return fail("email_esistente");
    if (id) {
      const user = db.users.find((u) => u.id === id)!;
      Object.assign(user, dati);
      return ok(user);
    }
    const user = { ...dati, id: `u${db.users.length + 1}`, stato: "attivo", ultimo: "Mai", attivita: "none", creato: today() } as UserItem;
    db.users.push(user);
    return ok(user);
  },
  "/utenti/stato": (b) => {
    const { id, stato } = b as { id: string; stato: UserItem["stato"] };
    const user = db.users.find((u) => u.id === id)!;
    user.stato = stato;
    return ok(user);
  },
  "/utenti/elimina": (b) => {
    db.users = db.users.filter((u) => u.id !== (b as Body).id);
    return ok({});
  },
  "/notifiche/elenco": () => ok(db.notifications),
  "/notifiche/lette": (b) => {
    const ids = (b as { ids: string[] }).ids;
    db.notifications.forEach((n) => { if (ids.includes(n.id)) n.letta = true; });
    return ok({});
  },
  "/audit/elenco": () => ok(auditLog),
  "/audit/dettaglio": (b) => {
    const item = auditLog.find((a) => a.id === (b as Body).id);
    return item ? ok(item) : fail("non_trovato");
  },
  "/account/salva": () => ok({}),
  "/account/password": (b) => ((b as Body).attuale === "Password123" ? ok({}) : fail("password_errata")),
  "/account/elimina": (b) => ((b as Body).password === "Password123" ? ok({}) : fail("password_errata")),
};
