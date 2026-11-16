/*
 * Sessione lato client: solo i dati per l'interfaccia (nome, ruolo).
 * L'autenticazione vera resta al backend (cookie di sessione PHP).
 */
import type { SessionUser } from "@/api/auth";

const KEY = "sessione";

export function saveSession(user: SessionUser, remember: boolean) {
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(user));
  } catch {
    /* archiviazione non disponibile: la sessione dura quanto la pagina */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* niente da pulire */
  }
}

export function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

/* Ultima email usata con "Ricordami": precompila il login la volta dopo. */
const LAST_EMAIL = "ultima-email";

export function saveLastEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(LAST_EMAIL, email);
    else localStorage.removeItem(LAST_EMAIL);
  } catch {
    /* archiviazione non disponibile */
  }
}

export function readLastEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL) ?? "";
  } catch {
    return "";
  }
}
