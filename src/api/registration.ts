/*
 * Registrazione e verifica email. Endpoint PHP attesi:
 * POST /auth/email-disponibile    { email }                → { disponibile }
 * POST /auth/registrazione/inizia { nome, email }          → {}            (invia il link, modo "verifica-prima")
 * POST /auth/verifica-email       { token }                → VerifiedEmail  errori: link_scaduto, link_usato
 * POST /auth/registrazione        { token?, dati }         → { verificaInviata } errori: email_esistente
 * POST /auth/reinvia-link         { email, scopo }         → {}            errori: troppi_invii
 */
import { apiPost } from "@/api/client";
import type { RegistrationMode } from "@/config/app";

export type RegistrationData = Record<string, string | string[] | boolean>;

export type VerifiedEmail = { nome: string; email: string; modo: RegistrationMode };

export const checkEmailAvailable = (email: string) => apiPost<{ disponibile: boolean }>("/auth/email-disponibile", { email });

export const startRegistration = (nome: string, email: string) => apiPost<object>("/auth/registrazione/inizia", { nome, email });

export const verifyEmail = (token: string) => apiPost<VerifiedEmail>("/auth/verifica-email", { token });

/** token presente: completa dopo la verifica. Assente: registrazione completa, il server invia il link. */
export const submitRegistration = (dati: RegistrationData, token?: string) =>
  apiPost<{ verificaInviata: boolean }>("/auth/registrazione", { token, dati });

export const resendLink = (email: string, scopo: "verifica" | "password") => apiPost<object>("/auth/reinvia-link", { email, scopo });
