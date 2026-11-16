/* Ingresso "/": con sessione porta alla dashboard del ruolo, senza sessione alla pagina iniziale scelta. */
import { Navigate } from "react-router-dom";
import { readSession } from "@/lib/session";
import { usePlatform } from "@/lib/platform/PlatformContext";

export function HomeRedirect({ guest }: { guest: string }) {
  const { can } = usePlatform();
  if (!readSession()) return <Navigate to={guest} replace />;
  return <Navigate to={can("dashboard.admin") ? "/admin" : "/area"} replace />;
}
