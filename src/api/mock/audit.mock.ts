/*
 * Registro attività automatico del backend finto: ogni chiamata di scrittura riuscita
 * aggiunge una riga. Nel PHP va fatto lato server, nello stesso punto in cui si salva.
 */
import { AUDIT, type AuditItem } from "@/api/mock/data/feed.data";
import { readSession } from "@/lib/session";

export const auditLog: AuditItem[] = structuredClone(AUDIT);

type Rule = (b: Record<string, unknown>) => Pick<AuditItem, "azione" | "oggetto" | "descrizione">;

const RULES: Record<string, Rule> = {
  "/auth/login": (b) => ({ azione: "accesso", oggetto: "Account", descrizione: `Ha effettuato l'accesso (${b.email})` }),
  "/richieste/salva": (b) => ({ azione: b.id ? "modifica" : "creazione", oggetto: b.id ? `Richiesta ${b.id}` : "Nuova richiesta", descrizione: b.id ? "Ha modificato la richiesta" : "Ha creato una richiesta" }),
  "/richieste/elimina": (b) => ({ azione: "eliminazione", oggetto: `Richiesta ${b.id}`, descrizione: "Ha eliminato la richiesta" }),
  "/utenti/salva": (b) => ({ azione: b.id ? "modifica" : "creazione", oggetto: "Utente", descrizione: b.id ? "Ha modificato un utente" : "Ha creato un utente" }),
  "/utenti/stato": (b) => ({ azione: "modifica", oggetto: `Utente ${b.id}`, descrizione: `Ha impostato lo stato ${b.stato}` }),
  "/utenti/elimina": (b) => ({ azione: "eliminazione", oggetto: `Utente ${b.id}`, descrizione: "Ha eliminato un utente" }),
  "/impostazioni/salva": () => ({ azione: "modifica", oggetto: "Impostazioni", descrizione: "Ha cambiato le impostazioni" }),
  "/blog/salva": (b) => ({ azione: b.id ? "modifica" : "creazione", oggetto: "Articolo del blog", descrizione: b.id ? "Ha modificato un articolo" : "Ha scritto un articolo" }),
  "/blog/elimina": () => ({ azione: "eliminazione", oggetto: "Articolo del blog", descrizione: "Ha eliminato un articolo" }),
  "/upload/completa": (b) => ({ azione: "creazione", oggetto: `File ${b.nome}`, descrizione: "Ha caricato un file" }),
  "/sicurezza/salva": () => ({ azione: "modifica", oggetto: "Sicurezza", descrizione: "Ha cambiato le regole di sicurezza" }),
  "/sicurezza/disconnetti": (b) => ({ azione: "modifica", oggetto: "Sessioni", descrizione: b.id === "altre" ? "Ha chiuso tutte le altre sessioni" : "Ha chiuso una sessione" }),
  "/backup/salva": () => ({ azione: "modifica", oggetto: "Backup", descrizione: "Ha cambiato la pianificazione dei backup" }),
  "/backup/crea": () => ({ azione: "creazione", oggetto: "Backup", descrizione: "Ha creato un backup manuale" }),
  "/backup/ripristina": () => ({ azione: "modifica", oggetto: "Backup", descrizione: "Ha ripristinato un backup" }),
  "/attivita/attiva": (b) => ({ azione: "modifica", oggetto: "Attività pianificata", descrizione: b.attivo ? "Ha acceso un'attività" : "Ha spento un'attività" }),
  "/attivita/esegui": () => ({ azione: "modifica", oggetto: "Attività pianificata", descrizione: "Ha eseguito un'attività a mano" }),
  "/account/password": () => ({ azione: "modifica", oggetto: "Account", descrizione: "Ha cambiato la password" }),
};

export function recordAudit(path: string, body: unknown) {
  const rule = RULES[path];
  if (!rule) return;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  auditLog.unshift({
    id: `a${Date.now()}`,
    quando: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    chi: readSession()?.name ?? "Ospite",
    modifiche: [],
    ...rule((body ?? {}) as Record<string, unknown>),
  });
}
