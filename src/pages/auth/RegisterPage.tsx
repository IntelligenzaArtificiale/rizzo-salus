/*
 * Registrazione nei due modi (config/app.ts → registrationMode, oppure ?modo= nell'URL):
 * - "verifica-prima": nome ed email → link di verifica → il resto dopo il clic (VerifyEmailPage);
 * - "verifica-dopo": tutti i passaggi → link di verifica alla fine.
 */
import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { AuthLayout } from "@/layouts/AuthLayout";
import { RegisterWizard } from "@/components/wizard/RegisterWizard";
import { clearWizard } from "@/components/wizard/useWizard";
import { EmailSentPanel } from "@/components/feedback/EmailSentPanel";
import { PreviewLink } from "@/components/feedback/PreviewLink";
import { useToast } from "@/components/feedback/toast-context";
import { appConfig, type RegistrationMode } from "@/config/app";
import { ACCOUNT_STEP, REGISTRATION_STEPS, type StepDef } from "@/config/registration-steps";
import { resendLink, startRegistration, submitRegistration } from "@/api/registration";

export const REGISTRATION_STORAGE = "registrazione";

const firstStep: StepDef = ACCOUNT_STEP;
const stepsBeforeAnswers = REGISTRATION_STEPS.filter((s) => !s.showIf).length;

export function RegisterPage() {
  const [params] = useSearchParams();
  const mode = (params.get("modo") as RegistrationMode | null) ?? appConfig.registrationMode;
  const toast = useToast();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { on } = usePlatform();
  if (!on("registrazione")) return <Navigate to="/accedi" replace />;

  const failed = (error: string) =>
    toast.show(error === "email_esistente"
      ? { tone: "error", title: "Hai già un account con questa email", body: "Accedi oppure reimposta la password.", action: { label: "Accedi", href: "/accedi" } }
      : { tone: "error", title: "Registrazione non riuscita", body: "Controlla la connessione e riprova." });

  if (sentTo) {
    return (
      <AuthLayout>
        <EmailSentPanel
          onResend={async () => (await resendLink(sentTo, "verifica")).ok}
          onEditEmail={() => setSentTo(null)}
          preview={<PreviewLink to={mode === "verifica-prima" ? "/verifica-email/valido" : "/verifica-email/valido-dopo"}>Apri il link ricevuto</PreviewLink>}
        >
          Abbiamo inviato un link a <strong className="font-medium text-ink">{sentTo}</strong>.
        </EmailSentPanel>
      </AuthLayout>
    );
  }

  if (mode === "verifica-prima") {
    return (
      <RegisterWizard
        steps={[firstStep]}
        storageKey={REGISTRATION_STORAGE}
        totalSteps={stepsBeforeAnswers}
        submitLabel="Continua"
        busyLabel="Invio del link"
        onComplete={async (data) => {
          const result = await startRegistration(String(data.nome), String(data.email));
          if (result.ok) setSentTo(String(data.email));
          else failed(result.error);
        }}
      />
    );
  }

  return (
    <RegisterWizard
      steps={REGISTRATION_STEPS}
      storageKey={REGISTRATION_STORAGE}
      submitLabel="Crea account"
      busyLabel="Creazione account"
      onComplete={async (data) => {
        const result = await submitRegistration(data);
        if (!result.ok) return failed(result.error);
        clearWizard(REGISTRATION_STORAGE);
        setSentTo(String(data.email));
      }}
    />
  );
}
