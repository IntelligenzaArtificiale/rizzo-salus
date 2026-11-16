/*
 * Assistente AI con cronologia delle conversazioni nella Sidebar Nav (come l'esempio di
 * Beautiful UI). Vuoto: saluto, Prompt Bar e domande suggerite. Conversazione: domande
 * dell'utente e risposte in sequenza (AssistantReply). ?domanda= apre una chat già avviata.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ClipboardList, FileText, ListChecks, Mail } from "lucide-react";
import PromptBar from "@/components/primitives/PromptBar";
import GlideMenu from "@/components/primitives/GlideMenu";
import { AppLayout } from "@/layouts/AppLayout";
import { AssistantReply } from "@/pages/assistant/AssistantReply";
import { scenarioFor, SCENARIOS, type Scenario } from "@/pages/assistant/scenarios";
import { PROMPT_COMMANDS, PROMPT_LABELS, PROMPT_SOURCES } from "@/pages/assistant/composer";
import { CHATS } from "@/api/feed";
import { useChatHistory } from "@/pages/assistant/useChatHistory";
import { readSession } from "@/lib/session";
import { usePlatform } from "@/lib/platform/PlatformContext";
import { useToast } from "@/components/feedback/toast-context";
import { dictationSupported, startDictation } from "@/lib/speech/dictation";

type Turn = { id: number; prompt: string; scenario: Scenario };

const SUGGESTION_ICONS = [<ListChecks key="check" size={15} />, <FileText key="file" size={15} />, <ClipboardList key="list" size={15} />, <Mail key="mail" size={15} />];

export function AssistantPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const user = readSession()!;
  const { on } = usePlatform();
  const toast = useToast();
  const DICTATION_ERRORS: Record<string, string> = { "non-consentito": "Consenti l'uso del microfono nelle impostazioni del browser.", "nessun-microfono": "Nessun microfono trovato.", rete: "La dettatura richiede la connessione." };
  const dictate = on("dettatura") && dictationSupported
    ? (onText: (t: string) => void) => startDictation(onText, (e) => toast.show({ tone: "error", title: "Dettatura non disponibile", body: DICTATION_ERRORS[e] }))
    : null;
  const history = useChatHistory(id);
  const [turns, setTurns] = useState<Turn[]>([]);
  const counter = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const thread = history.thread;

  const ask = (prompt: string, scenario: Scenario = scenarioFor(prompt)) =>
    setTurns((t) => [...t, { id: ++counter.current, prompt, scenario }]);

  /* conversazione aperta: si ricarica quando cambia id o quando la cronologia è arrivata */
  useEffect(() => {
    setTurns([]);
    if (thread) ask(thread.prompt, SCENARIOS[thread.id] ?? scenarioFor(thread.prompt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, thread?.id]);

  useEffect(() => {
    const question = params.get("domanda");
    if (!question) return;
    setParams({}, { replace: true });
    void start(question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    /* tra graffe: in Chromium recente scrollIntoView restituisce una Promise, non una pulizia */
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length]);

  async function start(prompt: string) {
    if (id) return ask(prompt);
    const created = await history.create(prompt);
    if (created) navigate(`/assistente/${created.id}`);
  }

  const composer = (tall: boolean) => (
    <PromptBar demo={false} tall={tall} showModel={false} dictate={dictate} sources={PROMPT_SOURCES} commands={PROMPT_COMMANDS} labels={PROMPT_LABELS}
      placeholder="Chiedi qualcosa sulle tue richieste" onSend={(text) => { if (text.trim()) void start(text.trim()); }} />
  );

  return (
    <AppLayout chats={history.chats}>
      {turns.length === 0 ? (
        <div className="mx-auto flex min-h-full w-full max-w-[660px] flex-col justify-center gap-5 px-4 py-10">
          <h1 className="text-[26px] font-medium tracking-[-0.02em] text-ink">
            <span className="block text-ink-3">Ciao {user.name.split(" ")[0]}</span>
            Come posso aiutarti?
          </h1>
          {composer(true)}
          <GlideMenu className="-mx-2 flex flex-col" highlightClassName="inset-x-0 rounded-[8px] bg-hover">
            {CHATS.map((c, i) => (
              <button key={c.id} type="button" data-menu-row onClick={() => void start(c.prompt)} className="relative z-10 flex h-9 items-center gap-2.5 rounded-[8px] px-2 text-left text-[14px] text-ink">
                <span className="text-ink-3">{SUGGESTION_ICONS[i]}</span>
                {c.prompt}
              </button>
            ))}
          </GlideMenu>
        </div>
      ) : (
        <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col px-4">
          <div className="flex flex-1 flex-col gap-8 py-8">
            {turns.map((turn) => (
              <div key={turn.id} className="flex flex-col gap-4">
                <p className="max-w-[80%] self-end rounded-2xl bg-field px-3.5 py-2 text-[14px] leading-[1.45] text-ink">{turn.prompt}</p>
                <AssistantReply scenario={turn.scenario} onFollowUp={ask} speakable={on("letturaVoce")} />
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="sticky bottom-0 bg-surface pt-2 pb-4">{composer(false)}</div>
        </div>
      )}
      {history.dialog}
    </AppLayout>
  );
}
