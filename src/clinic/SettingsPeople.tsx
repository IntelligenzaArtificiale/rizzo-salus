// Ruoli e utenti del dominio originale; nessuna mappatura ai ruoli mock del template.
import { useState } from "react";
import RecordsTable from "@/components/primitives/RecordsTable";
import { SettingsSection, SaveBar } from "@/components/app/SettingsSection";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { EmptyState, PageLoading, PageError } from "@/components/app/PageState";
import { DetailList } from "@/components/app/Section";
import { useSettingsForm } from "@/lib/forms/useSettingsForm";
import { api, type Data } from "./api";
import { useLoad, date } from "./common";
const roles = [
  "titolare",
  "segreteria",
  "medico",
  "fisioterapista",
  "amministrazione",
];
export function RolesSettings({
  data,
  onSaved,
}: {
  data: Data;
  onSaved: () => void;
}) {
  const [role, setRole] = useState("segreteria");
  const f = useSettingsForm<Data>(
    data.valori.ruoli,
    async (ruoli) => {
      try {
        await api("/impostazioni/salva", {
          dati: {
            ruoli: Object.fromEntries(
              Object.entries(ruoli).filter(([role]) => role !== "titolare"),
            ),
          },
          revision: data.revision,
        });
        onSaved();
        return true;
      } catch {
        return false;
      }
    },
    "Permessi salvati",
  );
  const groups: Record<string, [string, string][]> = {};
  Object.entries(data.catalogo_permessi).forEach(([k, v]) => {
    const [group, label] = v as string[];
    (groups[group] ??= []).push([k, label]);
  });
  return (
    <form onSubmit={f.submit}>
      <SettingsSection
        title="Ruoli e permessi"
        description="Il titolare mantiene tutti i permessi. Le modifiche valgono dal prossimo accesso."
      >
        <SelectField
          label="Ruolo"
          value={role}
          onChange={setRole}
          options={roles.map((r) => ({
            value: r,
            label: r.charAt(0).toUpperCase() + r.slice(1),
          }))}
        />
      </SettingsSection>
      {Object.entries(groups).map(([group, list]) => (
        <SettingsSection key={group} title={group}>
          {role === "titolare" ? (
            <DetailList
              items={list.map(([, label]) => ({ label, value: "Consentito" }))}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {list.map(([k, label]) => (
                <Checkbox
                  key={k}
                  label={label}
                  checked={(f.value[role] || []).includes(k)}
                  onChange={(v) =>
                    f.patch({
                      [role]: v
                        ? [...(f.value[role] || []), k]
                        : (f.value[role] || []).filter((p: string) => p !== k),
                    })
                  }
                />
              ))}
            </div>
          )}
        </SettingsSection>
      ))}
      <SaveBar dirty={f.dirty} busy={f.busy} onReset={f.reset} />
      {f.dialog}
    </form>
  );
}
export function UsersSettings() {
  const load = useLoad(() => api<Data[]>("/utenti/elenco"));
  if (load.loading) return <PageLoading />;
  if (load.error)
    return <PageError message={load.error} onRetry={load.reload} />;
  const rows = (load.data || []).map((u) => ({
    id: u.id,
    name: u.name || [u.nome, u.cognome].join(" "),
    tags: [u.role, u.attivo === false ? "Disattivo" : "Attivo"],
    last: date(u.ultimo_accesso),
    strength: (u.due_fattori ? "strong" : "none") as "strong" | "none",
    website: u.email,
  }));
  return (
    <div className="flex flex-col gap-6">
      {rows.length ? (
        <RecordsTable
          fill
          readOnly
          rows={rows}
          labels={{
            table: "Utenti del gestionale",
            company: "Nome",
            categories: "Ruolo e stato",
            last: "Ultimo accesso",
            strength: "Due passaggi",
            links: "Email",
            count: "utenti",
            selectAll: "Seleziona tutti",
            select: "Seleziona",
            noContact: "Non attivo",
          }}
          strengthLabels={{ strong: "Attivo", none: "Non attivo" }}
        />
      ) : (
        <EmptyState title="Nessun utente" />
      )}
    </div>
  );
}
