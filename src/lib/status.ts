/*
 * Da stato del dominio a etichetta leggibile e tono di StatusPill. Un solo posto per progetto:
 * le pagine non scrivono colori o parole di stato a mano. Esempio con stati generici;
 * in un progetto si sostituiscono le chiavi con quelle restituite dal backend.
 */
export type StatusTone = "green" | "orange" | "red" | "accent" | "neutral";
export type StatusInfo = { label: string; tone: StatusTone };

/** completato → green · in attesa di qualcuno → orange · bloccato/rifiutato → red · in lavorazione → accent · chiuso/bozza → neutral */
export const STATUS: Record<string, StatusInfo> = {
  nuova: { label: "Nuova", tone: "accent" },
  in_lavorazione: { label: "In lavorazione", tone: "accent" },
  in_attesa: { label: "In attesa", tone: "orange" },
  da_approvare: { label: "Da approvare", tone: "orange" },
  approvata: { label: "Approvata", tone: "green" },
  completata: { label: "Completata", tone: "green" },
  disponibile: { label: "Disponibile", tone: "green" },
  su_richiesta: { label: "Su richiesta", tone: "orange" },
  non_disponibile: { label: "Non disponibile", tone: "red" },
  rifiutata: { label: "Rifiutata", tone: "red" },
  scaduta: { label: "Scaduta", tone: "neutral" },
  bozza: { label: "Bozza", tone: "neutral" },
  archiviata: { label: "Archiviata", tone: "neutral" },
};

/** stato sconosciuto: mai mostrare la chiave grezza del backend */
export const statusOf = (key: string | null | undefined): StatusInfo => (key && STATUS[key]) || { label: "Da verificare", tone: "neutral" };
