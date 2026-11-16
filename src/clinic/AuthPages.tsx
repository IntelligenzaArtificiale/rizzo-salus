// Pagine di accesso del boilerplate collegate alle API PHP originali.
import { useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { TextField } from "@/components/form/TextField";
import { PasswordField } from "@/components/form/PasswordField";
import { Checkbox } from "@/components/form/Checkbox";
import { Button } from "@/components/atoms/Button";
import { useFormFields } from "@/lib/forms/useFormFields";
import { email } from "@/lib/validation";
import { landingFor } from "./access";
import { useClinic } from "./ClinicContext";
import { api, ApiError } from "./api";
import { useAction, useLoad } from "./common";
import { PageLoading, PageError } from "@/components/app/PageState";
export function LoginPage() {
  const clinic = useClinic();
  const navigate = useNavigate();
  const [remember, setRemember] = useState(true),
    [error, setError] = useState(""),
    [needsCode, setNeedsCode] = useState(false);
  const action = useAction();
  const ref = useRef<HTMLInputElement>(null);
  const f = useFormFields({
    email: {
      initial: localStorage.getItem("rizzo-email") || "",
      rules: [email],
    },
    password: { rules: [] },
    codice: {
      rules: [(v) => (/^\d{6}$/.test(v) ? null : "Inserisci le sei cifre.")],
      optional: true,
    },
  });
  if (clinic.user) return <Navigate to={landingFor(clinic.can)} replace />;
  return (
    <AuthLayout
      title="Accedi"
      subtitle="Entra nel gestionale del Poliambulatorio Rizzo."
      aside={
        <Link
          to="/password-dimenticata"
          className="font-medium text-accent-ink"
        >
          Password dimenticata?
        </Link>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.isValid) return;
          setError("");
          action.act(async () => {
            try {
              await clinic.login(
                f.values.email,
                f.values.password,
                f.values.codice || undefined,
              );
              if (remember) localStorage.setItem("rizzo-email", f.values.email);
              else localStorage.removeItem("rizzo-email");
              navigate("/");
            } catch (e) {
              if (
                e instanceof ApiError &&
                ["codice_richiesto", "codice_errato"].includes(e.code)
              ) {
                setNeedsCode(true);
                setError(e.code === "codice_richiesto" ? "" : e.message);
              } else {
                setError((e as Error).message);
                f.setValue("password", "");
                ref.current?.focus();
              }
            }
          });
        }}
        className="flex flex-col"
      >
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          autoFocus={!f.values.email}
          {...f.field("email")}
          onChange={(v) => {
            setError("");
            setNeedsCode(false);
            f.setValue("email", v);
          }}
        />
        <PasswordField
          inputRef={ref}
          label="Password"
          autoComplete="current-password"
          autoFocus={Boolean(f.values.email)}
          {...f.field("password")}
          onChange={(v) => {
            setError("");
            f.setValue("password", v);
          }}
          error={!needsCode ? error || f.field("password").error : null}
        />
        {needsCode && (
          <TextField
            autoFocus
            label="Codice di verifica"
            hint="Se hai attivato l’accesso in due passaggi."
            inputMode="numeric"
            autoComplete="one-time-code"
            {...f.field("codice")}
            error={error || f.field("codice").error}
            onChange={(v) => {
              setError("");
              f.setValue("codice", v);
            }}
          />
        )}
        <Checkbox
          label="Ricorda la mia email"
          checked={remember}
          onChange={setRemember}
        />
        <Button
          type="submit"
          variant="accent"
          className="mt-6 h-10 w-full"
          disabled={
            !f.isValid ||
            action.busy ||
            (needsCode && !/^\d{6}$/.test(f.values.codice))
          }
        >
          {action.busy ? "Accesso in corso" : "Accedi"}
        </Button>
      </form>
    </AuthLayout>
  );
}
export function ForgotPage() {
  const f = useFormFields({ email: { rules: [email] } }),
    a = useAction();
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout
      title={sent ? "Controlla la tua email" : "Recupera la password"}
      subtitle={
        sent
          ? "Se l’indirizzo è registrato, riceverai un link per scegliere una nuova password."
          : "Ti inviamo un link per scegliere una nuova password."
      }
      aside={<Link to="/accedi">Torna all’accesso</Link>}
    >
      {!sent && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (f.isValid)
              a.act(async () => {
                await api("/auth/password-dimenticata", {
                  email: f.values.email,
                });
                setSent(true);
              });
          }}
        >
          <TextField
            label="Email"
            type="email"
            autoFocus
            {...f.field("email")}
          />
          <Button
            type="submit"
            variant="accent"
            disabled={!f.isValid || a.busy}
          >
            {a.busy ? "Invio in corso" : "Invia il link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
export function ResetPage() {
  const { token } = useParams();
  const load = useLoad(
    () => api("/auth/nuova-password/verifica", { token }),
    [token],
  );
  return (
    <AuthLayout title="Nuova password">
      {load.loading ? (
        <PageLoading />
      ) : load.error ? (
        <PageError message={load.error} onRetry={load.reload} />
      ) : (
        <ResetForm token={token!} />
      )}
    </AuthLayout>
  );
}
function ResetForm({ token }: { token: string }) {
  const navigate = useNavigate(),
    a = useAction();
  const f = useFormFields({
    password: {
      rules: [
        (v) =>
          v.length >= 10 && /[A-Za-z]/.test(v) && /\d/.test(v)
            ? null
            : "Usa almeno 10 caratteri, lettere e numeri.",
      ],
    },
    confirm: { rules: [] },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (f.isValid && f.values.password === f.values.confirm)
          a.act(async () => {
            await api("/auth/nuova-password", {
              token,
              password: f.values.password,
            });
            navigate("/accedi");
          }, "Password aggiornata");
      }}
    >
      <PasswordField
        label="Nuova password"
        hint="Almeno 10 caratteri, lettere e numeri."
        {...f.field("password")}
      />
      <PasswordField
        label="Conferma password"
        {...f.field("confirm")}
        error={
          f.values.confirm && f.values.confirm !== f.values.password
            ? "Le password non coincidono."
            : null
        }
      />
      <Button
        variant="accent"
        type="submit"
        disabled={
          !f.isValid || f.values.password !== f.values.confirm || a.busy
        }
      >
        Salva password
      </Button>
    </form>
  );
}
