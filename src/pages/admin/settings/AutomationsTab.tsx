/*
 * Automazioni: regola di assegnazione (Flowchart di Beautiful UI) e attività pianificate eseguite
 * dal server (cron). Per ogni attività: frequenza in parole, ultimo esito, prossima esecuzione,
 * interruttore (salvato subito), esecuzione manuale e storico. L'espressione cron è un dettaglio
 * per chi configura il server e compare solo nello storico.
 */
import { useState } from "react";
import { ClipboardList, History, Play } from "lucide-react";
import Flowchart from "@/components/primitives/Flowchart";
import { Switch } from "@/components/atoms/Switch";
import { StatusPill } from "@/components/atoms/StatusPill";
import { SettingsSection } from "@/components/app/SettingsSection";
import { ActionMenu } from "@/components/app/ActionMenu";
import { Timeline } from "@/components/app/Timeline";
import { PageError, PageLoading } from "@/components/app/PageState";
import { useToast } from "@/components/feedback/toast-context";
import { listJobs, runJob, setJobActive, type Job } from "@/api/admin";
import { CATEGORIES } from "@/api/requests";
import { useLoad } from "@/lib/data/useLoad";

export function AutomationsTab() {
  return (
    <div>
      <SettingsSection title="Attività pianificate" description="Lavori che il server esegue da solo. Spegnili per sospenderli, avviali a mano quando serve.">
        <Jobs />
      </SettingsSection>
      <SettingsSection title="Assegnazione automatica" description="Cosa succede quando arriva una nuova richiesta.">
        <Flowchart
          icon={<ClipboardList size={16} />}
          steps={[
            { id: "trigger", row: 0, x: 0.5, w: 300, kind: { label: "Quando", hue: "#9a5cff" }, hue: "#9a5cff", title: "Arriva una richiesta", caption: "Parte a ogni nuova richiesta" },
            { id: "cond", row: 1, x: 0.5, w: 356, kind: { label: "Se / Altrimenti", hue: "#f09a2f" }, condition: true },
          ]}
          condition={{
            source: "richiesta",
            properties: ["categoria", "priorità", "cliente"],
            values1: CATEGORIES.map((c) => ({ name: c, tag: "Categoria" })),
            values2: [{ name: "alta" }, { name: "media" }, { name: "bassa" }],
            initial: { prop1: "categoria", val1: "Assistenza tecnica", prop2: "priorità", val2: "alta" },
            words: { if: "Se", and: "e", is: "è" },
          }}
        />
      </SettingsSection>
    </div>
  );
}

function Jobs() {
  const toast = useToast();
  const { data, error, reload, setData } = useLoad(listJobs);
  const [running, setRunning] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  if (error) return <PageError onRetry={reload} />;
  if (!data) return <PageLoading label="Carico le attività" />;

  const replace = (job: Job) => setData(data.map((j) => (j.id === job.id ? job : j)));
  const toggle = async (job: Job, attivo: boolean) => {
    replace({ ...job, attivo });
    const r = await setJobActive(job.id, attivo);
    if (r.ok) { replace(r.data); toast.show({ tone: "success", title: attivo ? `«${job.nome}» acceso` : `«${job.nome}» sospeso` }); }
    else { replace(job); toast.show({ tone: "error", title: "Modifica non salvata" }); }
  };
  const run = async (job: Job) => {
    if (running) return;
    setRunning(job.id);
    const r = await runJob(job.id);
    setRunning(null);
    if (r.ok) { replace(r.data); setOpen(job.id); toast.show({ tone: "success", title: `«${job.nome}» completata` }); }
    else toast.show({ tone: "error", title: `«${job.nome}» non riuscita`, body: "Riprova o controlla lo storico." });
  };

  return (
    <ul className="overflow-hidden rounded-card bg-surface shadow-card">
      {data.map((job) => {
        const last = job.esecuzioni[0];
        const isRunning = running === job.id;
        return (
          <li key={job.id} data-row className="border-b border-line last:border-0">
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium text-ink">{job.nome}</span>
                  {isRunning ? <StatusPill tone="accent">In esecuzione</StatusPill>
                    : !job.attivo ? <StatusPill tone="neutral">Sospesa</StatusPill>
                    : last ? <StatusPill tone={last.esito === "completata" ? "green" : "red"}>{last.esito === "completata" ? "Riuscita" : "Non riuscita"}</StatusPill>
                    : <StatusPill tone="neutral">Mai eseguita</StatusPill>}
                </div>
                <p className="text-[13px] text-ink-2">{job.descrizione}</p>
                <p className="text-[12.5px] text-ink-3">{job.frequenza}{job.attivo ? ` · prossima: ${job.prossima.toLowerCase()}` : ""}{last ? ` · ultima: ${last.quando.toLowerCase()}` : ""}</p>
              </div>
              <Switch checked={job.attivo} onChange={(v) => void toggle(job, v)} label={`${job.nome}: ${job.attivo ? "accesa" : "sospesa"}`} />
              <ActionMenu label={`Azioni per ${job.nome}`} visible actions={[
                { label: isRunning ? "In esecuzione" : "Esegui ora", icon: <Play size={15} />, onSelect: () => void run(job) },
                { label: open === job.id ? "Nascondi storico" : "Mostra storico", icon: <History size={15} />, onSelect: () => setOpen(open === job.id ? null : job.id) },
              ]} />
            </div>
            {open === job.id && (
              <div className="anim-swap border-t border-line bg-inset/50 px-4 py-4">
                {job.esecuzioni.length ? (
                  <Timeline label={`Storico di ${job.nome}`} events={job.esecuzioni.map((e, i) => ({
                    key: `${i}-${e.quando}`, when: `${e.quando} · ${e.durata}`, title: e.esito === "completata" ? "Riuscita" : "Non riuscita",
                    status: e.esito === "completata" ? undefined : { label: "Da controllare", tone: "red" }, detail: e.nota,
                  }))} />
                ) : <p className="text-[13px] text-ink-2">Ancora nessuna esecuzione.</p>}
                <p className="mt-4 text-[12px] text-ink-3">Pianificazione sul server: <code className="font-mono">{job.cron}</code></p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
