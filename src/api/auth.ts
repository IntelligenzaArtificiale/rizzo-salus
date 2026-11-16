/* Chiamate di autenticazione. Endpoint PHP attesi: POST /auth/login */
import { apiPost } from "@/api/client";

export type SessionUser = { id: string; name: string; email: string; role: "admin" | "operatore" | "utente" };

export type LoginInput = { email: string; password: string; remember: boolean };

/** Codici d'errore possibili: credenziali, non_verificato, disabilitato, bloccato, sospeso, eliminato, rete */
export function login(input: LoginInput) {
  return apiPost<SessionUser>("/auth/login", input);
}
