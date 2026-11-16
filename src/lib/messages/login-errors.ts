/*
 * Testi per gli esiti negativi dell'accesso, per codice d'errore del backend.
 * Linguaggio dell'utente: cosa è successo e cosa può fare. Nessun dettaglio tecnico.
 */
import { appConfig } from "@/config/app";

export type LoginErrorMessage = {
  title: string;
  body: string;
  /** "credenziali" segna i campi, gli stati account no. */
  marksFields?: boolean;
  /** href interno ("/percorso") o esterno ("mailto:", "https:") */
  action?: { label: string; href: string };
};

const support = { label: "Contatta l'assistenza", href: `mailto:${appConfig.supportEmail}` };

export const LOGIN_ERRORS: Record<string, LoginErrorMessage> = {
  credenziali: {
    title: "Email o password non corretti",
    body: "Controlla i dati e riprova. Se non ricordi la password puoi reimpostarla.",
    marksFields: true,
  },
  non_verificato: {
    title: "Conferma la tua email",
    body: "Ti abbiamo inviato un link di attivazione. Aprilo per completare la registrazione.",
    action: { label: "Invia di nuovo il link", href: "/conferma-email" },
  },
  disabilitato: {
    title: "Account disabilitato",
    body: "L'accesso è stato disattivato dall'amministratore.",
    action: support,
  },
  bloccato: {
    title: "Account bloccato",
    body: "Troppi tentativi non riusciti. Reimposta la password per sbloccarlo.",
    action: { label: "Reimposta la password", href: "/password-dimenticata" },
  },
  sospeso: {
    title: "Account sospeso",
    body: "L'account è sospeso temporaneamente. Per sapere perché, scrivi all'assistenza.",
    action: support,
  },
  eliminato: {
    title: "Account eliminato",
    body: "Questo account non esiste più. Puoi crearne uno nuovo con la stessa email.",
    action: { label: "Registrati", href: "/registrazione" },
  },
  rete: {
    title: "Connessione non riuscita",
    body: "Controlla la connessione e riprova.",
  },
};

export const fallbackLoginError: LoginErrorMessage = {
  title: "Accesso non riuscito",
  body: "Riprova tra qualche minuto.",
};
