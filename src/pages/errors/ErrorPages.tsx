/* Pagine d'errore: cosa è successo in una riga e l'azione per uscirne. */
import { AuthLayout } from "@/layouts/AuthLayout";
import { StatusPanel } from "@/components/feedback/StatusPanel";
import { PrimaryLink } from "@/components/form/PrimaryButton";
import { readSession } from "@/lib/session";

const home = () => (readSession()?.role === "admin" ? "/admin" : readSession() ? "/area" : "/accedi");

export function NotFoundPage() {
  return (
    <AuthLayout>
      <StatusPanel title="Pagina non trovata" actions={<PrimaryLink to={home()}>Torna alla home</PrimaryLink>}>
        L'indirizzo potrebbe essere cambiato o non esistere più.
      </StatusPanel>
    </AuthLayout>
  );
}

export function ForbiddenPage() {
  return (
    <AuthLayout>
      <StatusPanel title="Non hai accesso a questa pagina" actions={<PrimaryLink to={home()}>Torna alla home</PrimaryLink>}>
        Se ti serve, chiedi all'amministratore.
      </StatusPanel>
    </AuthLayout>
  );
}

export function SessionExpiredPage() {
  return (
    <AuthLayout>
      <StatusPanel title="Sessione scaduta" actions={<PrimaryLink to="/accedi">Accedi di nuovo</PrimaryLink>}>
        Per sicurezza ti abbiamo disconnesso dopo un periodo di inattività.
      </StatusPanel>
    </AuthLayout>
  );
}
