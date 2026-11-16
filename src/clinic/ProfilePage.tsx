// Profilo personale con contratto effettivo nome/cognome e attivazione 2FA completa.
import permissionLabels from "./permission-labels.json";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import { PageTabs } from "@/components/app/PageTabs";
import { SettingsSection, SaveBar } from "@/components/app/SettingsSection";
import { TextField } from "@/components/form/TextField";
import { PasswordField } from "@/components/form/PasswordField";
import { Button } from "@/components/atoms/Button";
import { DetailList } from "@/components/app/Section";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";
import { useFormFields } from "@/lib/forms/useFormFields";
import { useClinic } from "./ClinicContext";
import { api, type Data } from "./api";
import { useAction } from "./common";
export function ProfilePage() {
  const [params, setParams] = useSearchParams(),
    tab = params.get("scheda") || "Dati";
  return (
    <Page>
      <PageHeader title="Profilo" />
      <PageTabs
        options={["Dati", "Sicurezza", "Permessi"]}
        value={tab}
        onChange={(v) => setParams({ scheda: v })}
        label="Profilo"
      />
      {tab === "Dati" ? (
        <ProfileData />
      ) : tab === "Sicurezza" ? (
        <Security />
      ) : (
        <Permissions />
      )}
    </Page>
  );
}
function ProfileData() {
  const { user, refresh } = useClinic();
  const f = useSettingsForm(
    { nome: user?.nome || "", cognome: user?.cognome || "" },
    async (value) => {
      if (!value.nome.trim() || !value.cognome.trim()) return false;
      try {
        await api("/account/salva", value);
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    "Profilo salvato",
  );
  return (
    <form onSubmit={f.submit}>
      <SettingsSection title="Dati personali" description={user?.email}>
        <TextField
          label="Nome"
          value={f.value.nome}
          onChange={(nome) => f.patch({ nome })}
        />
        <TextField
          label="Cognome"
          value={f.value.cognome}
          onChange={(cognome) => f.patch({ cognome })}
        />
      </SettingsSection>
      <SaveBar
        dirty={f.dirty}
        busy={f.busy}
        disabled={!f.value.nome.trim() || !f.value.cognome.trim()}
        onReset={f.reset}
      />
      {f.dialog}
    </form>
  );
}
const policy = (v: string) =>
  v.length >= 10 && /\p{L}/u.test(v) && /\d/.test(v)
    ? null
    : "Usa almeno 10 caratteri, lettere e numeri.";
function Security() {
  const a = useAction(),
    { user, refresh } = useClinic();
  const [setup, setSetup] = useState<Data | null>(null),
    [code, setCode] = useState(""),
    [disablePassword, setDisablePassword] = useState("");
  const f = useFormFields({
    attuale: { rules: [] },
    nuova: { rules: [policy] },
    conferma: { rules: [] },
  });
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (f.isValid && f.values.nuova === f.values.conferma)
            a.act(async () => {
              await api("/account/password", {
                attuale: f.values.attuale,
                nuova: f.values.nuova,
              });
              f.setValue("attuale", "");
              f.setValue("nuova", "");
              f.setValue("conferma", "");
            }, "Password aggiornata");
        }}
      >
        <SettingsSection
          title="Password"
          description="Almeno 10 caratteri, con lettere e numeri."
        >
          <PasswordField
            label="Password attuale"
            autoComplete="current-password"
            {...f.field("attuale")}
          />
          <PasswordField
            label="Nuova password"
            autoComplete="new-password"
            {...f.field("nuova")}
          />
          <PasswordField
            label="Conferma password"
            autoComplete="new-password"
            {...f.field("conferma")}
          />
          <div>
            <Button
              variant="primary"
              type="submit"
              disabled={
                !f.isValid || f.values.nuova !== f.values.conferma || a.busy
              }
            >
              Aggiorna password
            </Button>
          </div>
        </SettingsSection>
      </form>
      <SettingsSection
        title="Accesso in due passaggi"
        description="Aggiungi il codice della tua app di autenticazione."
      >
        {user?.due_fattori ? (
          <>
            <PasswordField
              label="Password per disattivare"
              value={disablePassword}
              onChange={setDisablePassword}
            />
            <div>
              <Button
                variant="secondary"
                disabled={!disablePassword || a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/account/due-passi/disattiva", {
                      password: disablePassword,
                    });
                    setDisablePassword("");
                    await refresh();
                  }, "Verifica in due passaggi disattivata")
                }
              >
                Disattiva
              </Button>
            </div>
          </>
        ) : setup ? (
          <>
            <p className="mb-4 break-all text-[13px] text-ink-2">
              Inserisci questa chiave nella tua app di autenticazione:{" "}
              <strong className="select-all text-ink">{setup.segreto}</strong>
            </p>
            <TextField
              label="Codice dell’app"
              inputMode="numeric"
              value={code}
              onChange={setCode}
              maxLength={6}
            />
            <div>
              <Button
                variant="primary"
                disabled={!/^\d{6}$/.test(code) || a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/account/due-passi/conferma", { codice: code });
                    setSetup(null);
                    setCode("");
                    await refresh();
                  }, "Verifica in due passaggi attivata")
                }
              >
                Conferma attivazione
              </Button>
            </div>
          </>
        ) : (
          <div>
            <Button
              variant="primary"
              disabled={a.busy}
              onClick={() =>
                a.act(async () =>
                  setSetup(await api("/account/due-passi/avvia")),
                )
              }
            >
              Attiva verifica in due passaggi
            </Button>
          </div>
        )}
      </SettingsSection>
    </>
  );
}
function Permissions() {
  const { user } = useClinic();
  return (
    <SettingsSection title="Permessi" description={`Ruolo: ${user?.role}`}>
      <DetailList
        items={(user?.permessi || []).map((p: string) => ({
          label:
            (permissionLabels as Record<string, string>)[p] ||
            "Funzione consentita",
          value: "Consentito",
        }))}
      />
    </SettingsSection>
  );
}
