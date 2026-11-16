/*
 * Dati finti di registrazione, recupero password e link.
 * Token dei link: "valido", "scaduto", "usato". "esistente@demo.it" risulta già registrata.
 * Il modo del token "valido-dopo" simula il link inviato a fine registrazione.
 */
import type { ApiResult } from "@/api/client";
import type { VerifiedEmail } from "@/api/registration";

const TAKEN = ["esistente@demo.it", "admin@demo.it", "utente@demo.it"];

const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data });
const fail = (error: string): ApiResult<never> => ({ ok: false, error });

function tokenError(token: string) {
  if (token === "scaduto") return fail("link_scaduto");
  if (token === "usato") return fail("link_usato");
  return null;
}

export const registrationMocks = {
  "/auth/email-disponibile": (body: unknown) => {
    const { email } = body as { email: string };
    return ok({ disponibile: !TAKEN.includes(email.trim().toLowerCase()) });
  },
  "/auth/registrazione/inizia": (body: unknown) => {
    const { email } = body as { email: string };
    return TAKEN.includes(email.trim().toLowerCase()) ? fail("email_esistente") : ok({});
  },
  "/auth/verifica-email": (body: unknown) => {
    const { token } = body as { token: string };
    const error = tokenError(token);
    if (error) return error;
    const data: VerifiedEmail = {
      nome: "Marco Russo",
      email: "marco.russo@esempio.it",
      modo: token === "valido-dopo" ? "verifica-dopo" : "verifica-prima",
    };
    return ok(data);
  },
  "/auth/registrazione": (body: unknown) => {
    const { token } = body as { token?: string };
    return ok({ verificaInviata: !token });
  },
  "/auth/reinvia-link": () => ok({}),
  "/auth/password-dimenticata": () => ok({}),
  "/auth/nuova-password/verifica": (body: unknown) => {
    const { token } = body as { token: string };
    return tokenError(token) ?? ok({ email: "marco.russo@esempio.it" });
  },
  "/auth/nuova-password": (body: unknown) => {
    const { token } = body as { token: string };
    return tokenError(token) ?? ok({});
  },
};
