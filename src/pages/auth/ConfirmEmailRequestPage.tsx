/* Nuovo link di conferma email: da un link scaduto o dal login con email non confermata. */
import { Link } from "react-router-dom";
import { EmailLinkRequest } from "@/components/feedback/EmailLinkRequest";
import { PreviewLink } from "@/components/feedback/PreviewLink";
import { resendLink } from "@/api/registration";

export function ConfirmEmailRequestPage() {
  return (
    <EmailLinkRequest
      title="Conferma la tua email"
      subtitle="Ti mandiamo un nuovo link di conferma."
      submitLabel="Invia il link"
      aside={<>Hai già confermato? <Link to="/accedi" className="font-medium text-accent-ink hover:underline">Accedi</Link></>}
      send={async (email) => (await resendLink(email, "verifica")).ok}
      sentText={(email) => <>Se <strong className="font-medium text-ink">{email}</strong> ha una registrazione in sospeso, riceverai un nuovo link.</>}
      preview={<PreviewLink to="/verifica-email/valido">Apri il link ricevuto</PreviewLink>}
    />
  );
}
