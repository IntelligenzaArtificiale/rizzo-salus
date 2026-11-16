import { useState } from "react";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { SelectField } from "@/components/form/SelectField";
import { ClinicFileField } from "./ClinicFileField";
import { api, type Data } from "./api";
import { useAction } from "./common";
export function PurchaseImport({
  items,
  onSaved,
}: {
  items: Data[];
  onSaved: () => void;
}) {
  const [file, setFile] = useState<Data>({}),
    [draft, setDraft] = useState<Data | null>(null),
    [lines, setLines] = useState<Data[]>([]);
  const a = useAction();
  return (
    <Section title="Carico da fattura di acquisto">
      <ClinicFileField
        accept=".xml,.pdf"
        onChange={(f) => {
          setFile(f);
          setDraft(null);
        }}
      />
      <Button
        disabled={a.busy || !file.base64}
        onClick={() =>
          a.act(async () => {
            const r = await api("/importazione/acquisto-anteprima", file);
            setDraft(r);
            setLines(r.righe);
          })
        }
      >
        Leggi fattura e proponi articoli
      </Button>
      {draft && (
        <>
          <p className="text-sm text-ink-2">
            {draft.stato === "applicato"
              ? "Questo documento è già stato caricato."
              : "Controlla quantità e associazioni. Il magazzino cambia solo dopo l’approvazione."}
          </p>
          {draft.estratto && (
            <TextAreaField
              label="Testo estratto dalla fattura, da verificare"
              value={draft.estratto}
              onChange={() => {}}
              rows={10}
            />
          )}
          <p className="text-sm text-ink-2">
            Le righe dei documenti strutturati vengono riconosciute
            automaticamente. Per un PDF verifica il testo e inserisci le
            quantità delle righe da caricare.
          </p>
          {lines.map((l, i) => (
            <div key={i} className="rounded-card border border-line p-4">
              <p className="mb-2 text-sm text-ink">{l.descrizione}</p>
              <SelectField
                label="Articolo corrispondente"
                value={l.articolo_id ?? ""}
                onChange={(articolo_id) =>
                  setLines(
                    lines.map((x, j) => (j === i ? { ...x, articolo_id } : x)),
                  )
                }
                options={[
                  { value: "", label: "Associa articolo" },
                  ...items.map((x) => ({ value: x.id, label: x.nome })),
                ]}
              />
              <TextField
                label="Quantità da caricare"
                type="number"
                step="any"
                min={0.001}
                value={String(l.quantita)}
                onChange={(s) =>
                  setLines(
                    lines.map((x, j) =>
                      j === i ? { ...x, quantita: Number(s) } : x,
                    ),
                  )
                }
              />
              <Button
                variant="quiet"
                onClick={() => setLines(lines.filter((_, j) => j !== i))}
              >
                Escludi riga
              </Button>
            </div>
          ))}
          <Button
            onClick={() =>
              setLines([
                ...lines,
                {
                  articolo_id: "",
                  quantita: 1,
                  descrizione: "Riga inserita manualmente",
                },
              ])
            }
          >
            Aggiungi riga
          </Button>
          <Button
            variant="primary"
            disabled={
              a.busy ||
              draft.stato === "applicato" ||
              !lines.length ||
              lines.some((l) => !l.articolo_id || l.quantita <= 0)
            }
            onClick={() =>
              a.act(async () => {
                await api("/importazione/acquisto-applica", {
                  id: draft.id,
                  righe: lines,
                });
                setDraft({ ...draft, stato: "applicato" });
                onSaved();
              }, "Carico applicato una sola volta")
            }
          >
            Approva e carica magazzino
          </Button>
        </>
      )}
    </Section>
  );
}
