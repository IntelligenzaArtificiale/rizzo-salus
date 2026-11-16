import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Section, DetailList } from "@/components/app/Section";
import { RowList } from "@/components/app/RowList";
import { Button } from "@/components/atoms/Button";
import { StatusPill } from "@/components/atoms/StatusPill";
import { TextField } from "@/components/form/TextField";
import { SelectField } from "@/components/form/SelectField";
import { TextAreaField } from "@/components/form/TextAreaField";
import { ClinicFileField } from "./ClinicFileField";
import { useClinic } from "./ClinicContext";
import { api, download, type Data } from "./api";
import {
  useLoad,
  useAction,
  LoadState,
  today,
  money,
  date,
  name,
} from "./common";
export function CompensationsPage() {
  const { catalog, can } = useClinic();
  const [pro, setPro] = useState(""),
    [from, setFrom] = useState(today().slice(0, 7) + "-01"),
    [to, setTo] = useState(today()),
    [detail, setDetail] = useState<Data | null>(null),
    [receipt, setReceipt] = useState<Data>({}),
    [draft, setDraft] = useState<Data | null>(null);
  const a = useAction();
  const load = useLoad(
    () => api("/compensi/elenco", pro ? { professional_id: pro } : {}),
    [pro],
  );
  const refresh = async (id: string) => {
    setDetail(await api("/compensi/dettaglio", { id }));
    load.reload();
  };
  return (
    <LoadState load={load}>
      <PageHeader
        title="Compensi"
        subtitle="Prestazioni eseguite, costi materiali, approvazione e contabile del pagamento."
      />
      {can("compensi.vedi_tutti") && (
        <Section title="Calcola periodo">
          <SelectField
            label="Professionista"
            value={pro}
            onChange={setPro}
            options={[
              { value: "", label: "Scegli professionista" },
              ...catalog.professionisti.map((p: Data) => ({
                value: p.id,
                label: name(p),
              })),
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Dal"
              type="date"
              value={from}
              onChange={setFrom}
            />
            <TextField label="Al" type="date" value={to} onChange={setTo} />
          </div>
          <Button
            disabled={!pro || a.busy}
            onClick={() =>
              a.act(async () => {
                setDetail(
                  await api("/compensi/calcola", {
                    professional_id: pro,
                    da: from,
                    a: to,
                  }),
                );
                load.reload();
              })
            }
          >
            Calcola compenso
          </Button>
        </Section>
      )}
      <Section title="Prospetti">
        <RowList
          rows={(load.data?.compensi ?? []).map((r: Data) => ({
            key: r.id,
            title: name(
              catalog.professionisti.find(
                (p: Data) => p.id === r.professional_id,
              ) ?? {},
            ),
            meta:
              date(r.da) +
              " – " +
              date(r.a) +
              " · " +
              money(r.quota_professionista_cents),
            actions: (
              <div className="flex gap-2">
                <StatusPill
                  tone={r.stato === "liquidato" ? "green" : "neutral"}
                >
                  {r.stato}
                </StatusPill>
                <Button onClick={() => a.act(() => refresh(r.id))}>
                  Dettaglio
                </Button>
              </div>
            ),
          }))}
        />
      </Section>
      {detail && (
        <Section title="Dettaglio del compenso">
          <DetailList
            items={[
              {
                label: "Totale prestazioni",
                value: money(detail.totale_base_cents),
              },
              {
                label: "Compenso professionista",
                value: money(detail.quota_professionista_cents),
              },
              {
                label: "Quota struttura al netto dei materiali",
                value: money(detail.quota_struttura_cents),
              },
            ]}
          />
          <RowList
            rows={detail.righe.map((r: Data) => ({
              key: r.appointment_id + "|" + r.patient_id,
              title: r.descrizione,
              meta:
                date(r.data) +
                " · " +
                r.percentuale +
                "% · Materiali " +
                money(r.materiali_cents ?? 0) +
                " · Compenso " +
                money(r.quota_professionista_cents),
              actions:
                can("compensi.vedi_tutti") && detail.stato === "calcolato" ? (
                  <MaterialException
                    row={r}
                    onSaved={() =>
                      a.act(async () => {
                        await api("/compensi/calcola", {
                          professional_id: detail.professional_id,
                          da: detail.da,
                          a: detail.a,
                        });
                        await refresh(detail.id);
                      })
                    }
                  />
                ) : undefined,
            }))}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                a.act(() => download("/compensi/prospetto", { id: detail.id }))
              }
            >
              Scarica prospetto
            </Button>
            {detail.ricevuta && (
              <Button
                onClick={() =>
                  a.act(() => download("/compensi/scarica", { id: detail.id }))
                }
              >
                Scarica contabile
              </Button>
            )}
            {can("compensi.vedi_tutti") && detail.stato === "calcolato" && (
              <Button
                disabled={a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/compensi/stato", {
                      id: detail.id,
                      stato: "approvato",
                    });
                    await refresh(detail.id);
                  }, "Compenso approvato")
                }
              >
                Approva importo
              </Button>
            )}
          </div>
          {can("compensi.vedi_tutti") && detail.stato === "approvato" && (
            <>
              <ClinicFileField
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={setReceipt}
              />
              <Button
                disabled={!receipt.base64 || a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/compensi/ricevuta", {
                      id: detail.id,
                      ...receipt,
                    });
                    await refresh(detail.id);
                  }, "Contabile allegata")
                }
              >
                Allega contabile
              </Button>
              <Button
                disabled={!detail.ricevuta || a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/compensi/stato", {
                      id: detail.id,
                      stato: "liquidato",
                    });
                    await refresh(detail.id);
                  }, "Pagamento registrato e spesa contabilizzata")
                }
              >
                Registra pagamento effettuato
              </Button>
            </>
          )}
          {can("compensi.vedi_tutti") && (
            <>
              <Button
                onClick={() =>
                  a.act(async () =>
                    setDraft(
                      await api("/compensi/comunicazione", { id: detail.id }),
                    ),
                  )
                }
              >
                Prepara comunicazione al professionista
              </Button>
              {draft && (
                <>
                  <TextAreaField
                    label="Anteprima della comunicazione"
                    value={draft.testo}
                    onChange={() => {}}
                  />
                  <p className="text-sm text-ink-2">
                    Destinatario:{" "}
                    {draft.destinatario ||
                      "Inserisci l’email del professionista nei cataloghi"}
                  </p>
                  <Button
                    disabled={
                      a.busy ||
                      !draft.destinatario ||
                      detail.stato === "calcolato"
                    }
                    onClick={() =>
                      a.act(async () => {
                        await api("/compensi/comunicazione", {
                          id: detail.id,
                          approva: true,
                        });
                        setDraft(null);
                      }, "Comunicazione approvata e accodata")
                    }
                  >
                    Approva e accoda comunicazione
                  </Button>
                </>
              )}
            </>
          )}
        </Section>
      )}
    </LoadState>
  );
}
function MaterialException({
  row,
  onSaved,
}: {
  row: Data;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false),
    [pct, setPct] = useState(String(row.percentuale)),
    [cost, setCost] = useState(String((row.materiali_cents ?? 0) / 100)),
    [note, setNote] = useState(row.nota_materiali ?? "");
  const a = useAction();
  return (
    <div>
      <Button size="sm" onClick={() => setOpen(!open)}>
        Eccezione
      </Button>
      {open && (
        <div className="min-w-52 rounded-card border border-line p-3">
          <TextField
            label="Percentuale"
            type="number"
            value={pct}
            onChange={setPct}
          />
          <TextField
            label="Materiali in euro"
            type="number"
            value={cost}
            onChange={setCost}
          />
          <TextField label="Motivo" value={note} onChange={setNote} />
          <Button
            disabled={a.busy}
            onClick={() =>
              a.act(async () => {
                await api("/compensi/eccezione", {
                  appointment_id: row.appointment_id,
                  percentuale: Number(pct),
                  materiali: Number(cost),
                  nota: note,
                });
                setOpen(false);
                onSaved();
              })
            }
          >
            Applica e ricalcola
          </Button>
        </div>
      )}
    </div>
  );
}
