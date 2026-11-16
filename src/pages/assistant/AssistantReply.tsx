/*
 * Una risposta dell'assistente, in sequenza come nell'esempio di Beautiful UI:
 * attesa (Loading State) → ragionamento (Thinking) → domande (Approval Card) o letture
 * (Tool Chips) → testo con fonti (Streaming Text) → blocco d'azione finale.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/primitives/LoadingState";
import ThinkingState from "@/components/primitives/ThinkingState";
import ToolChips from "@/components/primitives/ToolChips";
import ApprovalCard from "@/components/primitives/ApprovalCard";
import StreamingText from "@/components/primitives/StreamingText";
import { ReplyExtra } from "@/pages/assistant/ReplyExtra";
import { ListenButton } from "@/pages/assistant/ListenButton";
import type { Scenario } from "@/pages/assistant/scenarios";

type Phase = "loading" | "thinking" | "asking" | "tools" | "answer" | "done";

export function AssistantReply({ scenario, onFollowUp, speakable }: { scenario: Scenario; onFollowUp: (text: string) => void; speakable: boolean }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const reached = (p: Phase) => ["loading", "thinking", "asking", "tools", "answer", "done"].indexOf(phase) >= ["loading", "thinking", "asking", "tools", "answer", "done"].indexOf(p);

  useEffect(() => {
    const t = setTimeout(() => setPhase("thinking"), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "tools") return;
    const t = setTimeout(() => setPhase("answer"), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  const afterThinking = () => setPhase(scenario.approval ? "asking" : scenario.tools ? "tools" : "answer");

  return (
    <div className="flex flex-col gap-4">
      {phase === "loading" && <LoadingState variant="Dots" label="Sto leggendo la domanda" />}
      {reached("thinking") && (
        <ThinkingState variant={scenario.thinking.variant} rows={scenario.thinking.rows} active={scenario.thinking.active} done={scenario.thinking.done} onSettled={afterThinking} />
      )}
      {scenario.approval && reached("asking") && (
        <ApprovalCard
          resettable={false}
          questions={scenario.approval}
          labels={{ skip: "Salta", continue: "Continua", send: "Invia", customPlaceholder: "Altro…", sentMessage: "Risposte inviate" }}
          onSubmitted={() => setPhase("answer")}
        />
      )}
      {scenario.tools && reached("tools") && (
        <ToolChips className="max-w-96" steps={scenario.tools} diffs={[]} labels={{ header: `${scenario.tools.length} passaggi`, more: "" }} />
      )}
      {reached("answer") && (
        <StreamingText
          fill
          loop={false}
          content={scenario.answer}
          sources={scenario.sources}
          followUps={scenario.followUps}
          labels={{ sources: scenario.sources.length === 1 ? "1 fonte" : `${scenario.sources.length} fonti`, followUps: "Puoi chiedere anche" }}
          onDone={() => setPhase("done")}
          onFollowUp={(text) => onFollowUp(text)}
        />
      )}
      {phase === "done" && speakable && <ListenButton text={scenario.answer.map((t) => t.text).join(" ")} />}
      {phase === "done" && <ReplyExtra kind={scenario.extra} onOpen={(to) => navigate(to)} />}
    </div>
  );
}
