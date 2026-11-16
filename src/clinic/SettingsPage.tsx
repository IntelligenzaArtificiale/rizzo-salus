// Configurazione originale con SettingsSection e SaveBar del boilerplate.
import { CalendarSettings } from "./CalendarSettings";
import { AutomationSettings } from "./AutomationSettings";
import { ParametricSettings, IntegrationCredentials } from "./AdvancedSettings";
import { CatalogSettings } from "./CatalogSettings";
import { DocumentTemplates } from "./DocumentTemplates";
import { useClinic } from "./ClinicContext";
import { useState } from "react";
import { email, cap, partitaIva, codiceFiscale } from "@/lib/validation";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/app/PageHeader";
import { PageTabs } from "@/components/app/PageTabs";
import { SettingsSection, SaveBar } from "@/components/app/SettingsSection";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";
import { api, type Data } from "./api";
import { LoadState, useLoad } from "./common";
import { RolesSettings, UsersSettings } from "./SettingsPeople";
const sections: Record<string, string> = {
  Struttura: "struttura",
  Ruoli: "ruoli",
  Utenti: "utenti",
  Orari: "orari",
  Calendar: "agenda",
  Messaggi: "messaggi",
  Fatturazione: "fatturazione",
  Assistente: "ai",
  Cataloghi: "cataloghi",
  Consensi: "consensi",
  Prenotazioni: "prenotazioni",
  Documenti: "documenti",
  Integrazioni: "integrazioni",
  Personale: "personale",
  Compensi: "compensi",
  Pianificazione: "pianificazione",
  Chiusure: "chiusure",
  Automazioni: "automazioni",
};
export function SettingsPage() {
  const { user } = useClinic();
  const [params, setParams] = useSearchParams(),
    tab = params.get("scheda") || "Struttura";
  const load = useLoad(() => api("/impostazioni/leggi"));
  return (
    <LoadState load={load} wide>
      <PageHeader title="Impostazioni" />
      <PageTabs
        label="Impostazioni"
        options={Object.keys(sections)}
        value={tab}
        onChange={(v) => setParams({ scheda: v })}
      />
      {load.data &&
        (tab === "Calendar" ? (
          <CalendarSettings
            key={load.data.revision}
            data={load.data}
            onSaved={load.reload}
          />
        ) : tab === "Ruoli" ? (
          <RolesSettings
            key={load.data.revision}
            data={load.data}
            onSaved={load.reload}
          />
        ) : tab === "Utenti" ? (
          <UsersSettings />
        ) : tab === "Automazioni" ? (
          <AutomationSettings />
        ) : tab === "Cataloghi" ? (
          <CatalogSettings />
        ) : tab === "Consensi" ? (
          <DocumentTemplates />
        ) : tab !== "Struttura" ? (
          <>
            <ParametricSettings
              key={tab + load.data.revision}
              data={load.data}
              section={sections[tab]}
              onSaved={load.reload}
            />
            {tab === "Integrazioni" && user?.role === "titolare" && (
              <IntegrationCredentials />
            )}
          </>
        ) : (
          <SettingsForm
            key={tab + load.data.revision}
            data={load.data}
            section={sections[tab] || "struttura"}
            onSaved={load.reload}
          />
        ))}
    </LoadState>
  );
}
function SettingsForm({
  data,
  section,
  onSaved,
}: {
  data: Data;
  section: string;
  onSaved: () => void;
}) {
  const f = useSettingsForm<Data>(
    data.valori[section],
    async (value) => {
      try {
        await api("/impostazioni/salva", {
          dati: { [section]: value },
          revision: data.revision,
        });
        onSaved();
        return true;
      } catch {
        return false;
      }
    },
    "Impostazioni salvate",
  );
  const [blurred, setBlurred] = useState<Record<string, boolean>>({});
  const validation = (key: string, value: unknown): string | null => {
    const v = String(value ?? "");
    if (!v)
      return key === "ragione_sociale" ? "Inserisci la ragione sociale." : null;
    if (["email", "pec", "commercialista_email"].includes(key)) return email(v);
    if (key === "cap") return cap(v);
    if (key === "partita_iva") return partitaIva(v);
    if (key === "codice_fiscale")
      return /^\d{11}$/.test(v) ? partitaIva(v) : codiceFiscale(v);
    if (key === "provincia")
      return /^[a-zA-Z]{2}$/.test(v) ? null : "Usa due lettere.";
    if (typeof data.valori[section][key] === "number")
      return Number.isFinite(Number(v)) && Number(v) >= 0
        ? null
        : "Inserisci un numero maggiore o uguale a zero.";
    return null;
  };
  const valid = Object.entries(f.value).every(
    ([k, v]) =>
      !(typeof data.valori[section][k] === "number" && v === "") &&
      validation(k, v) === null,
  );
  const text = (key: string, label: string, type = "text", suffix?: string) => (
    <TextField
      key={key}
      label={label}
      type={type}
      suffix={suffix}
      step={type === "number" ? "any" : undefined}
      error={
        blurred[key] && String(f.value[key] ?? "").trim()
          ? validation(key, f.value[key])
          : null
      }
      onBlur={() => setBlurred((v) => ({ ...v, [key]: true }))}
      value={String(f.value[key] ?? "")}
      onChange={(v) =>
        f.patch({
          [key]:
            typeof data.valori[section][key] === "number"
              ? v === ""
                ? ""
                : Number(v)
              : v,
        })
      }
    />
  );
  const choice = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <SelectField
      label={label}
      value={String(f.value[key])}
      options={options}
      onChange={(v) =>
        f.patch({
          [key]:
            typeof data.valori[section][key] === "boolean" ? v === "true" : v,
        })
      }
    />
  );
  const boolean = (key: string, label: string) =>
    choice(key, label, [
      { value: "true", label: "Sì" },
      { value: "false", label: "No" },
    ]);
  return (
    <form
      onSubmit={(e) => {
        if (!valid) e.preventDefault();
        else f.submit(e);
      }}
      className="flex flex-col"
    >
      {section === "struttura" && (
        <>
          <SettingsSection
            title="Identità della struttura"
            description="Intestazione e dati fiscali per i documenti."
          >
            {text("ragione_sociale", "Ragione sociale")}
            {text("partita_iva", "Partita IVA")}
            {text("codice_fiscale", "Codice fiscale")}
          </SettingsSection>
          <SettingsSection
            title="Sede"
            description="Indirizzo utilizzato nelle fatture."
          >
            {text("indirizzo", "Indirizzo")}
            {text("cap", "CAP")}
            {text("citta", "Città")}
            {text("provincia", "Provincia")}
          </SettingsSection>
          <SettingsSection
            title="Contatti"
            description="Recapiti e riferimenti della struttura."
          >
            {text("telefono", "Telefono", "tel")}
            {text("email", "Email", "email")}
            {text("pec", "PEC", "email")}
            {text("sito", "Sito web")}
            {text("link_recensione", "Link recensioni")}
          </SettingsSection>
        </>
      )}
      {section === "messaggi" && (
        <SettingsSection
          title="Comunicazioni"
          description="Canali, limiti e preferenze di invio."
        >
          {choice("modalita", "Modalità di invio", [
            { value: "test", label: "Prova" },
            { value: "live", label: "Attiva" },
          ])}
          {choice("canale_predefinito", "Canale predefinito", [
            { value: "whatsapp", label: "WhatsApp" },
            { value: "sms", label: "SMS" },
            { value: "email", label: "Email" },
          ])}
          {boolean(
            "fallback_sms",
            "Usa SMS se il canale principale non è disponibile",
          )}
          {text("tetto_mensile_eur", "Limite di spesa mensile", "number", "€")}
        </SettingsSection>
      )}
      {section === "fatturazione" && (
        <SettingsSection
          title="Fatturazione"
          description="Preferenze amministrative applicate alle nuove fatture."
        >
          {text("sezionale", "Sezionale")}
          {text("bollo_soglia", "Bollo oltre", "number", "€")}
          {text("bollo_importo", "Importo del bollo", "number", "€")}
          {choice("bollo_modalita", "Modalità assolvimento bollo", [
            {
              value: "da_configurare",
              label: "Da concordare con il commercialista",
            },
            { value: "cartaceo", label: "Contrassegno cartaceo" },
            {
              value: "virtuale_autorizzato",
              label: "Virtuale con autorizzazione",
            },
          ])}
          {text(
            "bollo_autorizzazione",
            "Riferimento autorizzazione bollo virtuale",
          )}
          {choice("bollo_a_carico", "Bollo a carico di", [
            { value: "paziente", label: "Paziente" },
            { value: "struttura", label: "Struttura" },
          ])}
          {text("natura_esenzione", "Natura esenzione")}
          {text("riferimento_normativo", "Riferimento normativo")}
          {text("commercialista_email", "Email commercialista", "email")}
          {boolean(
            "trasmissione_sdi",
            "Trasmissione al Sistema di Interscambio",
          )}
          {boolean("sts_attivo", "Sistema Tessera Sanitaria attivo")}
        </SettingsSection>
      )}
      {section === "ai" && (
        <SettingsSection
          title="Assistente"
          description="Limiti di utilizzo e pianificazione."
        >
          {boolean("attiva", "Assistente attivo")}
          {text("modello", "Modello")}
          {text("timeout_secondi", "Tempo massimo di risposta", "number", "s")}
          {text(
            "tetto_giornaliero_eur",
            "Limite di spesa giornaliero",
            "number",
            "€",
          )}
          {text("tempo_max_ms", "Tempo massimo pianificazione", "number", "ms")}
          {text("spostamenti_profondita", "Spostamenti a catena", "number")}
          {text(
            "costo_per_1k_token_eur",
            "Costo per mille unità di testo",
            "number",
            "€",
          )}
        </SettingsSection>
      )}
      <SaveBar
        dirty={f.dirty}
        busy={f.busy}
        disabled={!valid}
        onReset={f.reset}
      />
      {f.dialog}
    </form>
  );
}
