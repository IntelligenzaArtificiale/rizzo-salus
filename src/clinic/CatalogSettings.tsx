import { CollapsiblePanel } from "@/components/app/CollapsiblePanel";
import { TherapyConsumption } from "./TherapyConsumption";
import { TextField } from "@/components/form/TextField";
import { TherapyResources } from "./TherapyResources";
import { useState } from "react";
import { SettingsSection } from "@/components/app/SettingsSection";
import { SelectField } from "@/components/form/SelectField";
import { Button } from "@/components/atoms/Button";
import { ParameterFields, HoursFields } from "./ParameterFields";
import { api, type Data } from "./api";
import { useClinic } from "./ClinicContext";
import { useAction, name } from "./common";
const defaults: Record<string, Data> = {
  terapie: {
    nome: "",
    categoria: "strumentale",
    famiglia: "TS",
    durata_min: 15,
    di_gruppo: false,
    capienza: 1,
    tariffa: 0,
    sanitaria: true,
    codice_sts: "",
    natura_iva: "N4",
    aliquota_iva: 0,
    followup_giorni: 15,
    prenotabile_online: false,
    consumi_standard: [],
    impegna_operatore: true,
    durata_operatore_minuti: 0,
    risorse_aggiuntive: [],
    attivo: true,
  },
  professionisti: {
    email: "",
    telefono: "",
    nome: "",
    cognome: "",
    tipo: "fisioterapista",
    specialita: [],
    colore: "#2563EB",
    orari: null,
    eccezioni: [],
    ore_contrattuali_settimana: 0,
    percentuale_compenso: 70,
    percentuali_tipo: {},
    preferenze_assegnazione: [],
    prenotabile_online: false,
    titolare: false,
    attivo: true,
  },
  risorse: {
    nome: "",
    tipo: "sala",
    capienza: 1,
    orari: null,
    fermi: [],
    attivo: true,
  },
};
export function CatalogSettings() {
  const { catalog, refresh } = useClinic();
  const [kind, setKind] = useState("terapie"),
    [selected, setSelected] = useState(""),
    [v, setV] = useState<Data>(structuredClone(defaults.terapie));
  const a = useAction();
  const select = (k: string, id: string) => {
    setKind(k);
    setSelected(id);
    setV(
      structuredClone(
        id
          ? {
              ...defaults[k],
              ...(catalog[k] ?? []).find((r: Data) => r.id === id),
            }
          : defaults[k],
      ),
    );
  };
  const endpoint = (
    {
      terapie: "terapia",
      professionisti: "professionista",
      risorse: "risorsa",
    } as Data
  )[kind];
  return (
    <SettingsSection
      title="Listini, professionisti e risorse"
      description="Inserisci le prestazioni reali, le durate, le tariffe, i compensi e gli orari. Le terapie restano escluse dalla prenotazione pubblica."
    >
      <SelectField
        label="Catalogo"
        value={kind}
        onChange={(k) => select(k, "")}
        options={[
          { value: "terapie", label: "Prestazioni e listino" },
          { value: "professionisti", label: "Professionisti e orari" },
          { value: "risorse", label: "Sale e apparecchiature" },
        ]}
      />
      <SelectField
        label="Voce da modificare"
        value={selected}
        onChange={(id) => select(kind, id)}
        options={[
          { value: "", label: "Aggiungi nuova voce" },
          ...(catalog[kind] ?? []).map((r: Data) => ({
            value: r.id,
            label: kind === "professionisti" ? name(r) : r.nome,
          })),
        ]}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          a.act(async () => {
            const r = await api("/catalogo/" + endpoint + "/salva", v);
            await refresh();
            setSelected(r.id);
            setV(r);
          }, "Catalogo aggiornato");
        }}
        className="flex flex-col gap-4"
      >
        {kind !== "terapie" && (
          <SelectField
            label="Tipo"
            value={v.tipo ?? ""}
            onChange={(tipo) => setV({ ...v, tipo })}
            options={(kind === "professionisti"
              ? [
                  "medico",
                  "fisioterapista",
                  "segreteria",
                  "amministrazione",
                  "collaboratore",
                ]
              : kind === "risorse"
                ? ["sala", "apparecchio", "piscina", "palestra"]
                : []
            ).map((t) => ({ value: t, label: t }))}
          />
        )}
        <ParameterFields
          value={v}
          onChange={setV}
          hidden={[
            "id",
            "revision",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
            "tipo",
            "orari",
            "risorsa_id",
            "percentuali_tipo",
            "consumi_standard",
            "risorse_aggiuntive",
            "tariffa_da_confermare",
          ]}
        />
        {kind === "terapie" && (
          <TherapyResources value={v} onChange={setV} catalog={catalog} />
        )}
        {kind === "terapie" && (
          <SelectField
            label="Risorsa"
            value={v.risorsa_id ?? ""}
            onChange={(risorsa_id) =>
              setV({ ...v, risorsa_id: risorsa_id || null })
            }
            options={[
              { value: "", label: "Nessuna" },
              ...catalog.risorse.map((r: Data) => ({
                value: r.id,
                label: r.nome,
              })),
            ]}
          />
        )}
        {kind === "professionisti" && (
          <CollapsiblePanel title={<> Percentuali per singola prestazione </>}>
            {catalog.terapie.map((t: Data) => (
              <TextField
                key={t.id}
                label={t.nome + " (%)"}
                type="number"
                min={0}
                max={100}
                value={String(
                  v.percentuali_tipo?.[t.id] ?? v.percentuale_compenso,
                )}
                onChange={(s) =>
                  setV({
                    ...v,
                    percentuali_tipo: {
                      ...v.percentuali_tipo,
                      [t.id]: Number(s),
                    },
                  })
                }
              />
            ))}
          </CollapsiblePanel>
        )}
        {kind === "terapie" && (
          <TherapyConsumption
            value={v.consumi_standard ?? []}
            onChange={(consumi_standard) => setV({ ...v, consumi_standard })}
          />
        )}
        {kind !== "terapie" && (
          <>
            <p className="text-[13px] text-ink-2">
              {v.orari === null
                ? "Utilizza gli orari della struttura."
                : "Orari dedicati."}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setV({
                  ...v,
                  orari:
                    v.orari === null
                      ? {
                          "1": [],
                          "2": [],
                          "3": [],
                          "4": [],
                          "5": [],
                          "6": [],
                          "7": [],
                        }
                      : null,
                })
              }
            >
              {v.orari === null
                ? "Imposta orari dedicati"
                : "Usa orari della struttura"}
            </Button>
            {v.orari !== null && (
              <HoursFields
                value={v.orari}
                onChange={(orari) => setV({ ...v, orari })}
              />
            )}
          </>
        )}
        <Button type="submit" disabled={a.busy}>
          Salva voce
        </Button>
      </form>
    </SettingsSection>
  );
}
