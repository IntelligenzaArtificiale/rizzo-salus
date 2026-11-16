import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { Checkbox } from "@/components/form/Checkbox";
import { DetailList } from "@/components/app/Section";
import { api, download, type Data } from "./api";
import { useLoad, LoadState, useAction, today, money, date } from "./common";
import { ClinicFileField } from "./ClinicFileField";
export function ExpensesPage() {
  const [from, setFrom] = useState(today().slice(0, 7) + "-01"),
    [to, setTo] = useState(today()),
    [v, setV] = useState<Data>({
      descrizione: "",
      date: today(),
      scadenza: "",
      categoria: "altro",
      importo: 0,
      pagata: false,
      data_pagamento: "",
      ricorrenza: "nessuna",
      fine_ricorrenza: "",
      nota: "",
    });
  const a = useAction();
  const load = useLoad(
    () => api("/gestione/spese", { da: from, a: to }),
    [from, to],
  );
  const d = load.data;
  return (
    <LoadState load={load}>
      <PageHeader
        title="Entrate e uscite"
        subtitle="Costi amministrativi, scadenze e previsione delle ricorrenze."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Dal" type="date" value={from} onChange={setFrom} />
        <TextField label="Al" type="date" value={to} onChange={setTo} />
      </div>
      {d && (
        <Section title="Risultato del periodo">
          <DetailList
            items={[
              ["Fatturato", d.fatturato_cents],
              ["Incassato", d.incassato_cents],
              ["Costi di competenza", d.costi_competenza_cents],
              ["Uscite pagate", d.uscite_pagate_cents],
              ["Margine di competenza", d.margine_competenza_cents],
              ["Saldo di cassa", d.saldo_cassa_cents],
              ["Ricorrenze previste aggiuntive", d.ricorrenze_previste_cents],
            ].map(([label, value]) => ({
              label: String(label),
              value: money(Number(value)),
            }))}
          />
          <p className="text-sm text-ink-2">
            Il margine comprende le spese registrate. Inserisci anche i compensi
            e gli stipendi per un risultato completo. Le ricorrenze sono una
            previsione, non pagamenti eseguiti.
          </p>
        </Section>
      )}
      <Section title="Spese registrate">
        <RowList
          rows={(d?.spese ?? []).map((e: Data) => ({
            key: e.id,
            title: e.descrizione,
            meta:
              date(e.date) +
              " · " +
              e.categoria +
              " · " +
              money(e.importo_cents),
            actions: (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setV({ ...e, importo: e.importo_cents / 100 })}
                >
                  Modifica
                </Button>
                {e.file && (
                  <Button
                    onClick={() =>
                      a.act(() =>
                        download("/gestione/allegato", {
                          tipo: "spesa",
                          id: e.id,
                        }),
                      )
                    }
                  >
                    Allegato
                  </Button>
                )}
              </div>
            ),
          }))}
        />
      </Section>
      <Section title={v.id ? "Modifica spesa" : "Registra spesa"}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            a.act(async () => {
              const body = { ...v };
              for (const k of ["scadenza", "data_pagamento", "fine_ricorrenza"])
                body[k] = body[k] || null;
              await api("/gestione/spesa", body);
              load.reload();
            }, "Spesa salvata");
          }}
        >
          <TextField
            label="Descrizione"
            value={v.descrizione}
            onChange={(descrizione) => setV({ ...v, descrizione })}
          />
          <SelectField
            label="Categoria"
            value={v.categoria}
            onChange={(categoria) => setV({ ...v, categoria })}
            options={[
              "fornitori",
              "materiali",
              "abbonamenti",
              "f24",
              "stipendi",
              "compensi",
              "utenze",
              "altro",
            ].map((t) => ({ value: t, label: t }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Data competenza"
              type="date"
              value={v.date}
              onChange={(date) => setV({ ...v, date })}
            />
            <TextField
              label="Scadenza"
              type="date"
              value={v.scadenza ?? ""}
              onChange={(scadenza) => setV({ ...v, scadenza })}
            />
            <TextField
              label="Importo in euro"
              type="number"
              step="0.01"
              min="0.01"
              value={String(v.importo)}
              onChange={(s) => setV({ ...v, importo: Number(s) })}
            />
            <TextField
              label="Data pagamento"
              type="date"
              value={v.data_pagamento ?? ""}
              onChange={(data_pagamento) => setV({ ...v, data_pagamento })}
            />
          </div>
          <Checkbox
            label="Spesa pagata"
            checked={v.pagata}
            onChange={(pagata) => setV({ ...v, pagata })}
          />
          <SelectField
            label="Ricorrenza per la previsione"
            value={v.ricorrenza}
            onChange={(ricorrenza) => setV({ ...v, ricorrenza })}
            options={["nessuna", "mensile", "trimestrale", "annuale"].map(
              (t) => ({ value: t, label: t }),
            )}
          />
          <TextField
            label="Fine ricorrenza"
            type="date"
            value={v.fine_ricorrenza ?? ""}
            onChange={(fine_ricorrenza) => setV({ ...v, fine_ricorrenza })}
          />
          <TextField
            label="Nota"
            value={v.nota ?? ""}
            onChange={(nota) => setV({ ...v, nota })}
          />
          <ClinicFileField
            accept=".pdf,.xml,.jpg,.png"
            onChange={(f) => setV({ ...v, ...f })}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={a.busy || !v.descrizione || v.importo <= 0}
          >
            Salva spesa
          </Button>
        </form>
      </Section>
    </LoadState>
  );
}
