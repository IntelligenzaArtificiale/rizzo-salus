/* Utenti finti. "ultimo" è già scritto come lo legge una persona; "attivita" va da nessuna a alta. */
export type UserRole = "admin" | "operatore" | "cliente";
export type UserState = "attivo" | "sospeso" | "bloccato" | "disabilitato";
export type Activity = "strong" | "weak" | "veryweak" | "none";

export type UserItem = {
  id: string; nome: string; email: string; ruolo: UserRole; stato: UserState;
  azienda: string; telefono: string; ultimo: string; attivita: Activity; creato: string;
};

export const USERS: UserItem[] = [
  { id: "u1", nome: "Giulia Ferraro", email: "admin@demo.it", ruolo: "admin", stato: "attivo", azienda: "Sede Catania", telefono: "+39 095 123 4567", ultimo: "Oggi", attivita: "strong", creato: "2025-03-12" },
  { id: "u2", nome: "Marco Russo", email: "utente@demo.it", ruolo: "cliente", stato: "attivo", azienda: "Edil Sud S.r.l.", telefono: "+39 333 123 4567", ultimo: "Ieri", attivita: "strong", creato: "2025-06-02" },
  { id: "u3", nome: "Luca Greco", email: "luca.greco@esempio.it", ruolo: "operatore", stato: "attivo", azienda: "Sede Catania", telefono: "+39 347 555 0192", ultimo: "Oggi", attivita: "strong", creato: "2025-04-18" },
  { id: "u4", nome: "Sara Lombardo", email: "sara.lombardo@esempio.it", ruolo: "operatore", stato: "attivo", azienda: "Sede Catania", telefono: "+39 349 221 8830", ultimo: "3 giorni fa", attivita: "weak", creato: "2025-04-18" },
  { id: "u5", nome: "Salvo Pappalardo", email: "studio@pappalardo.it", ruolo: "cliente", stato: "attivo", azienda: "Studio Arch. Pappalardo", telefono: "+39 095 778 1020", ultimo: "2 settimane fa", attivita: "weak", creato: "2025-09-30" },
  { id: "u6", nome: "Agata Sciuto", email: "ferramenta@sciuto.it", ruolo: "cliente", stato: "sospeso", azienda: "Ferramenta Sciuto", telefono: "+39 095 340 1188", ultimo: "2 mesi fa", attivita: "veryweak", creato: "2025-02-11" },
  { id: "u7", nome: "Rosario Musumeci", email: "info@lepalme.it", ruolo: "cliente", stato: "attivo", azienda: "Condominio Le Palme", telefono: "+39 340 990 1234", ultimo: "1 settimana fa", attivita: "weak", creato: "2026-10-30" },
  { id: "u8", nome: "Carmelo Russo", email: "c.russo@russocostruzioni.it", ruolo: "cliente", stato: "bloccato", azienda: "Impresa Russo Costruzioni", telefono: "+39 335 120 4455", ultimo: "5 mesi fa", attivita: "veryweak", creato: "2024-11-05" },
  { id: "u9", nome: "Elena Catania", email: "elena@ceramicheetna.it", ruolo: "cliente", stato: "disabilitato", azienda: "Showroom Ceramiche Etna", telefono: "+39 338 765 4321", ultimo: "Mai", attivita: "none", creato: "2026-01-20" },
];

export const ROLE_LABEL: Record<UserRole, string> = { admin: "Amministratore", operatore: "Operatore", cliente: "Cliente" };
export const STATE_LABEL: Record<UserState, string> = { attivo: "Attivo", sospeso: "Sospeso", bloccato: "Bloccato", disabilitato: "Disabilitato" };
export const ACTIVITY_LABEL: Record<Activity, string> = { strong: "Alta", weak: "Media", veryweak: "Bassa", none: "Nessuna" };
