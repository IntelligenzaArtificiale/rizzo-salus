/* Dati d'esempio per sicurezza, backup e attività pianificate. */
import type { BackupItem, BackupSettings, Job, SecuritySettings, Session } from "@/api/admin";

export const SECURITY: SecuritySettings = {
  passwordMin: "10", passwordSimboli: false, passwordScadenza: "mai", dueFattori: "amministratori",
  tentativi: "5", bloccoMinuti: "15", sessioneInattiva: "2h", ricordami: true, avvisoNuovoAccesso: true,
  limitaAdmin: false, indirizziAdmin: "",
};

export const SESSIONS: Session[] = [
  { id: "s1", dispositivo: "Chrome su Windows", luogo: "Catania, Italia", ultimo: "Adesso", corrente: true },
  { id: "s2", dispositivo: "Safari su iPhone", luogo: "Catania, Italia", ultimo: "Ieri, 21:14", corrente: false },
  { id: "s3", dispositivo: "Firefox su Mac", luogo: "Milano, Italia", ultimo: "28 ottobre", corrente: false },
];

export const BACKUP_SETTINGS: BackupSettings = { frequenza: "Ogni giorno", ora: "02:00", conserva: "14", allegati: true };

export const BACKUPS: BackupItem[] = [
  { id: "b5", quando: "Oggi, 02:00", tipo: "Automatico", dimensione: "184 MB", esito: "completata" },
  { id: "b4", quando: "Ieri, 02:00", tipo: "Automatico", dimensione: "183 MB", esito: "completata" },
  { id: "b3", quando: "1 novembre, 16:40", tipo: "Manuale", dimensione: "181 MB", esito: "completata" },
  { id: "b2", quando: "1 novembre, 02:00", tipo: "Automatico", dimensione: "—", esito: "rifiutata" },
  { id: "b1", quando: "31 ottobre, 02:00", tipo: "Automatico", dimensione: "179 MB", esito: "completata" },
];

export const JOBS: Job[] = [
  { id: "j1", nome: "Backup dei dati", descrizione: "Copia di database e allegati.", frequenza: "Ogni giorno alle 02:00", cron: "0 2 * * *", attivo: true, prossima: "Domani, 02:00",
    esecuzioni: [{ quando: "Oggi, 02:00", esito: "completata", durata: "41 s" }, { quando: "Ieri, 02:00", esito: "completata", durata: "39 s" }, { quando: "1 novembre, 02:00", esito: "rifiutata", durata: "3 s", nota: "Spazio di archiviazione esaurito; liberato e ripetuto alle 16:40." }] },
  { id: "j2", nome: "Promemoria richieste ferme", descrizione: "Email a chi ha richieste senza risposta da 3 giorni.", frequenza: "Ogni giorno alle 09:00", cron: "0 9 * * *", attivo: true, prossima: "Oggi, 09:00",
    esecuzioni: [{ quando: "Ieri, 09:00", esito: "completata", durata: "6 s", nota: "4 promemoria inviati." }] },
  { id: "j3", nome: "Riepilogo settimanale", descrizione: "Statistiche della settimana agli amministratori.", frequenza: "Ogni lunedì alle 08:00", cron: "0 8 * * 1", attivo: true, prossima: "Lunedì, 08:00",
    esecuzioni: [{ quando: "Lunedì scorso, 08:00", esito: "completata", durata: "12 s" }] },
  { id: "j4", nome: "Pulizia file temporanei", descrizione: "Elimina caricamenti incompleti più vecchi di 24 ore.", frequenza: "Ogni ora", cron: "0 * * * *", attivo: true, prossima: "Alle 13:00",
    esecuzioni: [{ quando: "Alle 12:00", esito: "completata", durata: "1 s" }] },
  { id: "j5", nome: "Archiviazione richieste chiuse", descrizione: "Sposta in archivio le richieste chiuse da più di un anno.", frequenza: "Il primo del mese alle 03:00", cron: "0 3 1 * *", attivo: false, prossima: "Spenta",
    esecuzioni: [] },
];
