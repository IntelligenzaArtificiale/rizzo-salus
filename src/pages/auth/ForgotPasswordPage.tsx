/* Password dimenticata: email → link per sceglierne una nuova. Risposta neutra per sicurezza. */
import { Link } from "react-router-dom";
import { EmailLinkRequest } from "@/components/feedback/EmailLinkRequest";
import { PreviewLink } from "@/components/feedback/PreviewLink";
import { requestPasswordReset } from "@/api/password";

export function ForgotPasswordPage() {
  return (
    <EmailLinkRequest
      title="Reimposta la password"
      subtitle="Ti mandiamo un link per sceglierne una nuova."
      submitLabel="Invia il link"
      aside={<>Ti sei ricordato? <Link to="/accedi" className="font-medium text-accent-ink hover:underline">Accedi</Link></>}
      send={async (email) => (await requestPasswordReset(email)).ok}
      sentText={(email) => (
        <>Se <strong className="font-medium text-ink">{email}</strong> è registrata, riceverai un link per scegliere una nuova password.</>
      )}
      preview={<PreviewLink to="/nuova-password/valido">Apri il link ricevuto</PreviewLink>}
    />
  );
}
