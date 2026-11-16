// Aspetto del boilerplate; ruoli e configurazioni operative appartengono a ClinicContext/API PHP.
import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  DEFAULT_SETTINGS,
  type FeatureKey,
  type Permission,
  type PlatformSettings,
} from "./defaults";
import { applyBrandColor } from "./brandColors";
import { applyAppearance } from "./appearance";
const settings: PlatformSettings = {
  ...DEFAULT_SETTINGS,
  features: {
    ...DEFAULT_SETTINGS.features,
    registrazione: false,
    blog: false,
    notifiche: false,
    ricerca: false,
  },
  brand: {
    ...DEFAULT_SETTINGS.brand,
    nome: "Poliambulatorio Rizzo",
    colore: "#2563eb",
    email: "segreteria@demo.it",
    telefono: "081 123 4567",
    indirizzo: "Via Roma 1, Napoli",
  },
  seo: {
    ...DEFAULT_SETTINGS.seo,
    titolo: "%s · Poliambulatorio Rizzo",
    indicizza: false,
  },
};
type PlatformApi = {
  settings: PlatformSettings;
  on: (f: FeatureKey) => boolean;
  can: (p: Permission) => boolean;
  update: (patch: Partial<PlatformSettings>) => Promise<boolean>;
};
const Context = createContext<PlatformApi | null>(null);
export function PlatformProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyBrandColor(settings.brand.colore);
    applyAppearance(document.documentElement, settings.aspetto);
  }, []);
  return (
    <Context.Provider
      value={{
        settings,
        on: (f) => settings.features[f],
        can: () => false,
        update: async () => false,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePlatform() {
  const c = useContext(Context);
  if (!c) throw new Error("PlatformProvider richiesto");
  return c;
}
