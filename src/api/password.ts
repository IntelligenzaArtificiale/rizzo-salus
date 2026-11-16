/*
 * Recupero password. Endpoint PHP attesi:
 * POST /auth/password-dimenticata { email }            → {}  sempre ok: non rivela se l'email esiste
 * POST /auth/nuova-password/verifica { token }         → { email }  errori: link_scaduto, link_usato
 * POST /auth/nuova-password      { token, password }   → {}  errori: link_scaduto, link_usato
 */
import { apiPost } from "@/api/client";

export const requestPasswordReset = (email: string) => apiPost<object>("/auth/password-dimenticata", { email });

export const checkResetToken = (token: string) => apiPost<{ email: string }>("/auth/nuova-password/verifica", { token });

export const setNewPassword = (token: string, password: string) => apiPost<object>("/auth/nuova-password", { token, password });
