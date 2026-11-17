import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PageTabs } from "@/components/app/PageTabs";
import { PurchaseImport } from "./PurchaseImport";
import { useEffect, useState } from "react";
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
  const navigate = useNavigate(), { pathname } = useLocation(), [params] = useSearchParams();
  const mode = pathname.split("/")[2] || "articoli", editId = params.get("id");
  const listing = ["articoli", "fornitori", "movimenti"].includes(mode);

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
  useEffect(() => {
    if (!load.data) return;
    if (mode === "articolo") { const row = load.data.articoli.find((r: Data) => r.id === editId); setItem(row ? { ...row, costo: row.costo_cents / 100 } : { nome: "", codice: "", unita: "pezzi", soglia_minima: 0, costo: 0, fornitore_id: "", attivo: true }); }
    if (mode === "fornitore") setSupplier(load.data.fornitori.find((r: Data) => r.id === editId) || { nome: "", partita_iva: "", email: "", telefono: "" });
  }, [mode, editId, load.data]);
  useEffect(() => { if (mode === "movimento") setMove({ articolo_id: "", quantita: -1, motivo: "", date: today(), chiave: crypto.randomUUID() }); }, [mode]);
  return (
    <LoadState load={load}>
      <PageHeader
        title={mode === "articolo" ? (editId ? "Modifica articolo" : "Nuovo articolo") : mode === "fornitore" ? (editId ? "Modifica fornitore" : "Nuovo fornitore") : mode === "movimento" ? "Registra movimento" : mode === "acquisti" ? "Importa acquisto" : "Magazzino"}
        back={!listing ? { to: "/magazzino", label: "Magazzino" } : undefined}
        actions={listing ? <div className="flex flex-wrap gap-2">{can("magazzino.gestisci") && <><Button onClick={() => navigate("/magazzino/articolo")}>Nuovo articolo</Button><Button onClick={() => navigate("/magazzino/fornitore")}>Nuovo fornitore</Button><Button onClick={() => navigate("/magazzino/acquisti")}>Importa acquisto</Button></>}<Button onClick={() => navigate("/magazzino/movimento")}>Registra movimento</Button></div> : undefined}
        subtitle="Giacenze, soglie e consumi per prestazione."
      />
      {listing && <PageTabs options={["Articoli", "Fornitori", "Movimenti"]} value={mode === "fornitori" ? "Fornitori" : mode === "movimenti" ? "Movimenti" : "Articoli"} onChange={v => navigate(v === "Articoli" ? "/magazzino" : "/magazzino/" + v.toLowerCase())} />}
      {mode === "fornitori" && <Section title="Fornitori"><RowList rows={(load.data?.fornitori || []).map((f: Data) => ({ key: f.id, title: f.nome, meta: [f.email, f.telefono].filter(Boolean).join(" · "), actions: can("magazzino.gestisci") ? <Button onClick={() => navigate("/magazzino/fornitore?id=" + f.id)}>Modifica</Button> : undefined }))} /></Section>}
      {mode === "articoli" && <Section title="Articoli e scorte">
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
                      navigate("/magazzino/articolo?id=" + i.id)
                    }
                  >
                    Modifica
                  </Button>
                )}
              </div>
            ),
          }))}
        />
      </Section>}
      {mode === "movimento" && <Section title="Registra carico o consumo">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            a.act(async () => {
              await api("/gestione/movimento", move);
              setMove({ ...move, chiave: crypto.randomUUID(), motivo: "" });
              load.reload(); navigate("/magazzino");
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
      </Section>}
      {can("magazzino.gestisci") && (
        <>
          {mode === "articolo" && <Section title={item.id ? "Modifica articolo" : "Nuovo articolo"}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                a.act(async () => {
                  await api("/gestione/articolo", {
                    ...item,
                    fornitore_id: item.fornitore_id || null,
                  });
                  load.reload(); navigate("/magazzino");
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
              <Button type="submit" disabled={a.busy || !item.nome || !!editId && !item.id}>
                Salva articolo
              </Button>
            </form>
          </Section>}
          {mode === "fornitore" && <Section title={editId ? "Modifica fornitore" : "Nuovo fornitore"}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                a.act(async () => {
                  await api("/gestione/fornitore", supplier);
                  load.reload(); navigate("/magazzino");
                }, "Fornitore salvato");
              }}
            >
              <ParameterFields value={supplier} onChange={setSupplier} hidden={["id", "revision", "created_at", "updated_at", "created_by", "updated_by", "deleted_at"]} />
              <Button type="submit" disabled={a.busy || !supplier.nome || !!editId && !supplier.id}>
                Salva fornitore
              </Button>
            </form>
          </Section>}
        </>
      )}
      {can("magazzino.gestisci") && mode === "acquisti" && (
        <PurchaseImport
          items={load.data?.articoli ?? []}
          onSaved={load.reload}
        />
      )}
      {mode === "movimenti" && <Section title="Movimenti recenti">
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
      </Section>}
    </LoadState>
  );
}
