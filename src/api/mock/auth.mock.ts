/*
 * Account finti. La password giusta per tutti è "Password123".
 * L'email decide lo stato dell'account, per provare ogni messaggio.
 */
import type { ApiResult } from "@/api/client";
import type { LoginInput, SessionUser } from "@/api/auth";

const DEMO_PASSWORD = "Password123";

const ACCOUNTS: Record<string, { user?: SessionUser; error?: string }> = {
  "admin@demo.it": { user: { id: "1", name: "Giulia Ferraro", email: "admin@demo.it", role: "admin" } },
  "utente@demo.it": { user: { id: "2", name: "Marco Russo", email: "utente@demo.it", role: "utente" } },
  "nonverificato@demo.it": { error: "non_verificato" },
  "disabilitato@demo.it": { error: "disabilitato" },
  "bloccato@demo.it": { error: "bloccato" },
  "sospeso@demo.it": { error: "sospeso" },
  "eliminato@demo.it": { error: "eliminato" },
};

export function mockLogin(body: unknown): ApiResult<SessionUser> {
  const { email, password } = body as LoginInput;
  const account = ACCOUNTS[email.trim().toLowerCase()];
  if (!account || password !== DEMO_PASSWORD) return { ok: false, error: "credenziali" };
  if (account.error) return { ok: false, error: account.error };
  return { ok: true, data: account.user! };
}
