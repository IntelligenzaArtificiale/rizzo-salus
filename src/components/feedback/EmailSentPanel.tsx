/*
 * "Controlla la tua email" dopo l'invio di un link. Reinvio con attesa
 * (appConfig.resendCooldown) per evitare invii a raffica; correzione dell'email.
 */
import { useEffect, useState, type ReactNode } from "react";
import { StatusPanel } from "@/components/feedback/StatusPanel";
import { PrimaryButton } from "@/components/form/PrimaryButton";
import { useToast } from "@/components/feedback/toast-context";
import { appConfig } from "@/config/app";

type EmailSentPanelProps = {
  title?: string;
  /** testo sotto il titolo; l'email va evidenziata dal chiamante */
  children: ReactNode;
  onResend: () => Promise<boolean>;
  onEditEmail?: () => void;
  /** solo anteprima: link che simula l'apertura della email */
  preview?: ReactNode;
};

export function EmailSentPanel({ title = "Controlla la tua email", children, onResend, onEditEmail, preview }: EmailSentPanelProps) {
  const toast = useToast();
  const [wait, setWait] = useState(appConfig.resendCooldown);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function resend() {
    setSending(true);
    const ok = await onResend();
    setSending(false);
    if (ok) {
      setWait(appConfig.resendCooldown);
      toast.show({ tone: "success", title: "Link inviato di nuovo" });
    } else {
      toast.show({ tone: "error", title: "Invio non riuscito", body: "Riprova tra qualche minuto." });
    }
  }

  return (
    <StatusPanel
      kind="email"
      title={title}
      actions={
        <>
          {preview}
          <PrimaryButton type="button" onClick={resend} busy={sending} busyLabel="Invio in corso" disabled={wait > 0}
            className={wait > 0 ? "bg-surface text-ink-2 shadow-btn disabled:opacity-100" : ""}>
            {wait > 0 ? `Invia di nuovo tra ${wait} s` : "Invia di nuovo il link"}
          </PrimaryButton>
          {onEditEmail && (
            <button type="button" onClick={onEditEmail} className="text-[13px] font-medium text-ink-2 hover:text-ink">
              Email sbagliata? Modificala
            </button>
          )}
        </>
      }
    >
      {children}
      <p className="mt-2">Controlla anche nella posta indesiderata.</p>
    </StatusPanel>
  );
}
