/*
 * Schema comune "scrivi l'email, ti mandiamo un link": password dimenticata e nuova
 * email di conferma. Dopo l'invio mostra EmailSentPanel con reinvio e correzione.
 * Il testo di conferma resta neutro: non rivela se l'email è registrata.
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { TextField } from "@/components/form/TextField";
import { PrimaryButton } from "@/components/form/PrimaryButton";
import { EmailSentPanel } from "@/components/feedback/EmailSentPanel";
import { useToast } from "@/components/feedback/toast-context";
import { useFormFields } from "@/lib/forms/useFormFields";
import { email as emailRule } from "@/lib/validation";
import { readLastEmail } from "@/lib/session";

type EmailLinkRequestProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  aside?: ReactNode;
  sentText: (email: string) => ReactNode;
  send: (email: string) => Promise<boolean>;
  preview?: ReactNode;
};

export function EmailLinkRequest({ title, subtitle, submitLabel, aside, sentText, send, preview }: EmailLinkRequestProps) {
  const toast = useToast();
  const form = useFormFields({ email: { initial: readLastEmail(), rules: [emailRule] } });
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid || sending) return;
    const email = form.values.email.trim().toLowerCase();
    setSending(true);
    const ok = await send(email);
    setSending(false);
    if (ok) setSentTo(email);
    else toast.show({ tone: "error", title: "Invio non riuscito", body: "Controlla la connessione e riprova." });
  }

  if (sentTo) {
    return (
      <AuthLayout>
        <EmailSentPanel onResend={() => send(sentTo)} onEditEmail={() => setSentTo(null)} preview={preview}>
          {sentText(sentTo)}
        </EmailSentPanel>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={title} subtitle={subtitle} aside={aside}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-1">
        <TextField {...form.field("email")} label="Email" type="email" inputMode="email" autoComplete="email" placeholder="nome@azienda.it" autoFocus />
        <PrimaryButton className="mt-3" disabled={!form.isValid} busy={sending} busyLabel="Invio in corso">
          {submitLabel}
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
