/*
 * Nuova password dal link ricevuto (#/nuova-password/:token).
 * Controlla il link all'apertura; dopo il salvataggio porta al login con l'email già scritta.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FieldsStep } from "@/components/wizard/FieldsStep";
import { StatusPanel } from "@/components/feedback/StatusPanel";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { PrimaryLink } from "@/components/form/PrimaryButton";
import { useToast } from "@/components/feedback/toast-context";
import { checkResetToken, setNewPassword } from "@/api/password";
import { saveLastEmail } from "@/lib/session";
import { LINK_ERRORS, fallbackLinkError } from "@/lib/messages/link-errors";

type State = { status: "loading" } | { status: "error"; code: string } | { status: "ok"; email: string };

export function ResetPasswordPage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [state, setState] = useState<State>({ status: "loading" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkResetToken(token).then((r) => setState(r.ok ? { status: "ok", email: r.data.email } : { status: "error", code: r.error }));
  }, [token]);

  if (state.status === "loading") return <LoadingPanel label="Controllo del link" />;

  if (state.status === "error") {
    const message = LINK_ERRORS[state.code] ?? fallbackLinkError;
    return (
      <AuthLayout>
        <StatusPanel kind="error" title={message.title} actions={<PrimaryLink to="/password-dimenticata">Richiedi un nuovo link</PrimaryLink>}>
          {message.body}
        </StatusPanel>
      </AuthLayout>
    );
  }

  const { email } = state;

  async function save(password: string) {
    setSaving(true);
    const result = await setNewPassword(token, password);
    setSaving(false);
    if (!result.ok) {
      setState({ status: "error", code: result.error });
      return;
    }
    saveLastEmail(email);
    toast.show({ tone: "success", title: "Password aggiornata", body: "Accedi con la nuova password." });
    navigate("/accedi");
  }

  return (
    <AuthLayout title="Scegli una nuova password" subtitle={<>Per l'account <strong className="font-medium text-ink">{email}</strong>.</>}>
      <FieldsStep
        fields={[{ kind: "password-new", name: "password", label: "Nuova password" }]}
        data={{}}
        submitLabel="Salva la password"
        busyLabel="Salvataggio"
        busy={saving}
        onDone={(patch) => save(String(patch.password))}
      />
    </AuthLayout>
  );
}
