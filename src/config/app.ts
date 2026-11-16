/*
 * Configurazione unica dell'app. Nessun dominio o percorso nel codice delle pagine.
 * app-config.js (runtime pubblico) prevale su VITE_*; mai inserire credenziali.
 */
export type RegistrationMode = "verifica-prima" | "verifica-dopo";

type RuntimeConfig = { name?: string; apiBaseUrl?: string; supportEmail?: string };
declare global { interface Window { __APP_CONFIG__?: RuntimeConfig } }
const runtime = window.__APP_CONFIG__ ?? {};
const configuredApi = runtime.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL ?? "";
const apiBaseUrl = configuredApi.trim().replace(/\/+$/, "");

export const appConfig = {
  name: runtime.name ?? import.meta.env.VITE_APP_NAME ?? "Nome piattaforma",
  /** Base URL delle API PHP, es. "https://dominio.it/app/api". Vuoto = dati finti. */
  apiBaseUrl,
  /** "hash" per Aruba (nessuna regola di rewrite), "memory" per anteprime incorporate. */
  router: (import.meta.env.VITE_ROUTER ?? "hash") as "hash" | "memory",
  /**
   * Registrazione:
   * "verifica-prima" = nome ed email, link di verifica, poi gli altri passaggi;
   * "verifica-dopo" = tutti i passaggi, link di verifica alla fine.
   */
  registrationMode: (import.meta.env.VITE_REGISTRATION_MODE ?? "verifica-prima") as RegistrationMode,
  /** secondi prima di poter reinviare un link */
  resendCooldown: 60,
  supportEmail: runtime.supportEmail ?? import.meta.env.VITE_SUPPORT_EMAIL ?? "assistenza@esempio.it",
};

export const useMockApi = appConfig.apiBaseUrl === "";
