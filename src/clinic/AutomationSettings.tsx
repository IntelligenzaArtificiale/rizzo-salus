import { SettingsSection } from "@/components/app/SettingsSection";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { api, type Data } from "./api";
import { useLoad, useAction } from "./common";
export function AutomationSettings() {
  const load = useLoad(() => api("/attivita/elenco"));
  const a = useAction();
  const rows: Array<Data> = Array.isArray(load.data) ? load.data : [];
  return (
    <SettingsSection
      title="Attività automatiche"
      description="Orari e attivazione vengono dalle rispettive impostazioni. Il server deve eseguire l’attivatore periodico: lo stato qui mostra le esecuzioni registrate, senza simulare un servizio in funzione."
    >
      {load.error && (
        <p role="alert" className="text-red">
          {load.error}
        </p>
      )}
      <RowList
        rows={rows.map((r: Data) => ({
          key: r.id,
          title: r.nome,
          meta: r.descrizione,
          actions: (
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={r.attivo ? "green" : "neutral"}>
                {r.attivo ? "Attiva" : "Disattivata"}
              </StatusPill>
              <Button
                disabled={a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/attivita/esegui", { id: r.id });
                    load.reload();
                  }, "Attività eseguita: verifica il risultato")
                }
              >
                Esegui ora
              </Button>
              {!r.essenziale && (
                <Button
                  disabled={a.busy}
                  onClick={() =>
                    a.act(async () => {
                      await api("/attivita/attiva", {
                        id: r.id,
                        attivo: !r.attivo,
                      });
                      load.reload();
                    })
                  }
                >
                  {r.attivo ? "Disattiva" : "Attiva"}
                </Button>
              )}
            </div>
          ),
        }))}
      />
    </SettingsSection>
  );
}
