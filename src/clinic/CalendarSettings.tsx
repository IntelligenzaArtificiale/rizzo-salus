import { useState } from "react";
import { SettingsSection } from "@/components/app/SettingsSection";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/form/Checkbox";
import { ParametricSettings } from "./AdvancedSettings";
import { useClinic } from "./ClinicContext";
import { api, type Data } from "./api";
import { useAction } from "./common";
export function CalendarSettings({
  data,
  onSaved,
}: {
  data: Data;
  onSaved: () => void;
}) {
  const a = useAction(),
    { catalog, refresh } = useClinic();
  const [ids, setIds] = useState<string[]>(
    data.valori.agenda.professionisti_riabilitazione || [],
  );
  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Specifiche Calendar del 10 novembre"
        description="Applica una sola volta orari, durate, risorse e capienze del documento. Non modifica gli appuntamenti esistenti né sostituisce le tariffe già inserite."
      >
        <p className="text-sm text-ink-2">
          Chiara non viene pianificata finché non si inseriscono i suoi giorni.
          Il venerdì di Antonio resta chiuso. La pompa non assistita resta
          disattivata in attesa di conferma.
        </p>
        <Button
          disabled={
            a.busy || data.valori.agenda.profilo_specifiche === "2026-11-10"
          }
          onClick={() =>
            a.act(async () => {
              await api("/impostazioni/profilo-calendar");
              await refresh();
              onSaved();
            }, "Profilo Calendar applicato")
          }
        >
          {data.valori.agenda.profilo_specifiche === "2026-11-10"
            ? "Profilo applicato"
            : "Applica le specifiche confermate"}
        </Button>
      </SettingsSection>
      <SettingsSection
        title="Professionisti della riabilitazione"
        description="Il pianificatore usa le persone selezionate. Senza selezione usa i professionisti compatibili attivi del catalogo."
      >
        {catalog.professionisti
          .filter((p: Data) => p.tipo === "fisioterapista" || p.titolare)
          .map((p: Data) => (
            <Checkbox
              key={p.id}
              label={(p.nome + " " + p.cognome).trim()}
              checked={ids.includes(p.id)}
              onChange={(v) =>
                setIds(v ? [...ids, p.id] : ids.filter((id) => id !== p.id))
              }
            />
          ))}
        <Button
          disabled={a.busy}
          onClick={() =>
            a.act(async () => {
              await api("/impostazioni/salva", {
                dati: { agenda: { professionisti_riabilitazione: ids } },
                revision: data.revision,
              });
              onSaved();
            }, "Professionisti aggiornati")
          }
        >
          Salva professionisti della riabilitazione
        </Button>
      </SettingsSection>
      <ParametricSettings
        key={data.revision}
        data={{ ...data, valori: { ...data.valori, agenda: { gruppi: data.valori.agenda.gruppi, colori: data.valori.agenda.colori } } }}
        section="agenda"
        onSaved={onSaved}
      />
    </div>
  );
}
