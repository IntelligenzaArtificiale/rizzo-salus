/* Impostazioni della piattaforma. Endpoint PHP: POST /impostazioni/leggi {}, POST /impostazioni/salva { dati }. */
import { apiPost } from "@/api/client";
import type { PlatformSettings } from "@/lib/platform/defaults";

export const getSettings = () => apiPost<PlatformSettings>("/impostazioni/leggi", {});
export const saveSettings = (dati: PlatformSettings) => apiPost<object>("/impostazioni/salva", { dati });
