/*
 * Apertura del link di verifica (#/verifica-email/:token).
 * Modo "verifica-prima": email confermata, prosegue con i passaggi restanti.
 * Modo "verifica-dopo": account attivato, si accede.
 * Link scaduto o già usato: spiega cosa fare.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { RegisterWizard } from "@/components/wizard/RegisterWizard";
import { clearWizard } from "@/components/wizard/useWizard";
import { StatusPanel } from "@/components/feedback/StatusPanel";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { PrimaryLink } from "@/components/form/PrimaryButton";
import { useToast } from "@/components/feedback/toast-context";
import { REGISTRATION_STEPS } from "@/config/registration-steps";
import { submitRegistration, verifyEmail, type VerifiedEmail } from "@/api/registration";
import { saveLastEmail, saveSession } from "@/lib/session";
import { LINK_ERRORS, fallbackLinkError } from "@/lib/messages/link-errors";
import { REGISTRATION_STORAGE } from "@/pages/auth/RegisterPage";

type State = { status: "loading" } | { status: "error"; code: string } | { status: "ok"; info: VerifiedEmail } | { status: "created"; info: VerifiedEmail };

export function VerifyEmailPage() {
  const { token = "" } = useParams();
  const toast = useToast();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    verifyEmail(token).then((r) => setState(r.ok ? { status: "ok", info: r.data } : { status: "error", code: r.error }));
  }, [token]);

  if (state.status === "loading") return <LoadingPanel label="Verifica dell'email in corso" />;

  if (state.status === "error") {
    const message = LINK_ERRORS[state.code] ?? fallbackLinkError;
    return (
      <AuthLayout>
        <StatusPanel kind="error" title={message.title} actions={
          state.code === "link_usato"
            ? <PrimaryLink to="/accedi">Accedi</PrimaryLink>
            : <PrimaryLink to="/conferma-email">Richiedi un nuovo link</PrimaryLink>
        }>
          {message.body}
        </StatusPanel>
      </AuthLayout>
    );
  }

  const { info } = state;

  if (state.status === "created") {
    return (
      <AuthLayout>
        <StatusPanel kind="success" title="Il tuo account è pronto" actions={<PrimaryLink to="/area">Vai alla dashboard</PrimaryLink>}>
          Benvenuto, {info.nome.split(" ")[0]}.
        </StatusPanel>
      </AuthLayout>
    );
  }

  if (info.modo === "verifica-dopo") {
    return (
      <AuthLayout>
        <StatusPanel kind="success" title="Email confermata" actions={<PrimaryLink to="/accedi" onClick={() => saveLastEmail(info.email)}>Accedi</PrimaryLink>}>
          Il tuo account è attivo. Accedi con la password che hai scelto.
        </StatusPanel>
      </AuthLayout>
    );
  }

  return (
    <RegisterWizard
      steps={REGISTRATION_STEPS.slice(1)}
      storageKey={REGISTRATION_STORAGE}
      initialData={{ nome: info.nome, email: info.email }}
      stepOffset={1}
      submitLabel="Crea account"
      busyLabel="Creazione account"
      banner={
        <p className="flex items-center gap-2 rounded-control bg-green-tint px-3 py-2 text-[13px] text-ink">
          <CircleCheck size={15} className="shrink-0 text-green" />
          <span className="min-w-0 truncate"><strong className="font-medium">{info.email}</strong> confermata</span>
        </p>
      }
      onComplete={async (data) => {
        const result = await submitRegistration(data, token);
        if (!result.ok) {
          toast.show({ tone: "error", title: "Registrazione non riuscita", body: "Controlla la connessione e riprova." });
          return;
        }
        clearWizard(REGISTRATION_STORAGE);
        saveSession({ id: "nuovo", name: info.nome, email: info.email, role: "utente" }, true);
        setState({ status: "created", info });
      }}
    />
  );
}
