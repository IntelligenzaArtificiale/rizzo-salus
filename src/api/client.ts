/*
 * Client HTTP unico. Ogni chiamata passa da qui: con apiBaseUrl vuoto risponde il mock,
 * altrimenti fa POST JSON al backend. Le pagine non sanno quale dei due è attivo.
 * Contratto risposta backend: { ok: true, data } oppure { ok: false, error: "<codice>" }.
 */
import { appConfig, useMockApi } from "@/config/app";
import { mockHandlers } from "@/api/mock/handlers";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  if (useMockApi) return mockHandlers.handle<T>(path, body);
  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "rete" };
  }
}
