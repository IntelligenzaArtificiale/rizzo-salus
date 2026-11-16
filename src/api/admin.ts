/*
 * Sicurezza, backup e attività pianificate (impostazioni dell'amministratore). Endpoint PHP attesi:
 * POST /sicurezza/leggi {}                     → SecuritySettings
 * POST /sicurezza/salva { dati }               → {}
 * POST /sicurezza/sessioni {}                  → Session[]
 * POST /sicurezza/disconnetti { id | "altre" } → {}
 * POST /backup/elenco {}                       → { impostazioni: BackupSettings, copie: BackupItem[] }
 * POST /backup/salva { dati }                  → {}
 * POST /backup/crea {}                         → BackupItem          (il backend lo esegue in coda)
 * POST /backup/ripristina { id }               → {}                  errori: non_trovato
 * GET  /backup/scarica?id=…                    → file della copia (solo amministratori)
 * POST /attivita/elenco {}                     → Job[]
 * POST /attivita/attiva { id, attivo }         → Job
 * POST /attivita/esegui { id }                 → Job                 (esecuzione manuale)
 * Ogni scrittura va nel registro attività. Le attività girano sul server (cron), mai nel browser.
 */
import { apiPost } from "@/api/client";

export type SecuritySettings = {
  passwordMin: string; passwordSimboli: boolean; passwordScadenza: string;
  dueFattori: string; tentativi: string; bloccoMinuti: string; sessioneInattiva: string;
  ricordami: boolean; avvisoNuovoAccesso: boolean; limitaAdmin: boolean; indirizziAdmin: string;
};
export type Session = { id: string; dispositivo: string; luogo: string; ultimo: string; corrente: boolean };
export type BackupSettings = { frequenza: string; ora: string; conserva: string; allegati: boolean };
export type BackupItem = { id: string; quando: string; tipo: "Automatico" | "Manuale"; dimensione: string; esito: "completata" | "rifiutata" };
export type JobRun = { quando: string; esito: "completata" | "rifiutata"; durata: string; nota?: string };
export type Job = { id: string; nome: string; descrizione: string; frequenza: string; cron: string; attivo: boolean; prossima: string; esecuzioni: JobRun[] };

export const getSecurity = () => apiPost<SecuritySettings>("/sicurezza/leggi", {});
export const saveSecurity = (dati: SecuritySettings) => apiPost<object>("/sicurezza/salva", { dati });
export const listSessions = () => apiPost<Session[]>("/sicurezza/sessioni", {});
export const endSession = (id: string) => apiPost<object>("/sicurezza/disconnetti", { id });
export const listBackups = () => apiPost<{ impostazioni: BackupSettings; copie: BackupItem[] }>("/backup/elenco", {});
export const saveBackupSettings = (dati: BackupSettings) => apiPost<object>("/backup/salva", { dati });
export const createBackup = () => apiPost<BackupItem>("/backup/crea", {});
export const restoreBackup = (id: string) => apiPost<object>("/backup/ripristina", { id });
export const listJobs = () => apiPost<Job[]>("/attivita/elenco", {});
export const setJobActive = (id: string, attivo: boolean) => apiPost<Job>("/attivita/attiva", { id, attivo });
export const runJob = (id: string) => apiPost<Job>("/attivita/esegui", { id });
