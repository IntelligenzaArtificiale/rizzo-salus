import { PurchaseImport } from "./PurchaseImport";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { SelectField } from "@/components/form/SelectField";
import { ParameterFields } from "./ParameterFields";
import { useClinic } from "./ClinicContext";
import { api, type Data } from "./api";
import { useLoad, LoadState, useAction, today, date } from "./common";
export function StockPage() {
  const { can } = useClinic();
  const load = useLoad(() => api("/gestione/stock"));
  const a = useAction();
  const [item, setItem] = useState<Data>({
      nome: "",
      codice: "",
      unita: "pezzi",
      soglia_minima: 0,
      costo: 0,
      fornitore_id: "",
      attivo: true,
    }),
    [supplier, setSupplier] = useState<Data>({
      nome: "",
      partita_iva: "",
      email: "",
      telefono: "",
    }),
    [move, setMove] = useState<Data>({
      articolo_id: "",
      quantita: -1,
      motivo: "",
      date: today(),
      chiave: crypto.randomUUID(),
    });
  return (
    <LoadState load={load}>
      <PageHeader
        title="Magazzino"
        subtitle="Giacenze, soglie e consumi per prestazione."
      />
      <Section title="Articoli e scorte">
        <RowList
          rows={(load.data?.articoli ?? []).map((i: Data) => ({
            key: i.id,
            title: i.nome,
            meta: i.giacenza + " " + i.unita + " · soglia " + i.soglia_minima,
            actions: (
              <div className="flex items-center gap-2">
                <StatusPill tone={i.sotto_soglia ? "orange" : "green"}>
                  {i.sotto_soglia ? "Da riordinare" : "Disponibile"}
                </StatusPill>
                {can("magazzino.gestisci") && (
                  <Button
                    onClick={() =>
                      setItem({ ...i, costo: i.costo_cents / 100 })
                    }
                  >
                    Modifica
                  </Button>
                )}
              </div>
            ),
          }))}
        />
      </Section>
      <Section title="Registra carico o consumo">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            a.act(async () => {
              await api("/gestione/movimento", move);
              setMove({ ...move, chiave: crypto.randomUUID(), motivo: "" });
              load.reload();
            }, "Movimento registrato");
          }}
        >
          <SelectField
            label="Articolo"
            value={move.articolo_id}
            onChange={(articolo_id) => setMove({ ...move, articolo_id })}
            options={[
              { value: "", label: "Scegli articolo" },
              ...(load.data?.articoli ?? []).map((i: Data) => ({
                value: i.id,
                label: i.nome,
              })),
            ]}
          />
          <ParameterFields
            value={move}
            onChange={setMove}
            hidden={["articolo_id", "chiave"]}
          />
          <p className="mb-3 text-sm text-ink-2">
            Quantità positiva per il carico, negativa per lo scarico. I consumi
            configurati per terapia vengono registrati quando la seduta è
            eseguita.
          </p>
          <Button
            type="submit"
            variant="primary"
            disabled={a.busy || !move.articolo_id || !move.motivo}
          >
            Registra movimento
          </Button>
        </form>
      </Section>
      {can("magazzino.gestisci") && (
        <>
          <Section title={item.id ? "Modifica articolo" : "Nuovo articolo"}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                a.act(async () => {
                  await api("/gestione/articolo", {
                    ...item,
                    fornitore_id: item.fornitore_id || null,
                  });
                  load.reload();
                }, "Articolo salvato");
              }}
            >
              <ParameterFields
                value={item}
                onChange={setItem}
                hidden={[
                  "id",
                  "revision",
                  "fornitore_id",
                  "costo_cents",
                  "giacenza",
                  "sotto_soglia",
                  "created_at",
                  "updated_at",
                  "created_by",
                  "updated_by",
                  "deleted_at",
                ]}
              />
              <SelectField
                label="Fornitore"
                value={item.fornitore_id ?? ""}
                onChange={(fornitore_id) => setItem({ ...item, fornitore_id })}
                options={[
                  { value: "", label: "Non indicato" },
                  ...(load.data?.fornitori ?? []).map((s: Data) => ({
                    value: s.id,
                    label: s.nome,
                  })),
                ]}
              />
              <Button type="submit" disabled={a.busy || !item.nome}>
                Salva articolo
              </Button>
            </form>
          </Section>
          <Section title="Nuovo fornitore">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                a.act(async () => {
                  await api("/gestione/fornitore", supplier);
                  load.reload();
                }, "Fornitore salvato");
              }}
            >
              <ParameterFields value={supplier} onChange={setSupplier} />
              <Button type="submit" disabled={a.busy || !supplier.nome}>
                Salva fornitore
              </Button>
            </form>
          </Section>
        </>
      )}
      {can("magazzino.gestisci") && (
        <PurchaseImport
          items={load.data?.articoli ?? []}
          onSaved={load.reload}
        />
      )}
      <Section title="Movimenti recenti">
        <RowList
          rows={(load.data?.movimenti ?? []).map((m: Data) => ({
            key: m.id,
            title:
              (load.data?.articoli.find((i: Data) => i.id === m.articolo_id)
                ?.nome ?? "Articolo") +
              " · " +
              m.quantita,
            meta: date(m.date) + " · " + m.motivo,
          }))}
        />
      </Section>
    </LoadState>
  );
}
