import { IntegrationStatus } from "./IntegrationStatus";
import { useState } from "react";
import { SettingsSection, SaveBar } from "@/components/app/SettingsSection";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { StatusPill } from "@/components/atoms/StatusPill";
import { api, type Data } from "./api";
import { useAction, useLoad } from "./common";
import { ParameterFields, HoursFields } from "./ParameterFields";
export function ParametricSettings({
  data,
  section,
  onSaved,
}: {
  data: Data;
  section: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<Data>(
    structuredClone(data.valori[section] ?? {}),
  );
  const a = useAction();
  const dirty = JSON.stringify(value) !== JSON.stringify(data.valori[section]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        a.act(async () => {
          await api("/impostazioni/salva", {
            dati: { [section]: value },
            revision: data.revision,
          });
          onSaved();
        }, "Impostazioni salvate");
      }}
    >
      <SettingsSection
        title={
          section === "orari" ? "Orari di apertura" : "Parametri operativi"
        }
        description="Le modifiche valgono per le nuove operazioni. Controlla i dati prima di salvare."
      >
        {section === "orari" ? (
          <HoursFields value={value} onChange={setValue} />
        ) : (
          <ParameterFields
            value={Array.isArray(value) ? { [section]: value } : value}
            onChange={(next) =>
              setValue(Array.isArray(value) ? next[section] : next)
            }
            prefix={section}
            hidden={[
              "frame_ancestors",
              "profilo_specifiche",
              "professionisti_riabilitazione",
              "preparazione_conta",
              "preparazione_minuti",
            ]}
          />
        )}
      </SettingsSection>
      <SaveBar
        dirty={dirty}
        busy={a.busy}
        onReset={() => setValue(structuredClone(data.valori[section]))}
      />
    </form>
  );
}
const secretLabels: Record<string, string> = {
  composio_api_key: "Chiave del servizio messaggi",
  openai_api_key: "Chiave assistente",
  aruba_password: "Password Aruba",
  sts_password: "Password Sistema TS",
  sts_pin: "PIN Sistema TS",
};
export function IntegrationCredentials() {
  const load = useLoad(() => api("/impostazioni/segreti-stato"));
  const [input, setInput] = useState<Data>({});
  const a = useAction();
  return (
    <>
      <IntegrationStatus />
      <SettingsSection
        title="Credenziali riservate"
        description="Le credenziali sono cifrate e non vengono mostrate dopo il salvataggio. Inseriscile per aggiungerle o sostituirle. Aruba e Sistema TS richiedono anche la verifica del collegamento prima dell’attivazione."
      >
        {load.error ? (
          <p role="alert" className="text-red">
            {load.error}
          </p>
        ) : (
          Object.entries(secretLabels).map(([k, label]) => (
            <div key={k}>
              <div className="mb-2">
                <StatusPill tone={load.data?.[k] ? "green" : "neutral"}>
                  {load.data?.[k] ? "Credenziale presente" : "Da configurare"}
                </StatusPill>
              </div>
              <TextField
                type="password"
                autoComplete="new-password"
                label={label}
                value={input[k] ?? ""}
                onChange={(v) => setInput({ ...input, [k]: v })}
              />
              {load.data?.[k] && (
                <Button
                  variant="quiet"
                  type="button"
                  onClick={() =>
                    a.act(async () => {
                      await api("/impostazioni/segreti-salva", {
                        dati: { [k]: "__RIMUOVI__" },
                      });
                      load.reload();
                    }, "Credenziale rimossa")
                  }
                >
                  Rimuovi credenziale
                </Button>
              )}
            </div>
          ))
        )}
        <Button
          type="button"
          disabled={a.busy || !Object.values(input).some(Boolean)}
          onClick={() =>
            a.act(async () => {
              await api("/impostazioni/segreti-salva", { dati: input });
              setInput({});
              load.reload();
            }, "Credenziali salvate")
          }
        >
          Salva credenziali
        </Button>
      </SettingsSection>
    </>
  );
}
