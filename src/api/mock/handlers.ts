/*
 * Backend finto per mockup e sviluppo. Simula latenza e risposte del PHP.
 * Si attiva solo quando apiBaseUrl effettivo (runtime o build) è vuoto.
 */
import type { ApiResult } from "@/api/client";
import { mockLogin } from "@/api/mock/auth.mock";
import { registrationMocks } from "@/api/mock/registration.mock";
import { appMocks } from "@/api/mock/app.mock";
import { extraMocks } from "@/api/mock/extra.mock";
import { recordAudit } from "@/api/mock/audit.mock";
import { assistantMocks } from "@/api/mock/assistant.mock";
import { adminMocks } from "@/api/mock/admin.mock";

type Handler = (body: unknown) => ApiResult<unknown>;

const routes: Record<string, Handler> = {
  "/auth/login": mockLogin,
  ...registrationMocks,
  ...appMocks,
  ...extraMocks,
  ...assistantMocks,
  ...adminMocks,
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockHandlers = {
  async handle<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    await wait(path.startsWith("/auth") ? 700 : path === "/backup/crea" ? 1800 : path === "/attivita/esegui" ? 1200 : 350);
    const handler = routes[path];
    if (!handler) return { ok: false, error: "non_trovato" };
    const result = handler(body) as ApiResult<T>;
    if (result.ok) recordAudit(path, body);
    return result;
  },
};
