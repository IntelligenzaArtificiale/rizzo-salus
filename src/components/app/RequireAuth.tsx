/*
 * Protezione delle rotte: senza sessione → sessione scaduta; permesso mancante → 403;
 * modulo spento → 404 (la funzione non esiste per nessuno).
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { readSession } from "@/lib/session";
import { usePlatform } from "@/lib/platform/PlatformContext";
import type { FeatureKey, Permission } from "@/lib/platform/defaults";

export function RequireAuth({ children, perm, feature }: { children: ReactNode; perm?: Permission; feature?: FeatureKey }) {
  const { can, on } = usePlatform();
  if (!readSession()) return <Navigate to="/sessione-scaduta" replace />;
  if (feature && !on(feature)) return <Navigate to="/non-trovata" replace />;
  if (perm && !can(perm)) return <Navigate to="/accesso-negato" replace />;
  return <>{children}</>;
}

/** Mostra il contenuto solo se il modulo è attivo (per parti di pagina). */
export function Feature({ name, children }: { name: FeatureKey; children: ReactNode }) {
  return usePlatform().on(name) ? <>{children}</> : null;
}

/** Rotta pubblica legata a un modulo (es. blog): spento → pagina non trovata. */
export function RequireFeature({ name, children }: { name: FeatureKey; children: ReactNode }) {
  return usePlatform().on(name) ? <>{children}</> : <Navigate to="/non-trovata" replace />;
}
