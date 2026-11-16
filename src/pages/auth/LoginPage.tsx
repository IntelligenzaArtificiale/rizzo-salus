/*
 * Pagina di accesso. Orchestrazione: campi (useFormFields), invio, esito.
 * - Bottone attivo solo con email valida e password scritta: niente rosso sui campi vuoti.
 * - Credenziali errate: messaggio sotto la password, password svuotata e cursore lì.
 * - Stato dell'account (sospeso, bloccato…): toast con l'azione da fare, campi intatti.
 */
import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { TextField } from "@/components/form/TextField";
import { PasswordField } from "@/components/form/PasswordField";
import { Checkbox } from "@/components/form/Checkbox";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/components/feedback/toast-context";
import { login } from "@/api/auth";
import { readLastEmail, saveLastEmail, saveSession } from "@/lib/session";
import { email as emailRule } from "@/lib/validation";
import { useFormFields } from "@/lib/forms/useFormFields";
import { LOGIN_ERRORS, fallbackLoginError } from "@/lib/messages/login-errors";
import { usePlatform } from "@/lib/platform/PlatformContext";

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const passwordRef = useRef<HTMLInputElement>(null);
  const { on, settings } = usePlatform();
  const [rememberedEmail] = useState(readLastEmail);
  const form = useFormFields({
    email: { initial: rememberedEmail, rules: [emailRule] },
    password: { rules: [] },
  });
  const [remember, setRemember] = useState(true);
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.isValid || sending) return;

    const email = form.values.email.trim().toLowerCase();
    setSending(true);
    const result = await login({ email, password: form.values.password, remember });
    setSending(false);

    if (result.ok) {
      saveSession(result.data, remember);
      saveLastEmail(remember ? email : null);
      navigate(settings.roles[result.data.role]?.permessi.includes("dashboard.admin") ? "/admin" : "/area");
      return;
    }
    const message = LOGIN_ERRORS[result.error] ?? fallbackLoginError;
    if (message.marksFields) {
      setWrongCredentials(true);
      form.setValue("password", "");
      passwordRef.current?.focus();
      return;
    }
    toast.show({ tone: "error", title: message.title, body: message.body, action: message.action });
  }

  const emailField = form.field("email");
  const passwordField = form.field("password");
  const editing = (apply: (v: string) => void) => (v: string) => {
    if (wrongCredentials) setWrongCredentials(false);
    apply(v);
  };

  return (
    <AuthLayout
      title="Accedi al tuo account"
      aside={on("registrazione") && (
        <>
          Non hai ancora un account?{" "}
          <Link to="/registrazione" className="font-medium text-accent-ink hover:underline">Crea un account</Link>
        </>
      )}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-1">
        <TextField
          {...emailField}
          onChange={editing(emailField.onChange)}
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus={!rememberedEmail}
          placeholder="nome@azienda.it"
          error={emailField.error ?? (wrongCredentials ? " " : null)}
        />
        <PasswordField
          {...passwordField}
          onChange={editing(passwordField.onChange)}
          inputRef={passwordRef}
          label="Password"
          autoComplete="current-password"
          autoFocus={Boolean(rememberedEmail)}
          error={wrongCredentials ? "Email o password non corretti." : null}
          labelAside={
            <Link to="/password-dimenticata" className="text-[13px] font-medium text-accent-ink hover:underline">
              Hai dimenticato la password?
            </Link>
          }
        />
        <div className="mb-5">
          <Checkbox checked={remember} onChange={setRemember} label="Ricordami su questo dispositivo" />
        </div>
        <Button
          type="submit"
          variant="accent"
          disabled={!form.isValid || sending}
          aria-busy={sending}
          className="h-10 w-full rounded-[8px] text-[14px] font-semibold hover:bg-accent hover:brightness-110 aria-busy:opacity-100"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 rounded-full border-2 border-white/40 border-t-white anim-spin" />
              Accesso in corso
            </span>
          ) : (
            "Accedi"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
