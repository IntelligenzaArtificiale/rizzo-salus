/* Backend finto di sicurezza, backup e attività pianificate: stato in memoria per la sessione dell'anteprima. */
import type { ApiResult } from "@/api/client";
import type { BackupItem, Job, SecuritySettings } from "@/api/admin";
import { BACKUP_SETTINGS, BACKUPS, JOBS, SECURITY, SESSIONS } from "@/api/mock/data/admin.data";

const db = { security: structuredClone(SECURITY), sessions: structuredClone(SESSIONS), backupSettings: structuredClone(BACKUP_SETTINGS), backups: structuredClone(BACKUPS), jobs: structuredClone(JOBS) };
const ok = <T,>(data: T): ApiResult<T> => ({ ok: true, data });
const now = () => { const d = new Date(); return `Oggi, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

export const adminMocks: Record<string, (body: unknown) => ApiResult<unknown>> = {
  "/sicurezza/leggi": () => ok(db.security),
  "/sicurezza/salva": (b) => { db.security = (b as { dati: SecuritySettings }).dati; return ok({}); },
  "/sicurezza/sessioni": () => ok(db.sessions),
  "/sicurezza/disconnetti": (b) => {
    const { id } = b as { id: string };
    db.sessions = id === "altre" ? db.sessions.filter((s) => s.corrente) : db.sessions.filter((s) => s.id !== id || s.corrente);
    return ok({});
  },
  "/backup/elenco": () => ok({ impostazioni: db.backupSettings, copie: db.backups }),
  "/backup/salva": (b) => { db.backupSettings = (b as { dati: typeof db.backupSettings }).dati; return ok({}); },
  "/backup/crea": () => {
    const item: BackupItem = { id: `b${Date.now()}`, quando: now(), tipo: "Manuale", dimensione: "185 MB", esito: "completata" };
    db.backups = [item, ...db.backups];
    return ok(item);
  },
  "/backup/ripristina": (b) => (db.backups.some((x) => x.id === (b as { id: string }).id) ? ok({}) : { ok: false, error: "non_trovato" }),
  "/attivita/elenco": () => ok(db.jobs),
  "/attivita/attiva": (b) => {
    const { id, attivo } = b as { id: string; attivo: boolean };
    db.jobs = db.jobs.map((j) => (j.id === id ? { ...j, attivo, prossima: attivo ? "Alla prossima pianificazione" : "Spenta" } : j));
    return ok(db.jobs.find((j) => j.id === id) as Job);
  },
  "/attivita/esegui": (b) => {
    const { id } = b as { id: string };
    db.jobs = db.jobs.map((j) => (j.id === id ? { ...j, esecuzioni: [{ quando: now(), esito: "completata" as const, durata: "2 s", nota: "Avviata a mano." }, ...j.esecuzioni] } : j));
    return ok(db.jobs.find((j) => j.id === id) as Job);
  },
};
