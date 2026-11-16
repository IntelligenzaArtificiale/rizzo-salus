/* Notifiche, registro attività e conversazioni dell'assistente, finti. */
export type NotificationItem = { id: string; titolo: string; testo: string; quando: string; letta: boolean; link: string; tipo: "richiesta" | "account" | "sistema" };

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", titolo: "Nuova richiesta R-1042", testo: "Edil Sud S.r.l. · Fornitura adesivo per piastrelle", quando: "10 min fa", letta: false, link: "/richieste/R-1042", tipo: "richiesta" },
  { id: "n2", titolo: "R-1041 è in corso", testo: "Luca Greco ha preso in carico il sopralluogo", quando: "Ieri, 16:41", letta: false, link: "/richieste/R-1041", tipo: "richiesta" },
  { id: "n3", titolo: "Nuovo utente registrato", testo: "Rosario Musumeci · Condominio Le Palme", quando: "Ieri, 09:12", letta: false, link: "/admin/utenti/u7", tipo: "account" },
  { id: "n4", titolo: "R-1039 completata", testo: "Reso sigillante gestito da Marco Russo", quando: "31 ott", letta: true, link: "/richieste/R-1039", tipo: "richiesta" },
  { id: "n5", titolo: "Account sospeso", testo: "Ferramenta Sciuto non può più accedere", quando: "28 ott", letta: true, link: "/admin/utenti/u6", tipo: "account" },
  { id: "n6", titolo: "Backup completato", testo: "Tutti i dati sono stati salvati", quando: "27 ott", letta: true, link: "/admin/impostazioni", tipo: "sistema" },
];

export type AuditItem = {
  id: string; quando: string; chi: string; azione: "creazione" | "modifica" | "eliminazione" | "accesso";
  oggetto: string; descrizione: string;
  modifiche: { campo: string; prima: string; dopo: string }[];
};

export const AUDIT: AuditItem[] = [
  { id: "a1", quando: "2026-11-02 09:14", chi: "Marco Russo", azione: "modifica", oggetto: "Richiesta R-1042", descrizione: "Ha cambiato la priorità", modifiche: [{ campo: "Priorità", prima: "Media", dopo: "Alta" }] },
  { id: "a2", quando: "2026-11-02 08:58", chi: "Marco Russo", azione: "creazione", oggetto: "Richiesta R-1042", descrizione: "Ha creato la richiesta", modifiche: [{ campo: "Titolo", prima: "—", dopo: "Fornitura adesivo per piastrelle" }, { campo: "Cliente", prima: "—", dopo: "Edil Sud S.r.l." }] },
  { id: "a3", quando: "2026-11-01 16:41", chi: "Giulia Ferraro", azione: "modifica", oggetto: "Richiesta R-1041", descrizione: "Ha assegnato e avviato la richiesta", modifiche: [{ campo: "Stato", prima: "Da fare", dopo: "In corso" }, { campo: "Assegnata a", prima: "—", dopo: "Luca Greco" }] },
  { id: "a4", quando: "2026-11-01 09:12", chi: "Rosario Musumeci", azione: "creazione", oggetto: "Utente Rosario Musumeci", descrizione: "Si è registrato", modifiche: [{ campo: "Email", prima: "—", dopo: "info@lepalme.it" }] },
  { id: "a5", quando: "2026-10-31 10:20", chi: "Marco Russo", azione: "modifica", oggetto: "Richiesta R-1039", descrizione: "Ha completato la richiesta", modifiche: [{ campo: "Stato", prima: "In corso", dopo: "Completata" }] },
  { id: "a6", quando: "2026-10-28 15:03", chi: "Giulia Ferraro", azione: "modifica", oggetto: "Utente Agata Sciuto", descrizione: "Ha sospeso l'account", modifiche: [{ campo: "Stato", prima: "Attivo", dopo: "Sospeso" }] },
  { id: "a7", quando: "2026-10-27 18:30", chi: "Giulia Ferraro", azione: "eliminazione", oggetto: "Richiesta R-1029", descrizione: "Ha eliminato una richiesta duplicata", modifiche: [{ campo: "Titolo", prima: "Fornitura primer", dopo: "—" }] },
  { id: "a8", quando: "2026-10-27 08:01", chi: "Luca Greco", azione: "accesso", oggetto: "Account", descrizione: "Ha effettuato l'accesso", modifiche: [] },
];

export type ChatThread = { id: string; titolo: string; prompt: string };

export const CHATS: ChatThread[] = [
  { id: "c1", titolo: "Richieste ferme da una settimana", prompt: "Quali richieste sono ferme da più di una settimana?" },
  { id: "c2", titolo: "Riepilogo di ottobre", prompt: "Fammi un riepilogo delle richieste di ottobre" },
  { id: "c3", titolo: "Ciclo per terrazzo con infiltrazioni", prompt: "Che ciclo consigli per un terrazzo con infiltrazioni?" },
  { id: "c4", titolo: "Bozza risposta a Edil Sud", prompt: "Scrivi una risposta a Edil Sud per la R-1042" },
];
