import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { ClinicFileField } from "./ClinicFileField";
import { api, type Data } from "./api";
import { useAction } from "./common";
import { Page } from "@/layouts/AppLayout";
export function ImportPage() {
  const [type, setType] = useState("pazienti"),
    [file, setFile] = useState<Data>({}),
    [table, setTable] = useState<Data | null>(null),
    [map, setMap] = useState<Data>({}),
    [validated, setValidated] = useState<Data | null>(null),
    [chosen, setChosen] = useState<number[]>([]);
  const a = useAction();
  const fields =
    type === "pazienti"
      ? {
          nome: "Nome *",
          cognome: "Cognome *",
          codice_fiscale: "Codice fiscale",
          data_nascita: "Data di nascita",
          telefono: "Telefono",
          email: "Email",
          indirizzo: "Indirizzo",
          cap: "CAP",
          citta: "Città",
          provincia: "Provincia",
          medico_curante: "Medico curante",
        }
      : {
          numero: "Numero documento *",
          date: "Data documento *",
          codice_fiscale: "Codice fiscale paziente già presente *",
          totale: "Totale in euro *",
          data_pagamento: "Data pagamento (facoltativa)",
          descrizione: "Descrizione",
        };
  return (
    <Page>
      <PageHeader
        title="Importa dati storici"
        subtitle="Porta qui i tuoi archivi e controlla l’anteprima prima di importarli."
      />
      <Section title="Sorgente">
        <SelectField
          label="Dati da importare"
          value={type}
          onChange={(t) => {
            setType(t);
            setTable(null);
            setValidated(null);
            setMap({});
          }}
          options={[
            { value: "pazienti", label: "Anagrafiche pazienti" },
            { value: "fatture_storiche", label: "Archivio fatture storiche" },
          ]}
        />
        <ClinicFileField
          accept=".csv,.xlsx"
          onChange={(f) => {
            setFile(f);
            setTable(null);
            setValidated(null);
          }}
        />
        <Button
          disabled={!file.base64 || a.busy}
          onClick={() =>
            a.act(async () =>
              setTable(await api("/importazione/anteprima", file)),
            )
          }
        >
          Leggi anteprima
        </Button>

      </Section>
      {table && (
        <Section title="Associa le colonne">
          <p className="text-sm text-ink-2">
            {table.righe.length} righe lette. Associa ogni campo alla colonna
            corrispondente.
          </p>
          {Object.entries(fields).map(([k, label]) => (
            <SelectField
              key={k}
              label={String(label)}
              value={map[k] ?? ""}
              onChange={(v) => {
                setMap({ ...map, [k]: v });
                setValidated(null);
              }}
              options={[
                { value: "", label: "Non importare" },
                ...table.colonne.map((s: string) => ({ value: s, label: s })),
              ]}
            />
          ))}
          <Button
            disabled={a.busy}
            onClick={() =>
              a.act(async () => {
                const r = await api("/importazione/valida", {
                  ...file,
                  tipo: type,
                  mappa: map,
                });
                setValidated(r);
                setChosen(
                  r.righe
                    .filter((l: Data) => !l.errore && !l.duplicati.length)
                    .map((l: Data) => l.riga),
                );
              })
            }
          >
            Valida dati e cerca duplicati
          </Button>
        </Section>
      )}
      {validated && (
        <Section title="Controlla e approva">
          <RowList
            rows={validated.righe.map((r: Data) => ({
              key: String(r.riga),
              title:
                "Riga " +
                r.riga +
                " · " +
                (r.dati?.nome ?? r.dati?.numero_testo ?? ""),
              meta: r.errore
                ? "Dati non validi: " + r.errore.replaceAll("_", " ")
                : r.duplicati.length
                  ? "Corrispondenza già presente: riga esclusa"
                  : "Pronta per l’importazione",
              actions: (
                <div className="flex gap-2">
                  <StatusPill
                    tone={r.errore || r.duplicati.length ? "orange" : "green"}
                  >
                    {r.errore || r.duplicati.length
                      ? "Da correggere"
                      : "Valida"}
                  </StatusPill>
                  {!r.errore && !r.duplicati.length && (
                    <Checkbox
                      label={"Importa riga " + r.riga}
                      checked={chosen.includes(r.riga)}
                      onChange={(v) =>
                        setChosen(
                          v
                            ? [...chosen, r.riga]
                            : chosen.filter((i) => i !== r.riga),
                        )
                      }
                    />
                  )}
                </div>
              ),
            }))}
          />
          <Button
            variant="primary"
            disabled={
              a.busy || !chosen.length || validated.stato === "applicato"
            }
            onClick={() =>
              a.act(async () => {
                await api("/importazione/applica", {
                  id: validated.id,
                  righe: chosen,
                });
                setValidated({ ...validated, stato: "applicato" });
              }, "Importazione completata")
            }
          >
            Importa le {chosen.length} righe selezionate
          </Button>
        </Section>
      )}
    </Page>
  );
}
