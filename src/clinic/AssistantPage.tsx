// Conversazione reale; nessuna risposta o attività simulata del boilerplate.
import { useState } from "react";
import { Page } from "@/layouts/AppLayout";
import { PageHeader } from "@/components/app/PageHeader";
import PromptBar from "@/components/primitives/PromptBar";
import StreamingText from "@/components/primitives/StreamingText";
import LoadingState from "@/components/primitives/LoadingState";
import GlideMenu from "@/components/primitives/GlideMenu";
import { EmptyState } from "@/components/app/PageState";
import { Button } from "@/components/atoms/Button";
import { useClinic } from "./ClinicContext";
import { OperatorPlanCard } from "./OperatorPlanCard";
import { api, type Data } from "./api";
import { useLoad, useAction } from "./common";
const suggestions: Record<string, string[]> = {
  titolare: [
    "Crea un nuovo paziente: quali dati ti servono?",
    "Registra una spesa: quali dati ti servono?",
    "Voglio caricare materiale in magazzino",
  ],
  segreteria: [
    "Chi viene domani mattina?",
    "Ci sono buchi liberi giovedì pomeriggio?",
    "Quali pazienti hanno sedute da pianificare?",
  ],
  fisioterapista: [
    "Chi ho domani?",
    "Quante sedute ho questa settimana?",
    "A che punto è il ciclo dei miei pazienti?",
  ],
  medico: [
    "Quali visite ho questa settimana?",
    "Quanto ho fatturato questo mese?",
  ],
};
type Message = { role: "user" | "assistant"; text: string; plan?: Data };
export function AssistantPage() {
  const { user, refresh } = useClinic();
  const load = useLoad(() => api("/assistente/stato"));
  const a = useAction();
  const [messages, setMessages] = useState<Message[]>([]);
  const [operating, setOperating] = useState(false);
  const send = (q: string) => {
    if (a.busy || operating || !q.trim() || !load.data?.configurata) return;
    a.act(async () => {
      const history = messages.slice(-6);
      setMessages((m) => [...m, { role: "user", text: q }]);
      try {
        const r = await api("/assistente/chiedi", {
          domanda: q,
          storia: history,
        });
        setMessages((m) => [...m, { role: "assistant", text: r.risposta, plan: r.piano }]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: (e as Error).message },
        ]);
        throw e;
      }
    });
  };
  return (
    <Page>
      <PageHeader
        title="AI operatore"
        subtitle="Agenda, pazienti, incassi, personale e magazzino. Chiedi, controlla e conferma."
        actions={
          messages.length ? (
            <Button
              variant="secondary"
              disabled={a.busy || operating}
              onClick={() => setMessages([])}
            >
              Nuova conversazione
            </Button>
          ) : undefined
        }
      />
      {load.loading ? (
        <LoadingState variant="Dots" label="Controllo disponibilità" />
      ) : load.error ? (
        <EmptyState
          title="Assistente non disponibile"
          description={load.error}
          action={
            <Button variant="secondary" onClick={load.reload}>
              Riprova
            </Button>
          }
        />
      ) : !load.data?.configurata ? (
        <EmptyState
          title="L’assistente non è ancora disponibile"
          description="La configurazione della struttura deve essere completata. Puoi continuare a usare agenda e pianificazione."
        />
      ) : (
        <>
          {!messages.length && (
            <section className="flex flex-col gap-5 py-8">
              <h2 className="text-[26px] font-medium tracking-tight text-ink">
                Come posso aiutarti?
              </h2>
              <GlideMenu
                className="flex flex-col gap-1"
                highlightClassName="inset-x-0 rounded-control bg-hover"
              >
                {(suggestions[user?.role] || suggestions.segreteria).map(
                  (q) => (
                    <button
                      data-menu-row
                      className="relative z-10 rounded-control px-3 py-3 text-left text-[14px] text-ink-2"
                      key={q}
                      disabled={a.busy || operating}
                      onClick={() => send(q)}
                    >
                      {q}
                    </button>
                  ),
                )}
              </GlideMenu>
            </section>
          )}
          <div className="flex flex-col gap-6" aria-live="polite">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[85%] rounded-card bg-inset px-4 py-3 text-[14px] text-ink"
                >
                  {m.text}
                </div>
              ) : (
                // Nasconde i controlli dimostrativi del componente, senza cambiare il vendor.
                <div key={i}><div className="[&>div>div]:hidden">
                  <StreamingText
                    fill
                    loop={false}
                    content={m.text.split(/\s+/).map((text) => ({ text }))}
                    sources={[]}
                    followUps={[]}
                  />
                </div>
                {m.plan && <OperatorPlanCard plan={m.plan} blocked={operating || a.busy} onBusy={setOperating} onChanged={(plan) => {
                  setMessages((items) => items.map((entry, index) => index === i ? { ...entry, plan, text: plan.stato === "applicato" ? "Operazioni applicate nel gestionale." : "Piano scartato: nessuna modifica applicata." } : entry));
                  if (plan.stato === "applicato") void a.act(() => refresh());
                }} />}
                </div>
              ),
            )}
            {a.busy && (
              <LoadingState variant="Dots" label="Sto preparando la risposta" />
            )}
          </div>
          <fieldset disabled={a.busy || operating} className="mt-auto min-w-0 pt-4">
            <PromptBar
              demo={false}
              showModel={false}
              dictate={null}
              sources={[]}
              commands={[]}
              placeholder="Es. registra una spesa, crea un paziente o sposta un appuntamento…"
              labels={{
                prompt: "Domanda",
                send: "Invia",
                attach: "Fonti",
                remove: "Rimuovi",
              }}
              onSend={send}
            />
          </fieldset>
          <p className="text-center text-[12px] text-ink-3">
            Operazioni limitate al tuo ruolo e applicate dopo conferma. I dati necessari
            alla richiesta sono elaborati tramite AI; evita dati clinici nel testo libero.
          </p>
        </>
      )}
    </Page>
  );
}
