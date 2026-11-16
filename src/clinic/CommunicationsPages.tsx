// Registro e variazioni: promemoria e invii eseguiti soltanto dall'API originale.
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Send, RefreshCw } from "lucide-react";
import FilterTable, {
  type TableRow,
} from "@/components/primitives/FilterTable";
import { PageHeader } from "@/components/app/PageHeader";
import { PageTabs } from "@/components/app/PageTabs";
import { RowList } from "@/components/app/RowList";
import { Section, DetailList } from "@/components/app/Section";
import { Button } from "@/components/atoms/Button";
import { EmptyState } from "@/components/app/PageState";
import { IconButton } from "@/components/app/IconButton";
import { TableToolbar, matches } from "@/components/app/TableToolbar";
import { api, type Data } from "./api";
import {
  LoadState,
  useLoad,
  useAction,
  date,
  StatePill,
  statusLabel,
} from "./common";
export function CommunicationsPage() {
  const [params, setParams] = useSearchParams(),
    tab = params.get("scheda") || "Messaggi",
    [q, setQ] = useState("");
  const a = useAction();
  const load = useLoad(async () => {
    const [messages, variations] = await Promise.all([
      api("/comunicazioni/messaggi"),
      api("/comunicazioni/variazioni"),
    ]);
    return { messages, variations };
  });
  const d = load.data;
  const run = (path: string, body: Data = {}, message?: string) =>
    a.act(async () => {
      await api(path, body);
      load.reload();
    }, message);
  return (
    <LoadState load={load} wide>
      <PageHeader
        title="Comunicazioni"
        subtitle="Promemoria e variazioni degli appuntamenti."
        actions={
          <>
            <IconButton
              label="Prepara promemoria"
              icon={<RefreshCw size={16} />}
              onClick={() =>
                run(
                  "/comunicazioni/promemoria-esegui",
                  {},
                  "Promemoria preparati",
                )
              }
            />
            <IconButton
              label="Elabora coda"
              icon={<Send size={16} />}
              onClick={() =>
                run("/comunicazioni/elabora", {}, "Coda elaborata")
              }
            />
          </>
        }
      />
      <PageTabs
        options={["Messaggi", "Variazioni"]}
        value={tab}
        onChange={(v) => setParams({ scheda: v })}
        label="Comunicazioni"
      />
      {d && tab === "Messaggi" && (
        <>
          <TableToolbar
            query={q}
            onQuery={setQ}
            placeholder="Cerca paziente o testo"
          />
          {d.messages.messaggi.length ? (
            <FilterTable
              fill
              pageSize={20}
              rows={d.messages.messaggi
                .filter((m: Data) => matches(q, m.paziente, m.body))
                .map(
                  (m: Data): TableRow => ({
                    id: m.id,
                    task: m.paziente || "Comunicazione",
                    date: date(m.created_at),
                    owner:
                      (
                        {
                          whatsapp: "WhatsApp",
                          sms: "SMS",
                          email: "Email",
                        } as Data
                      )[m.channel] || m.channel,
                    status:
                      m.status === "inviato"
                        ? "done"
                        : m.status === "errore"
                          ? "progress"
                          : "todo",
                  }),
                )}
              labels={{
                columns: {
                  task: "Paziente",
                  date: "Data",
                  status: "Stato",
                  owner: "Canale",
                },
                all: "Tutti",
                statuses: {
                  todo: "In attesa",
                  progress: "Da riprovare",
                  done: "Inviati",
                },
                tableLabel: "Registro comunicazioni",
              }}
              onRowClick={(r) => {
                location.hash = "/comunicazioni/" + r.id;
              }}
            />
          ) : (
            <EmptyState
              title="Nessun messaggio"
              description="Prepara i promemoria della prossima settimana per cominciare."
            />
          )}
          <p className="text-[12px] text-ink-3">
            {Math.min(d.messages.totale, 100)} messaggi caricati su{" "}
            {d.messages.totale}.
          </p>
        </>
      )}
      {d &&
        tab === "Variazioni" &&
        (d.variations.variazioni.length ? (
          <Section title="Da gestire">
            <RowList
              rows={d.variations.variazioni.map((v: Data) => ({
                key: v.id,
                to: `/comunicazioni/variazione/${v.id}`,
                title: v.paziente,
                meta: (v.righe || []).join(" · "),
                status: {
                  label: statusLabel(v.stato),
                  tone:
                    v.stato === "da_inviare"
                      ? ("orange" as const)
                      : ("neutral" as const),
                },
              }))}
              wrap
            />
          </Section>
        ) : (
          <EmptyState title="Nessuna variazione da gestire" />
        ))}
    </LoadState>
  );
}
export function MessagePage() {
  const { id } = useParams();
  const a = useAction();
  const load = useLoad(async () => {
    const d = await api("/comunicazioni/messaggi");
    const m = d.messaggi.find((x: Data) => x.id === id);
    if (!m) throw new Error("Messaggio non trovato nel registro recente.");
    return m;
  }, [id]);
  const m = load.data;
  return (
    <LoadState load={load}>
      {m && (
        <>
          <PageHeader
            title={m.paziente || "Messaggio"}
            back={{ to: "/comunicazioni", label: "Comunicazioni" }}
          />
          <DetailList
            items={[
              { label: "Data", value: date(m.created_at) },
              {
                label: "Canale",
                value:
                  (
                    { whatsapp: "WhatsApp", sms: "SMS", email: "Email" } as Data
                  )[m.channel] || m.channel,
              },
              { label: "Stato", value: <StatePill value={m.status} /> },
            ]}
          />
          <Section title="Testo">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
              {m.body}
            </p>
          </Section>
          {m.status === "errore" && (
            <div>
              <Button
                variant="primary"
                disabled={a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/comunicazioni/riprova", { id });
                    load.reload();
                  }, "Nuovo tentativo richiesto")
                }
              >
                Riprova invio
              </Button>
            </div>
          )}
        </>
      )}
    </LoadState>
  );
}
export function VariationPage() {
  const { id } = useParams(),
    a = useAction();
  const load = useLoad(async () => {
    const d = await api("/comunicazioni/variazioni");
    const v = d.variazioni.find((x: Data) => x.id === id);
    if (!v)
      throw new Error(
        "Questa variazione è già stata gestita o non è disponibile.",
      );
    return v;
  }, [id]);
  const v = load.data;
  return (
    <LoadState load={load}>
      {v && (
        <>
          <PageHeader
            title={v.paziente || "Variazione appuntamenti"}
            back={{
              to: "/comunicazioni?scheda=Variazioni",
              label: "Variazioni",
            }}
          />
          <div>
            <StatePill value={v.stato} />
          </div>
          <Section title="Variazioni">
            <ul className="space-y-2 text-[14px] text-ink">
              {(v.righe || []).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Section>
          <div>
            {["da_comunicare", "da_inviare"].includes(v.stato) && (
              <Button
                variant="primary"
                disabled={a.busy}
                onClick={() =>
                  a.act(async () => {
                    await api("/comunicazioni/variazione-spunta", { id });
                    location.hash = "/comunicazioni?scheda=Variazioni";
                  }, "Chiamata registrata")
                }
              >
                Ho chiamato: accoda riepilogo SMS
              </Button>
            )}
          </div>
        </>
      )}
    </LoadState>
  );
}
