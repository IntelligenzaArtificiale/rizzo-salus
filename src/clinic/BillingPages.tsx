import { InvoiceFiscalActions } from "./InvoiceFiscalActions";
// Fatture, download e transizioni: nessuna regola fiscale duplicata nel frontend.
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Download, FileSpreadsheet, Archive } from "lucide-react";
import FilterTable, {
  type TableRow,
} from "@/components/primitives/FilterTable";
import { PageHeader } from "@/components/app/PageHeader";
import { PrimaryAction, IconButton } from "@/components/app/IconButton";
import { TableToolbar, matches } from "@/components/app/TableToolbar";
import { StatTile } from "@/components/charts/StatTile";
import { Section, DetailList } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { SelectField } from "@/components/form/SelectField";
import { TextField } from "@/components/form/TextField";
import { EmptyState } from "@/components/app/PageState";
import { useClinic } from "./ClinicContext";
import { api, download, type Data } from "./api";
import {
  LoadState,
  useLoad,
  useAction,
  today,
  date,
  money,
  name,
  StatePill,
} from "./common";
export function BillingPage() {
  const { can } = useClinic();
  const canSearch =
    can("pazienti.anagrafica") ||
    can("pazienti.essenziali") ||
    can("pazienti.tutti");
  const canStats =
    can("statistiche.economiche") || can("statistiche.economiche_proprie");
  const [q, setQ] = useState(""),
    a = useAction(),
    navigate = useNavigate();
  const t = today(),
    from = t.slice(0, 8) + "01";
  const load = useLoad(async () => {
    const [invoices, patients, stats] = await Promise.all([
      api("/fatture/elenco"),
      canSearch
        ? api("/pazienti/cerca", { q: "", limite: 50 })
        : Promise.resolve({ risultati: [] }),
      canStats
        ? api("/statistiche/economiche", { da: from, a: t })
        : Promise.resolve(null),
    ]);
    return { invoices, patients, stats };
  });
  const d = load.data;
  const rows: TableRow[] = (d?.invoices.fatture || [])
    .map((f: Data) => {
      const p = d?.patients.risultati.find((p: Data) => p.id === f.patient_id);
      return {
        id: f.id,
        task: `${f.numero_testo || "Bozza"} · ${p ? name(p) : "Paziente"}`,
        date: date(f.date),
        owner: money(f.totale_cents),
        status:
          f.stato === "pagata"
            ? "done"
            : f.stato === "bozza"
              ? "todo"
              : "progress",
      };
    })
    .filter((r: TableRow) => matches(q, r.task));
  return (
    <LoadState load={load} wide>
      <PageHeader
        title="Fatturazione"
        subtitle="Fatture, incassi e documenti per la commercialista."
        actions={
          canSearch ? (
            <PrimaryAction
              label="Nuova fattura"
              icon={<Plus size={16} />}
              to="/fatture/nuova"
            />
          ) : undefined
        }
      />
      {d && (
        <>
          <div
            className={
              d.stats ? "grid grid-cols-2 gap-3 lg:grid-cols-4" : "max-w-xs"
            }
          >
            {d.stats && (
              <>
                <StatTile
                  label="Fatturato del mese"
                  value={money(d.stats.periodo.fatturato_cents)}
                />
                <StatTile
                  label="Incassato"
                  value={money(d.stats.periodo.incassato_cents)}
                />
                <StatTile
                  label="Prestazioni eseguite"
                  value={String(d.stats.periodo.prestazioni)}
                />
              </>
            )}
            <StatTile
              label="Fatture emesse"
              value={String(
                d.invoices.fatture.filter((f: Data) => f.stato !== "bozza")
                  .length,
              )}
            />
          </div>
          <TableToolbar
            query={q}
            onQuery={setQ}
            placeholder="Cerca numero o paziente"
            actions={
              <>
                <IconButton
                  label="Archivio del mese per la commercialista"
                  icon={<Archive size={16} />}
                  onClick={() =>
                    a.act(() =>
                      download("/fatture/archivio", { da: from, a: t }),
                    )
                  }
                />
                <IconButton
                  label="Esporta Sistema TS del mese"
                  icon={<FileSpreadsheet size={16} />}
                  onClick={() =>
                    a.act(() =>
                      download("/fatture/sts-csv", { da: from, a: t }),
                    )
                  }
                />
              </>
            }
          />
          {rows.length ? (
            <FilterTable
              fill
              pageSize={20}
              rows={rows}
              labels={{
                columns: {
                  task: "Fattura · Paziente",
                  date: "Data",
                  status: "Stato",
                  owner: "Totale",
                },
                all: "Tutte",
                statuses: {
                  todo: "Bozze",
                  progress: "Emesse e stornate",
                  done: "Pagate",
                },
                tableLabel: "Fatture",
              }}
              onRowClick={(r) => navigate("/fatture/" + r.id)}
            />
          ) : (
            <EmptyState
              title={
                q ? "Nessuna fattura trovata" : "Non ci sono ancora fatture"
              }
              description="Crea una fattura dalle prestazioni eseguite e non ancora fatturate."
            />
          )}
        </>
      )}
    </LoadState>
  );
}
export function InvoicePage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    a = useAction();
  const load = useLoad(() => api("/fatture/dettaglio", { id }), [id]);
  const f = load.data;
  const [method, setMethod] = useState("carta"),
    [paidDate, setPaidDate] = useState(today());
  const run = (path: string, body: Data = {}, message?: string) =>
    a.act(async () => {
      await api(path, { id, ...body });
      load.reload();
    }, message);
  return (
    <LoadState load={load}>
      {f && (
        <>
          <PageHeader
            title={
              f.numero_testo
                ? `${f.tipo === "nota_credito" ? "Nota di credito" : "Fattura"} ${f.numero_testo}`
                : "Bozza fattura"
            }
            back={{ to: "/fatture", label: "Fatturazione" }}
            actions={
              f.stato !== "bozza" ? (
                <>
                  <IconButton
                    label="Scarica PDF"
                    icon={<Download size={16} />}
                    onClick={() =>
                      a.act(() => download("/fatture/scarica-pdf", { id }))
                    }
                  />
                  <IconButton
                    label="Scarica fattura elettronica"
                    icon={<FileSpreadsheet size={16} />}
                    onClick={() =>
                      a.act(() => download("/fatture/scarica-xml", { id }))
                    }
                  />
                </>
              ) : undefined
            }
          />
          <DetailList
            items={[
              { label: "Stato", value: <StatePill value={f.stato} /> },
              { label: "Data", value: date(f.date) },
              { label: "Totale", value: money(f.totale_cents) },
              { label: "Bollo", value: money(f.bollo_cents) },
              {
                label: "Pagamento",
                value: f.pagamento
                  ? `${f.pagamento.metodo} · ${date(f.pagamento.data)}`
                  : "Da incassare",
              },
            ]}
          />
          <Section title="Prestazioni">
            <DetailList
              items={(f.righe || []).map((r: Data, i: number) => ({
                label: `${i + 1}. ${r.descrizione}`,
                value:
                  r.importo_cents !== undefined
                    ? money(r.importo_cents)
                    : money(
                        Math.round((r.prezzo || 0) * (r.quantita || 1) * 100),
                      ),
              }))}
            />
          </Section>
          {["emessa", "pagata"].includes(f.stato) && (
            <InvoiceFiscalActions invoice={f} onChanged={load.reload} />
          )}
          {f.stato === "bozza" && (
            <div>
              <Button
                variant="primary"
                disabled={a.busy}
                onClick={() => run("/fatture/emetti", {}, "Fattura emessa")}
              >
                {a.busy ? "Emissione in corso" : "Emetti fattura"}
              </Button>
            </div>
          )}
          {f.stato === "emessa" && f.tipo === "fattura" && (
            <Section title="Registra incasso">
              <SelectField
                label="Metodo di pagamento"
                value={method}
                onChange={setMethod}
                options={[
                  { value: "carta", label: "Carta" },
                  { value: "bonifico", label: "Bonifico" },
                  { value: "contanti", label: "Contanti" },
                ]}
              />
              <TextField
                label="Data incasso"
                type="date"
                value={paidDate}
                onChange={setPaidDate}
              />
              <div>
                <Button
                  variant="primary"
                  disabled={a.busy || !paidDate}
                  onClick={() =>
                    run(
                      "/fatture/paga",
                      { metodo: method, data: paidDate },
                      "Incasso registrato",
                    )
                  }
                >
                  Registra incasso
                </Button>
              </div>
            </Section>
          )}
          {["emessa", "pagata"].includes(f.stato) && f.tipo === "fattura" && (
            <div>
              <Button
                variant="secondary"
                onClick={() => navigate(`/fatture/${id}/storno`)}
              >
                Crea nota di credito
              </Button>
            </div>
          )}
        </>
      )}
    </LoadState>
  );
}
